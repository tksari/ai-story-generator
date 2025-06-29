export interface LayoutPosition {
  x: number;
  y: number;
}

export interface ImageLayoutItem {
  type: "image";
  width: number;
  height: number;
  position: LayoutPosition;
}

export interface TextLayoutItem {
  type: "text";
  color: string;
  backgroundColor: string;
  fontSize: number;
  position: LayoutPosition;
  width: number;
  height: number;
  fontFamily?: string;
  box?: boolean;
  boxColor?: string;
  boxBorderW?: number;
  lineSpacing?: number;
}

export type LayoutItem = ImageLayoutItem | TextLayoutItem;

export interface StorySettings {
  layout?: {
    id: string;
    items: LayoutItem[];
  };
}

export type StoryWithPages = {
  id: number;
  settings: any;
  pages: any[];
};
