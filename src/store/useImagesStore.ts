import { create } from "zustand"

export type DroppedImage = {
  id: string
  x: number
  y: number
  width: number
  height: number
  src: string
  z?: number
  createdAt: number
  note?: string
}

type ImagesState = {
  images: DroppedImage[]

  addImage: (img: Omit<DroppedImage, "id" | "z" | "createdAt">) => void
  updateImage: (id: string, patch: Partial<DroppedImage>) => void
  deleteImage: (id: string) => void

  focusImage: (id: string) => void
  moveImage: (id: string, x: number, y: number) => void
  nudgeImage: (id: string, dx: number, dy: number) => void
  resizeImage: (id: string, width: number, height: number) => void
}

const CANVAS = { width: 20000, height: 15000 }

export const useImagesStore = create<ImagesState>()((set) => ({
  images: [],

  addImage: (data) => {
    const img: DroppedImage = {
      ...data,
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: Date.now(),
      z: Date.now(),
    }
    set((s) => ({ images: [...s.images, img] }))
  },

  // ⚠️ Pas de clamp ici, on merge simplement
  updateImage: (id, patch) => {
    set((s) => ({
      images: s.images.map((im) => (im.id === id ? { ...im, ...patch } : im)),
    }))
  },

  deleteImage: (id) => {
    set((s) => ({ images: s.images.filter((im) => im.id !== id) }))
  },

  focusImage: (id) => {
    set((s) => ({
      images: s.images.map((im) =>
        im.id === id ? { ...im, z: Date.now() } : im
      ),
    }))
  },

  moveImage: (id, x, y) => {
    set((s) => ({
      images: s.images.map((im) => {
        if (im.id !== id) return im
        const nx = Math.min(Math.max(x, 0), CANVAS.width - im.width)
        const ny = Math.min(Math.max(y, 0), CANVAS.height - im.height)
        return { ...im, x: nx, y: ny }
      }),
    }))
  },

  nudgeImage: (id, dx, dy) => {
    set((s) => ({
      images: s.images.map((im) => {
        if (im.id !== id) return im
        const nx = Math.min(Math.max(im.x + dx, 0), CANVAS.width - im.width)
        const ny = Math.min(Math.max(im.y + dy, 0), CANVAS.height - im.height)
        return { ...im, x: nx, y: ny }
      }),
    }))
  },

  resizeImage: (id, width, height) => {
    set((s) => ({
      images: s.images.map((im) => {
        if (im.id !== id) return im
        const w = Math.max(10, Math.min(width, CANVAS.width - im.x))
        const h = Math.max(10, Math.min(height, CANVAS.height - im.y))
        return { ...im, width: w, height: h }
      }),
    }))
  },
}))

export default useImagesStore
