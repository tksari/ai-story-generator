import { Ref } from "vue";
import { ElMessage } from "element-plus";
import { useLayoutEditorStore } from "@/stores/layout-editor";
import { showConfirm } from "@/utils/message-box.helper.ts";

interface ItemMethods {
  handleDeleteItem: (
    selectedItem: Ref<number | null>,
    globalSelectedItemIndex: Ref<number | null>,
    drawCanvas: () => void,
  ) => Promise<void>;
}

export interface UseEditorItemsReturn extends ItemMethods {}

export function useItems(): UseEditorItemsReturn {
  const store = useLayoutEditorStore();

  const handleDeleteItem = async (
    selectedItem: Ref<number | null>,
    globalSelectedItemIndex: Ref<number | null>,
    drawCanvas: () => void,
  ): Promise<void> => {
    if (selectedItem.value === null || globalSelectedItemIndex.value === null) {
      return;
    }

    try {
      await showConfirm("Are you sure you want to delete this item?", {
        title: "Warning",
        confirmButtonText: "Delete",
        cancelButtonText: "Cancel",
      });

      store.removeItem(globalSelectedItemIndex.value);

      selectedItem.value = null;
      globalSelectedItemIndex.value = null;

      drawCanvas();

      ElMessage.success("Item deleted successfully");
    } catch {
      ElMessage.info("Deletion cancelled");
    }
  };

  return {
    handleDeleteItem,
  };
}
