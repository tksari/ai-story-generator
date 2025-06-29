import { ref, watch, Ref } from "vue";
import { ElMessage } from "element-plus";
import { useLayoutEditorStore } from "@/stores/layout-editor";
import type { Layout } from "@/types/editor";
import { showConfirm } from "@/utils/message-box.helper.ts";

interface LayoutState {
  currentLayoutName: Ref<string>;
}

interface LayoutMethods {
  addNewLayout: (showMessage?: boolean) => string;
  handleSave: () => Promise<void>;
  updateCurrentLayoutName: () => void;
  getLayoutItemCount: (layoutId: string) => number;
  handleLayoutChange: () => void;
  handleDeleteLayout: (layoutId: string) => Promise<void>;
}

export interface UseEditorLayoutReturn extends LayoutState, LayoutMethods {}

export function useLayoutEditor(): UseEditorLayoutReturn {
  const store = useLayoutEditorStore();

  const currentLayoutName = ref("");

  watch(
    () => store.currentLayout,
    (newLayoutId) => {
      if (newLayoutId) {
        const layout = store.layouts.find((l) => l.id === newLayoutId);
        if (layout) {
          currentLayoutName.value = layout.name;
        } else {
          currentLayoutName.value = "";
        }
      } else {
        currentLayoutName.value = "";
      }
    },
    { immediate: true },
  );

  const addNewLayout = (showMessage: boolean = true): string => {
    const newLayoutId = `layout-${Date.now()}`;
    const newLayout: Layout = {
      id: newLayoutId,
      name: "New Layout",
      items: [],
    };

    store.addLayout(newLayout);
    store.setCurrentLayout(newLayoutId);

    if (showMessage) {
      ElMessage.success("New layout created");
    }

    return newLayoutId;
  };

  const validateLayout = (): { isValid: boolean; message?: string } => {
    const currentLayoutItems = store.items.filter(
      (item) => item.layoutId === store.currentLayout,
    );

    if (currentLayoutItems.length === 0) {
      return {
        isValid: false,
        message:
          "Cannot save empty layout. Please add at least one item to the layout.",
      };
    }

    const currentLayout = store.layouts.find(
      (layout) => layout.id === store.currentLayout,
    );
    if (!currentLayout) {
      return {
        isValid: false,
        message: "Current layout not found",
      };
    }

    return { isValid: true };
  };

  const isNewLayout = (layoutId: string): boolean => {
    return (
      layoutId.startsWith("layout-") && !isNaN(Number(layoutId.split("-")[1]))
    );
  };

  const handleSave = async (): Promise<void> => {
    try {
      const validation = validateLayout();
      if (!validation.isValid) {
        ElMessage.warning(validation.message!);
        return;
      }

      const storeState = {
        items: store.items,
        layouts: store.layouts,
        currentLayout: store.currentLayout,
      };

      const isNew = isNewLayout(store.currentLayout);

      const success = isNew
        ? await store.createLayoutToService(storeState)
        : await store.updateLayoutToService(storeState);

      if (success) {
        ElMessage.success("Changes saved successfully");
      } else {
        ElMessage.error(store.error || "Failed to save changes");
      }
    } catch (error) {
      console.error("Error saving changes:", error);
      ElMessage.error("An unexpected error occurred");
    }
  };

  const updateCurrentLayoutName = (): void => {
    if (!store.currentLayout || !currentLayoutName.value.trim()) {
      const layout = store.layouts.find((l) => l.id === store.currentLayout);
      if (layout && currentLayoutName.value.trim() === "") {
        ElMessage.error("Layout name cannot be empty.");
        currentLayoutName.value = layout.name;
      }
      return;
    }

    const layout = store.layouts.find((l) => l.id === store.currentLayout);
    if (!layout) return;

    store.updateLayout(store.currentLayout, {
      ...layout,
      name: currentLayoutName.value.trim(),
    });
  };

  const getLayoutItemCount = (layoutId: string): number => {
    return store.items.filter((item) => item.layoutId === layoutId).length;
  };

  const handleLayoutChange = (): void => {};

  const handleDeleteLayout = async (layoutId: string): Promise<void> => {
    if (store.layouts.length <= 1) {
      ElMessage.warning("Cannot delete the last layout");
      return;
    }

    try {
      await showConfirm(
        "Are you sure you want to delete this layout? All items in this layout will be permanently deleted.",
        {
          title: "Warning",
          confirmButtonText: "Delete",
          cancelButtonText: "Cancel",
          type: "warning",
        },
      );

      const success = await store.removeLayout(layoutId);

      if (success) {
        if (layoutId === store.currentLayout) {
          const newLayoutId = addNewLayout(false);
          store.setCurrentLayout(newLayoutId);
        }

        ElMessage.success("Layout deleted successfully");
      } else {
        ElMessage.error(store.error || "Failed to delete layout");
      }
    } catch {
      ElMessage.info("Deletion cancelled");
    }
  };

  return {
    currentLayoutName,
    addNewLayout,
    handleSave,
    updateCurrentLayoutName,
    getLayoutItemCount,
    handleLayoutChange,
    handleDeleteLayout,
  };
}
