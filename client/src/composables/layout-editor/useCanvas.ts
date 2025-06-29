import { ref, computed, Ref, ComputedRef } from "vue";
import type { DragItem, Position } from "@/types/editor";
import { useLayoutEditorStore } from "@/stores/layout-editor";

export const CANVAS_CONFIG = {
  WIDTH: 800,
  HEIGHT: 450,
  MIN_ITEM_SIZE: 20,
  HANDLE_SIZE: 8,
  SELECT_PADDING: 2,
  BACKGROUND_COLOR: "#f0f0f0",
  SELECT_COLOR: "#409EFF",
  IMAGE_PLACEHOLDER_COLOR: "#e0e0e0",
  IMAGE_BORDER_COLOR: "#999999",
  IMAGE_ICON_COLOR: "#666666",
  DEFAULT_TEXT_COLOR: "#000000",
  DEFAULT_TEXT_BACKGROUND_COLOR: "#ffffff",
} as const;

export const DEFAULT_SIZES = {
  IMAGE_WIDTH: 200,
  IMAGE_HEIGHT: 200,
  TEXT_WIDTH: 150,
  TEXT_HEIGHT: 50,
  FONT_SIZE: 20,
  FONT_FAMILY: "Arial",
} as const;

export type ResizeHandle = "nw" | "ne" | "sw" | "se";

interface CanvasState {
  isDragging: Ref<boolean>;
  isResizing: Ref<boolean>;
  selectedItem: Ref<number | null>;
  globalSelectedItemIndex: Ref<number | null>;
  dragStart: Ref<Position>;
  currentItem: Ref<DragItem | null>;
  resizeHandle: Ref<ResizeHandle | null>;
}

interface CanvasMethods {
  handleItemSelect: (localIndex: number | null) => void;
  handleItemResize: (localIndex: number, width: number, height: number) => void;
  handleItemMove: (localIndex: number, x: number, y: number) => void;
  handleMouseDown: (e: MouseEvent) => void;
  handleMouseMove: (e: MouseEvent) => void;
  handleMouseUp: () => void;
  drawCanvas: () => Promise<void>;
  getGlobalIndex: (localIndex: number) => number | null;
}

interface CanvasComputed {
  currentLayoutItems: ComputedRef<DragItem[]>;
  selectedStoreItem: ComputedRef<DragItem | null>;
}

export interface UseEditorCanvasReturn
  extends CanvasState,
    CanvasMethods,
    CanvasComputed {
  canvas: Ref<HTMLCanvasElement | null>;
  ctx: Ref<CanvasRenderingContext2D | null>;
}

