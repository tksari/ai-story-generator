import { api } from "./api";
import type { DragItem, Layout } from "@/types/editor";

export interface LayoutEditorState {
  items: DragItem[];
  layouts: Layout[];
  currentLayout: string;
}

export const layoutEditorService = {
  async saveEditorState(state: LayoutEditorState) {
    try {
      const currentLayout = state.layouts.find(
        (layout) => layout.id === state.currentLayout,
      );
      if (!currentLayout) {
        throw new Error("Current layout not found");
      }

      const dataToSend = {
        name: currentLayout.name,
        items: state.items.filter(
          (item) => item.layoutId === state.currentLayout,
        ),
      };

      const response = await api.post("/video-layouts", dataToSend);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error("Failed to save editor state");
    }
  },

  async updateEditorState(state: LayoutEditorState) {
    try {
      const currentLayout = state.layouts.find(
        (layout) => layout.id === state.currentLayout,
      );
      if (!currentLayout) {
        throw new Error("Current layout not found");
      }

      const dataToSend = {
        name: currentLayout.name,
        items: state.items.filter(
          (item) => item.layoutId === state.currentLayout,
        ),
      };

      const response = await api.put(
        `/video-layouts/${currentLayout.id}`,
        dataToSend,
      );
      return response;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error("Failed to update editor state");
    }
  },

  async loadEditorState() {
    try {
      const response = await api.get("/video-layouts");

      if (!response?.data?.layouts) {
        throw new Error("Invalid response format from server");
      }

      const layoutsData = response.data.layouts;

      const layouts: Layout[] = layoutsData.map((layoutData: any) => ({
        id: layoutData.id,
        name: layoutData.name,
        items: [],
      }));

      const items: DragItem[] = layoutsData.flatMap((layoutData: any) => {
        const layoutItems = layoutData.items || [];
        return layoutItems.map((item: any) => ({
          ...item,
          layoutId: layoutData.id,
          position: item.position || { x: 0, y: 0 },
          width: item.width || (item.type === "image" ? 200 : undefined),
          height: item.height || (item.type === "image" ? 200 : undefined),
          fontSize: item.fontSize || 20,
          fontFamily: item.fontFamily || "Arial",
          color: item.color || "#000000",
          content: item.content || (item.type === "text" ? "Sample Text" : ""),
        }));
      });

      const currentLayout = layouts[0]?.id || "";

      return {
        items,
        layouts,
        currentLayout,
      };
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error("Failed to load editor state");
    }
  },

  async deleteLayout(layoutId: string) {
    try {
      const response = await api.delete(`/video-layouts/${layoutId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error("Failed to delete layout");
    }
  },
};
