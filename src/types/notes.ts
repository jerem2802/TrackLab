export interface StickyNote {
  id: string
  text: string
  x: number
  y: number
  color: string
  visible?: boolean  
  locked?: boolean   
}
export type DroppedImage = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;     // DataURL
  z?: number;
  createdAt: number;
};