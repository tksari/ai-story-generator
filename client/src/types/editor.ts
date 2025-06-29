export interface Position {
  x: number;
  y: number;
}

export interface DragItem {
  type: "text" | "image";
  content: string;
  position?: Position;
  width?: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontFamily?: string;
  layoutId?: string;
}

export interface Layout {
  id: string;
  name: string;
  items: DragItem[];
}