export function useCanvas(): UseEditorCanvasReturn {
  const store = useLayoutEditorStore();

  const canvas = ref<HTMLCanvasElement | null>(null);
  const ctx = ref<CanvasRenderingContext2D | null>(null);

  const isDragging = ref(false);
  const isResizing = ref(false);
  const selectedItem = ref<number | null>(null);
  const globalSelectedItemIndex = ref<number | null>(null);
  const dragStart = ref<Position>({ x: 0, y: 0 });
  const currentItem = ref<DragItem | null>(null);
  const resizeHandle = ref<ResizeHandle | null>(null);

  const currentLayoutItems = computed(() => {
    if (!store.currentLayout) return [];
    return store.items.filter((item) => item.layoutId === store.currentLayout);
  });

  const selectedStoreItem = computed(() => {
    if (
      globalSelectedItemIndex.value === null ||
      !store.items[globalSelectedItemIndex.value]
    )
      return null;
    return store.items[globalSelectedItemIndex.value];
  });

  const getGlobalIndex = (localIndex: number): number | null => {
    const item = currentLayoutItems.value[localIndex];
    if (!item) return null;
    return store.items.findIndex((storeItem) => storeItem === item);
  };

  const getItemDimensions = (
    item: DragItem,
  ): { width: number; height: number } => {
    const width =
      item.width ||
      (item.type === "image"
        ? DEFAULT_SIZES.IMAGE_WIDTH
        : DEFAULT_SIZES.TEXT_WIDTH);
    const height =
      item.height ||
      (item.type === "image"
        ? DEFAULT_SIZES.IMAGE_HEIGHT
        : DEFAULT_SIZES.TEXT_HEIGHT);
    return { width, height };
  };

  const handleItemSelect = (localIndex: number | null) => {
    selectedItem.value = localIndex;
    globalSelectedItemIndex.value =
      localIndex !== null ? getGlobalIndex(localIndex) : null;
    drawCanvas();
  };

  const handleItemResize = (
    localIndex: number,
    width: number,
    height: number,
  ) => {
    const globalIndex = getGlobalIndex(localIndex);
    if (globalIndex === null || !store.items[globalIndex]) return;

    const item = store.items[globalIndex];
    const currentX = item.position?.x || 0;
    const currentY = item.position?.y || 0;

    const maxWidth = CANVAS_CONFIG.WIDTH - currentX;
    const maxHeight = CANVAS_CONFIG.HEIGHT - currentY;
    const boundedWidth = Math.max(
      CANVAS_CONFIG.MIN_ITEM_SIZE,
      Math.min(width, maxWidth),
    );
    const boundedHeight = Math.max(
      CANVAS_CONFIG.MIN_ITEM_SIZE,
      Math.min(height, maxHeight),
    );

    store.updateItem(globalIndex, {
      ...item,
      width: boundedWidth,
      height: boundedHeight,
    });
  };

  const handleItemMove = (localIndex: number, x: number, y: number) => {
    const globalIndex = getGlobalIndex(localIndex);
    if (globalIndex === null || !store.items[globalIndex]) return;

    const item = store.items[globalIndex];
    const { width, height } = getItemDimensions(item);

    const maxX = CANVAS_CONFIG.WIDTH - width;
    const maxY = CANVAS_CONFIG.HEIGHT - height;
    const boundedX = Math.max(0, Math.min(x, maxX));
    const boundedY = Math.max(0, Math.min(y, maxY));

    store.updateItem(globalIndex, {
      ...item,
      position: { x: boundedX, y: boundedY },
    });
  };

  const isPointInHandle = (point: Position, handlePos: Position): boolean => {
    return (
      point.x >= handlePos.x &&
      point.x <= handlePos.x + CANVAS_CONFIG.HANDLE_SIZE &&
      point.y >= handlePos.y &&
      point.y <= handlePos.y + CANVAS_CONFIG.HANDLE_SIZE
    );
  };

  const getResizeHandles = (item: DragItem): Record<ResizeHandle, Position> => {
    if (!item.position) {
      return {
        nw: { x: 0, y: 0 },
        ne: { x: 0, y: 0 },
        sw: { x: 0, y: 0 },
        se: { x: 0, y: 0 },
      };
    }

    const { width, height } = getItemDimensions(item);
    const halfHandle = CANVAS_CONFIG.HANDLE_SIZE / 2;

    return {
      nw: { x: item.position.x - halfHandle, y: item.position.y - halfHandle },
      ne: {
        x: item.position.x + width - halfHandle,
        y: item.position.y - halfHandle,
      },
      sw: {
        x: item.position.x - halfHandle,
        y: item.position.y + height - halfHandle,
      },
      se: {
        x: item.position.x + width - halfHandle,
        y: item.position.y + height - halfHandle,
      },
    };
  };

  const isPointInItem = (point: Position, item: DragItem): boolean => {
    if (!item.position) return false;
    const { width, height } = getItemDimensions(item);

    return (
      point.x >= item.position.x &&
      point.x <= item.position.x + width &&
      point.y >= item.position.y &&
      point.y <= item.position.y + height
    );
  };

  const getCanvasCoordinates = (e: MouseEvent): Position | null => {
    if (!canvas.value) return null;

    const rect = canvas.value.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (!canvas.value || !ctx.value) return;

    const canvasPos = getCanvasCoordinates(e);
    if (!canvasPos) return;

    if (selectedItem.value !== null) {
      const item = currentLayoutItems.value[selectedItem.value];
      if (item && item.position) {
        const handles = getResizeHandles(item);

        for (const [handle, pos] of Object.entries(handles)) {
          if (isPointInHandle(canvasPos, pos)) {
            isResizing.value = true;
            resizeHandle.value = handle as ResizeHandle;
            dragStart.value = canvasPos;
            return;
          }
        }
      }
    }

    let clickedLocalIndex: number | null = null;
    for (let i = currentLayoutItems.value.length - 1; i >= 0; i--) {
      const item = currentLayoutItems.value[i];
      if (isPointInItem(canvasPos, item)) {
        clickedLocalIndex = i;
        break;
      }
    }

    if (clickedLocalIndex !== null) {
      handleItemSelect(clickedLocalIndex);
      isDragging.value = true;
      dragStart.value = canvasPos;
    } else {
      handleItemSelect(null);
    }
  };

  const calculateResizeDimensions = (
    item: DragItem,
    handle: ResizeHandle,
    dx: number,
    dy: number,
  ): { width: number; height: number; x: number; y: number } => {
    const { width: currentWidth, height: currentHeight } =
      getItemDimensions(item);
    let newWidth = currentWidth;
    let newHeight = currentHeight;
    let newX = item.position!.x;
    let newY = item.position!.y;

    switch (handle) {
      case "nw":
        newWidth = Math.max(CANVAS_CONFIG.MIN_ITEM_SIZE, currentWidth - dx);
        newHeight = Math.max(CANVAS_CONFIG.MIN_ITEM_SIZE, currentHeight - dy);
        newX = item.position!.x + dx;
        newY = item.position!.y + dy;
        break;
      case "ne":
        newWidth = Math.max(CANVAS_CONFIG.MIN_ITEM_SIZE, currentWidth + dx);
        newHeight = Math.max(CANVAS_CONFIG.MIN_ITEM_SIZE, currentHeight - dy);
        newY = item.position!.y + dy;
        break;
      case "sw":
        newWidth = Math.max(CANVAS_CONFIG.MIN_ITEM_SIZE, currentWidth - dx);
        newHeight = Math.max(CANVAS_CONFIG.MIN_ITEM_SIZE, currentHeight + dy);
        newX = item.position!.x + dx;
        break;
      case "se":
        newWidth = Math.max(CANVAS_CONFIG.MIN_ITEM_SIZE, currentWidth + dx);
        newHeight = Math.max(CANVAS_CONFIG.MIN_ITEM_SIZE, currentHeight + dy);
        break;
    }

    return { width: newWidth, height: newHeight, x: newX, y: newY };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!canvas.value || (!isDragging.value && !isResizing.value)) return;

    const canvasPos = getCanvasCoordinates(e);
    if (!canvasPos) return;

    if (isDragging.value && selectedItem.value !== null && !isResizing.value) {
      const dx = canvasPos.x - dragStart.value.x;
      const dy = canvasPos.y - dragStart.value.y;
      const item = currentLayoutItems.value[selectedItem.value];

      if (item && item.position) {
        const newX = item.position.x + dx;
        const newY = item.position.y + dy;
        handleItemMove(selectedItem.value, newX, newY);
        dragStart.value = canvasPos;
      }
    } else if (
      isResizing.value &&
      selectedItem.value !== null &&
      resizeHandle.value
    ) {
      const item = currentLayoutItems.value[selectedItem.value];
      const globalIndex = getGlobalIndex(selectedItem.value);

      if (item && item.position && globalIndex !== null) {
        const dx = canvasPos.x - dragStart.value.x;
        const dy = canvasPos.y - dragStart.value.y;

        const { width, height, x, y } = calculateResizeDimensions(
          store.items[globalIndex],
          resizeHandle.value,
          dx,
          dy,
        );

        store.updateItem(globalIndex, {
          ...store.items[globalIndex],
          position: { x, y },
          width,
          height,
        });
        dragStart.value = canvasPos;
      }
    }
  };

  const handleMouseUp = () => {
    if (isDragging.value || isResizing.value) {
      drawCanvas();
    }
    isDragging.value = false;
    isResizing.value = false;
    resizeHandle.value = null;
  };

  const drawTextItem = (item: DragItem) => {
    if (!ctx.value || !item.position) return;

    const { width, height } = getItemDimensions(item);
    const fontSize = item.fontSize || DEFAULT_SIZES.FONT_SIZE;
    const fontFamily = item.fontFamily || DEFAULT_SIZES.FONT_FAMILY;

    if (item.backgroundColor) {
      ctx.value.fillStyle =
        item.backgroundColor || CANVAS_CONFIG.DEFAULT_TEXT_BACKGROUND_COLOR;
      ctx.value.fillRect(item.position.x, item.position.y, width, height);
    }

    ctx.value.font = `${fontSize}px ${fontFamily}`;
    ctx.value.fillStyle = item.color || CANVAS_CONFIG.DEFAULT_TEXT_COLOR;
    ctx.value.fillText(
      item.content || "",
      item.position.x,
      item.position.y + fontSize,
    );
  };

  const drawImageItem = (item: DragItem) => {
    if (!ctx.value || !item.position) return;

    const { width, height } = getItemDimensions(item);

    ctx.value.fillStyle = CANVAS_CONFIG.IMAGE_PLACEHOLDER_COLOR;
    ctx.value.fillRect(item.position.x, item.position.y, width, height);

    ctx.value.strokeStyle = CANVAS_CONFIG.IMAGE_BORDER_COLOR;
    ctx.value.lineWidth = 1;
    ctx.value.strokeRect(item.position.x, item.position.y, width, height);

    ctx.value.fillStyle = CANVAS_CONFIG.IMAGE_ICON_COLOR;
    ctx.value.font = "24px Arial";
    ctx.value.textAlign = "center";
    ctx.value.textBaseline = "middle";
    ctx.value.fillText(
      "📷",
      item.position.x + width / 2,
      item.position.y + height / 2,
    );

    ctx.value.textAlign = "start";
    ctx.value.textBaseline = "alphabetic";
  };

  const drawSelection = (item: DragItem) => {
    if (!ctx.value || !item.position) return;

    const { width, height } = getItemDimensions(item);

    ctx.value.strokeStyle = CANVAS_CONFIG.SELECT_COLOR;
    ctx.value.lineWidth = 2;
    ctx.value.strokeRect(
      item.position.x - CANVAS_CONFIG.SELECT_PADDING,
      item.position.y - CANVAS_CONFIG.SELECT_PADDING,
      width + CANVAS_CONFIG.SELECT_PADDING * 2,
      height + CANVAS_CONFIG.SELECT_PADDING * 2,
    );

    ctx.value.fillStyle = CANVAS_CONFIG.SELECT_COLOR;
    const handles = getResizeHandles(item);

    Object.values(handles).forEach((pos: Position) => {
      ctx.value!.fillRect(
        pos.x,
        pos.y,
        CANVAS_CONFIG.HANDLE_SIZE,
        CANVAS_CONFIG.HANDLE_SIZE,
      );
    });
  };

  const drawCanvas = async () => {
    if (!canvas.value || !ctx.value) return;

    ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);

    ctx.value.fillStyle = CANVAS_CONFIG.BACKGROUND_COLOR;
    ctx.value.fillRect(0, 0, canvas.value.width, canvas.value.height);

    currentLayoutItems.value.forEach((item, localIndex) => {
      if (!item.position) return;

      if (item.type === "text") {
        drawTextItem(item);
      } else if (item.type === "image") {
        drawImageItem(item);
      }

      if (selectedItem.value === localIndex) {
        drawSelection(item);
      }
    });
  };

  return {
    canvas,
    ctx,
    isDragging,
    isResizing,
    selectedItem,
    globalSelectedItemIndex,
    dragStart,
    currentItem,
    resizeHandle,
    currentLayoutItems,
    selectedStoreItem,

    handleItemSelect,
    handleItemResize,
    handleItemMove,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    drawCanvas,
    getGlobalIndex,
  };
}
