import { defineStore } from "pinia";
import type { DragItem, Layout } from "@/types/editor";
import { layoutEditorService } from "@/services/layout-editor.service";

export const useLayoutEditorStore = defineStore("layout-editor", {
  state: () => {
    const defaultLayout: Layout = {
      id: `layout-${Date.now()}`,
      name: "New Layout",
      items: [],
    };

    return {
      items: [] as DragItem[],
      layouts: [defaultLayout] as Layout[],
      currentLayout: defaultLayout.id,
      isLoading: false,
      error: null as string | null,
    };
  },

  getters: {
    nonEmptyLayouts: (state) => {
      return state.layouts.filter((layout) => {
        const layoutItems = state.items.filter(
          (item) => item.layoutId === layout.id,
        );
        return layoutItems.length > 0;
      });
    },

    currentLayoutItems: (state) => {
      return state.items.filter(
        (item) => item.layoutId === state.currentLayout,
      );
    },
  },

  actions: {
    addItem(item: DragItem) {
      this.items.push({
        ...item,
        layoutId: this.currentLayout,
      });
    },

    updateItem(index: number, item: DragItem) {
      if (this.items[index]) {
        const updatedItem = {
          ...this.items[index],
          ...item,
          layoutId: this.currentLayout,
        };
        this.items[index] = updatedItem;
      }
    },

    removeItem(index: number) {
      if (index >= 0 && index < this.items.length) {
        this.items.splice(index, 1);
      }
    },

    addLayout(layout: Layout) {
      this.layouts.push(layout);
      this.currentLayout = layout.id;
      //this.items = []
    },

    updateLayout(layoutId: string, updatedLayout: Layout) {
      const index = this.layouts.findIndex((l) => l.id === layoutId);
      if (index !== -1) {
        this.layouts[index] = updatedLayout;
      }
    },

    async removeLayout(id: string) {
      try {
        if (!id.startsWith("layout-")) {
          await layoutEditorService.deleteLayout(id);
        }

        const index = this.layouts.findIndex((l) => l.id === id);
        if (index !== -1) {
          this.layouts.splice(index, 1);
          this.items = this.items.filter((item) => item.layoutId !== id);
        }
        return true;
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "Failed to delete layout";
        return false;
      }
    },

    setCurrentLayout(layoutId: string) {
      const layout = this.layouts.find((l) => l.id === layoutId);
      if (layout) {
        this.currentLayout = layoutId;
      }
    },

    async createLayoutToService(state: {
      items: DragItem[];
      layouts: Layout[];
      currentLayout: string;
    }) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await layoutEditorService.saveEditorState(state);

        if (response?.layout?.id) {
          const newLayoutId = response.layout.id;
          const oldLayoutId = state.currentLayout;

          const layoutIndex = this.layouts.findIndex(
            (l) => l.id === oldLayoutId,
          );
          if (layoutIndex !== -1) {
            this.layouts[layoutIndex].id = newLayoutId;
          }

          this.items = this.items.map((item) => {
            if (item.layoutId === oldLayoutId) {
              return { ...item, layoutId: newLayoutId };
            }
            return item;
          });

          this.currentLayout = newLayoutId;
        }

        return true;
      } catch (error) {
        this.error =
          error instanceof Error
            ? error.message
            : "Failed to save editor state";
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async loadFromService(withDefaultLayout: boolean = true) {
      this.isLoading = true;
      this.error = null;
      try {
        const state = await layoutEditorService.loadEditorState();

        this.layouts = [...state.layouts];
        this.items = [...state.items];
        this.currentLayout = state.currentLayout;

        if (this.layouts.length === 0 && withDefaultLayout) {
          const defaultLayout: Layout = {
            id: `layout-${Date.now()}`,
            name: "New Layout",
            items: [],
          };
          this.layouts = [defaultLayout];
          this.currentLayout = defaultLayout.id;
        }
      } catch (error) {
        this.error =
          error instanceof Error
            ? error.message
            : "Failed to load editor state";
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async updateLayoutToService(state: {
      items: DragItem[];
      layouts: Layout[];
      currentLayout: string;
    }) {
      this.isLoading = true;
      this.error = null;
      try {
        await layoutEditorService.updateEditorState(state);
        return true;
      } catch (error) {
        this.error =
          error instanceof Error
            ? error.message
            : "Failed to update editor state";
        return false;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
