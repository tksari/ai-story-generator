import { ref, Ref } from "vue";
import type { DragItem, Position } from "@/types/editor";
import { useLayoutEditorStore } from "@/stores/layout-editor";
import { DEFAULT_SIZES } from "./useCanvas";

interface DragData {
  type: "text" | "image";
  content: string;
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontFamily?: string;
}

interface DragDropState {
  isDragging: Ref<boolean>;
  currentItem: Ref<DragItem | null>;
  dragStart: Ref<Position>;
}

interface DragDropMethods {
  handleDragStart: (
    e: DragEvent,
    itemTemplate: Omit<DragItem, "position" | "layoutId">,
  ) => void;
  handleDrop: (e: DragEvent) => void;
  handleDragOver: (e: DragEvent) => void;
}

export interface UseEditorDragDropReturn
  extends DragDropState,
    DragDropMethods {}

export function useDragDrop(
  canvas: Ref<HTMLCanvasElement | null>,
  ctx: Ref<CanvasRenderingContext2D | null>,
): UseEditorDragDropReturn {
  const store = useLayoutEditorStore();

  const isDragging = ref(false);
  const currentItem = ref<DragItem | null>(null);
  const dragStart = ref<Position>({ x: 0, y: 0 });

  const createDragData = (
    itemTemplate: Omit<DragItem, "position" | "layoutId">,
  ): DragData => {
    return {
      type: itemTemplate.type,
      content: itemTemplate.content,
      color: itemTemplate.color,
      backgroundColor: itemTemplate.backgroundColor,
      fontSize:
        itemTemplate.type === "text" ? DEFAULT_SIZES.FONT_SIZE : undefined,
      fontFamily:
        itemTemplate.type === "text" ? DEFAULT_SIZES.FONT_FAMILY : undefined,
    };
  };

  const getDefaultDimensions = (
    type: "text" | "image",
  ): { width: number; height: number } => {
    if (type === "image") {
      return {
        width: DEFAULT_SIZES.IMAGE_WIDTH,
        height: DEFAULT_SIZES.IMAGE_HEIGHT,
      };
    }
    return {
      width: DEFAULT_SIZES.TEXT_WIDTH,
      height: DEFAULT_SIZES.TEXT_HEIGHT,
    };
  };

  const getCanvasCoordinates = (e: DragEvent): Position | null => {
    if (!canvas.value) return null;

    const rect = canvas.value.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleDragStart = (
    e: DragEvent,
    itemTemplate: Omit<DragItem, "position" | "layoutId">,
  ) => {
    if (!e.dataTransfer) return;

    isDragging.value = true;

    currentItem.value = {
      ...itemTemplate,
      fontSize:
        itemTemplate.type === "text" ? DEFAULT_SIZES.FONT_SIZE : undefined,
      fontFamily:
        itemTemplate.type === "text" ? DEFAULT_SIZES.FONT_FAMILY : undefined,
    } as DragItem;

    dragStart.value = {
      x: e.clientX,
      y: e.clientY,
    };

    const dragData = createDragData(itemTemplate);
    e.dataTransfer.setData("text/plain", JSON.stringify(dragData));

    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();

    if (!canvas.value || !ctx.value || !currentItem.value || !e.dataTransfer) {
      resetDragState();
      return;
    }

    const dropPosition = getCanvasCoordinates(e);
    if (!dropPosition) {
      resetDragState();
      return;
    }

    try {
      const dragDataStr = e.dataTransfer.getData("text/plain");
      if (!dragDataStr) {
        resetDragState();
        return;
      }

      const dragData: DragData = JSON.parse(dragDataStr);

      const { width, height } = getDefaultDimensions(dragData.type);

      const newItem: DragItem = {
        type: dragData.type,
        content:
          dragData.content || (dragData.type === "image" ? "" : "Sample Text"),
        color:
          dragData.color || (dragData.type === "text" ? "#000000" : undefined),
        backgroundColor:
          dragData.backgroundColor ||
          (dragData.type === "text" ? "#ffffff" : undefined),
        position: dropPosition,
        width,
        height,
        fontSize:
          dragData.type === "text"
            ? dragData.fontSize || DEFAULT_SIZES.FONT_SIZE
            : undefined,
        fontFamily:
          dragData.type === "text"
            ? dragData.fontFamily || DEFAULT_SIZES.FONT_FAMILY
            : undefined,
        layoutId: store.currentLayout,
      };

      store.addItem(newItem);
    } catch (error) {
      console.error("Error handling drop:", error);
    } finally {
      resetDragState();
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();

    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }
  };

  const resetDragState = () => {
    isDragging.value = false;
    currentItem.value = null;
  };

  return {
    isDragging,
    currentItem,
    dragStart,

    handleDragStart,
    handleDrop,
    handleDragOver,
  };
}
