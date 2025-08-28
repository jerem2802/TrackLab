// src/store/useAppStore.ts
import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { StickyNote } from '../types/notes'
import type { CSSProperties } from 'react'

// Types exacts depuis vos fichiers
export type WireType =
  | 'select' | 'desktop' | 'mobile' | 'diamond' | 'arrow' | 'line'
  | 'text' | 'image' | 'button' | 'input' | 'nav' | 'icon' | 'card'

export type TextStyle = Partial<
  Pick<
    CSSProperties,
    'fontWeight' | 'fontStyle' | 'fontSize' | 'color' | 'textAlign' |
    'textDecoration' | 'letterSpacing' | 'lineHeight' | 'fontFamily'
  >
>

export type WireEl = {
  id: string
  type: WireType
  x: number
  y: number
  w: number
  h: number
  z: number
  text?: string
  variant?: string
  iconName?: string
  textStyles?: TextStyle
}

export interface TextStyles {
  fontFamily: string
  fontSize: number
  fontWeight: 'normal' | 'bold'
  fontStyle: 'normal' | 'italic'
  textDecoration: 'none' | 'underline'
  textAlign: 'left' | 'center' | 'right'
  color: string
}

export interface TextEditState {
  id: string
  type: string
  styles: TextStyles
}

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

export type Tool = "pencil" | "eraser"
export type BottomToolId = "select" | "desktop" | "mobile" | "diamond" | "arrow" | "line" | "text" | "image" | "button" | "input" | "nav" | "icon"

// Store principal
interface AppState {
  // === ELEMENTS (sync avec back via WebSocket) ===
  elements: {
    notes: StickyNote[]
    images: DroppedImage[]
    wireframes: WireEl[]
  }
  
  // === VIEWPORT (local performance) ===
  viewport: {
    scale: number
    translate: { x: number; y: number }
    minZoom: number
  }
  
  // === TOOLS & MODES (local UI) ===
  tools: {
    active: Tool
    color: string
    width: number
  }
  
  modes: {
    drawing: boolean
    placement: boolean
    wirePlacement: { type: BottomToolId; variant?: string; iconName?: string } | null
  }
  
  // === SELECTION (local) ===
  selection: {
    ids: string[]
    multi: boolean
  }
  
  // === UI PANELS (local) ===
  panels: {
    layers: boolean
    todo: boolean
    iconPicker: boolean
    showDrawingTools: boolean
  }
  
  // === TEXT EDITING (local) ===
  textEdit: TextEditState | null
  
  // === COLORS (local) ===
  colors: {
    selected: string
    active: string
  }
  
  // === ACTIONS ===
  
  // Elements actions
  addNote: (note: Omit<StickyNote, 'id'>) => void
  updateNote: (id: string, patch: Partial<StickyNote>) => void
  deleteNote: (id: string) => void
  
  addImage: (image: Omit<DroppedImage, 'id'>) => void
  updateImage: (id: string, patch: Partial<DroppedImage>) => void
  deleteImage: (id: string) => void
  
  addWireframe: (wireframe: Omit<WireEl, 'id'>) => void
  updateWireframe: (id: string, patch: Partial<WireEl>) => void
  deleteWireframe: (id: string) => void
  
  // Viewport actions
  setScale: (scale: number) => void
  setTranslate: (translate: { x: number; y: number }) => void
  resetView: () => void
  
  // Tools actions
  setActiveTool: (tool: Tool) => void
  setToolColor: (color: string) => void
  setToolWidth: (width: number) => void
  
  // Modes actions
  setDrawingMode: (active: boolean) => void
  setPlacementMode: (active: boolean) => void
  setWirePlacement: (placement: { type: BottomToolId; variant?: string; iconName?: string } | null) => void
  
  // Selection actions
  selectElement: (id: string, multi?: boolean) => void
  clearSelection: () => void
  
  // Panels actions
  toggleLayersPanel: () => void
  toggleTodoPanel: () => void
  toggleIconPicker: () => void
  toggleDrawingTools: () => void
  
  // Text editing actions
  startTextEdit: (id: string, type: string, styles: TextStyles) => void
  updateTextStyles: (styles: Partial<TextStyles>) => void
  finishTextEdit: () => void
  
  // Colors actions
  setSelectedColor: (color: string) => void
  setActiveColor: (color: string) => void
  
  // Drag handlers (pour compatibilité avec votre code existant)
  handleDrag: (id: string, dx: number, dy: number) => void
  handleWireframeDrag: (id: string, dx: number, dy: number) => void
  handleWireframeResize: (id: string, newWidth: number, newHeight: number) => void
  
  // Sync actions (pour WebSocket futur)
  syncFromServer: (elements: { notes: StickyNote[]; images: DroppedImage[]; wireframes: WireEl[] }) => void
}

// Constantes de configuration (depuis votre LabLayout)
const CANVAS_CONFIG = {
  width: 20000,
  height: 15000,
  maxZoom: 3.0,
  defaultZoom: 1,
}

// Store avec slices
export const useAppStore = create<AppState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial state
        elements: {
          notes: [],
          images: [],
          wireframes: []
        },
        
        viewport: {
          scale: 1,
          translate: { x: 0, y: 0 },
          minZoom: 0.1
        },
        
        tools: {
          active: "pencil",
          color: "#000000", 
          width: 3
        },
        
        modes: {
          drawing: false,
          placement: false,
          wirePlacement: null
        },
        
        selection: {
          ids: [],
          multi: false
        },
        
        panels: {
          layers: false,
          todo: false,
          iconPicker: false,
          showDrawingTools: false
        },
        
        textEdit: null,
        
        colors: {
          selected: "#ffeb3b",
          active: "#000000"
        },

        // === ELEMENTS ACTIONS ===
        addNote: (noteData) => set((state) => {
          const note: StickyNote = {
            ...noteData,
            id: crypto.randomUUID(),
            z: Date.now()
          }
          state.elements.notes.push(note)
        }),

        updateNote: (id, patch) => set((state) => {
          const noteIndex = state.elements.notes.findIndex(n => n.id === id)
          if (noteIndex !== -1) {
            Object.assign(state.elements.notes[noteIndex], patch)
          }
        }),

        deleteNote: (id) => set((state) => {
          state.elements.notes = state.elements.notes.filter(n => n.id !== id)
          state.selection.ids = state.selection.ids.filter(selId => selId !== id)
          if (state.textEdit?.id === id) {
            state.textEdit = null
          }
        }),

        addImage: (imageData) => set((state) => {
          const image: DroppedImage = {
            ...imageData,
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            z: Date.now()
          }
          state.elements.images.push(image)
        }),

        updateImage: (id, patch) => set((state) => {
          const imageIndex = state.elements.images.findIndex(img => img.id === id)
          if (imageIndex !== -1) {
            Object.assign(state.elements.images[imageIndex], patch)
          }
        }),

        deleteImage: (id) => set((state) => {
          state.elements.images = state.elements.images.filter(img => img.id !== id)
          state.selection.ids = state.selection.ids.filter(selId => selId !== id)
        }),

        addWireframe: (wireframeData) => set((state) => {
          const wireframe: WireEl = {
            ...wireframeData,
            id: crypto.randomUUID(),
            z: Date.now()
          }
          state.elements.wireframes.push(wireframe)
        }),

        updateWireframe: (id, patch) => set((state) => {
          const wireIndex = state.elements.wireframes.findIndex(w => w.id === id)
          if (wireIndex !== -1) {
            Object.assign(state.elements.wireframes[wireIndex], patch)
          }
        }),

        deleteWireframe: (id) => set((state) => {
          state.elements.wireframes = state.elements.wireframes.filter(w => w.id !== id)
          state.selection.ids = state.selection.ids.filter(selId => selId !== id)
          if (state.textEdit?.id === id) {
            state.textEdit = null
          }
        }),

        // === VIEWPORT ACTIONS ===
        setScale: (scale) => set((state) => {
          state.viewport.scale = Math.min(Math.max(scale, state.viewport.minZoom), CANVAS_CONFIG.maxZoom)
        }),

        setTranslate: (translate) => set((state) => {
          state.viewport.translate = translate
        }),

        resetView: () => set((state) => {
          state.viewport.scale = Math.max(CANVAS_CONFIG.defaultZoom, state.viewport.minZoom)
          state.viewport.translate = { x: 0, y: 0 }
        }),

        // === TOOLS ACTIONS ===
        setActiveTool: (tool) => set((state) => {
          state.tools.active = tool
        }),

        setToolColor: (color) => set((state) => {
          state.tools.color = color
          state.colors.active = color
        }),

        setToolWidth: (width) => set((state) => {
          state.tools.width = width
        }),

        // === MODES ACTIONS ===
        setDrawingMode: (active) => set((state) => {
          state.modes.drawing = active
          if (active) {
            state.modes.placement = false
            state.modes.wirePlacement = null
            state.textEdit = null
          }
        }),

        setPlacementMode: (active) => set((state) => {
          state.modes.placement = active
          if (active) {
            state.modes.drawing = false
            state.modes.wirePlacement = null
            state.textEdit = null
          }
        }),

        setWirePlacement: (placement) => set((state) => {
          state.modes.wirePlacement = placement
          if (placement) {
            state.modes.drawing = false
            state.modes.placement = false
            state.textEdit = null
          }
        }),

        // === SELECTION ACTIONS ===
        selectElement: (id, multi = false) => set((state) => {
          if (multi) {
            if (state.selection.ids.includes(id)) {
              state.selection.ids = state.selection.ids.filter(selId => selId !== id)
            } else {
              state.selection.ids.push(id)
            }
          } else {
            state.selection.ids = [id]
          }
          state.selection.multi = multi
        }),

        clearSelection: () => set((state) => {
          state.selection.ids = []
          state.selection.multi = false
        }),

        // === PANELS ACTIONS ===
        toggleLayersPanel: () => set((state) => {
          state.panels.layers = !state.panels.layers
        }),

        toggleTodoPanel: () => set((state) => {
          state.panels.todo = !state.panels.todo
        }),

        toggleIconPicker: () => set((state) => {
          state.panels.iconPicker = !state.panels.iconPicker
        }),

        toggleDrawingTools: () => set((state) => {
          state.panels.showDrawingTools = !state.panels.showDrawingTools
        }),

        // === TEXT EDITING ACTIONS ===
        startTextEdit: (id, type, styles) => set((state) => {
          state.textEdit = { id, type, styles }
        }),

        updateTextStyles: (newStyles) => set((state) => {
          if (!state.textEdit) return
          
          state.textEdit.styles = { ...state.textEdit.styles, ...newStyles }
          
          // Apply to element
          const { id, type } = state.textEdit
          if (type === "note") {
            const noteIndex = state.elements.notes.findIndex(n => n.id === id)
            if (noteIndex !== -1) {
              state.elements.notes[noteIndex].textStyles = state.textEdit.styles
            }
          } else {
            const wireIndex = state.elements.wireframes.findIndex(w => w.id === id)
            if (wireIndex !== -1) {
              state.elements.wireframes[wireIndex].textStyles = state.textEdit.styles
            }
          }
        }),

        finishTextEdit: () => set((state) => {
          state.textEdit = null
        }),

        // === COLORS ACTIONS ===
        setSelectedColor: (color) => set((state) => {
          state.colors.selected = color
        }),

        setActiveColor: (color) => set((state) => {
          state.colors.active = color
          state.tools.color = color
        }),

        // === DRAG HANDLERS (compatibilité avec votre code) ===
        handleDrag: (id, dx, dy) => set((state) => {
          const noteIndex = state.elements.notes.findIndex(note => note.id === id)
          if (noteIndex !== -1) {
            const note = state.elements.notes[noteIndex]
            const newX = Math.min(Math.max(note.x + dx, 0), CANVAS_CONFIG.width - 160)
            const newY = Math.min(Math.max(note.y + dy, 0), CANVAS_CONFIG.height - 160)
            state.elements.notes[noteIndex].x = newX
            state.elements.notes[noteIndex].y = newY
          }
        }),

        handleWireframeDrag: (id, dx, dy) => set((state) => {
          const wireIndex = state.elements.wireframes.findIndex(wire => wire.id === id)
          if (wireIndex !== -1) {
            const wire = state.elements.wireframes[wireIndex]
            const newX = Math.min(Math.max(wire.x + dx, 0), CANVAS_CONFIG.width - wire.w)
            const newY = Math.min(Math.max(wire.y + dy, 0), CANVAS_CONFIG.height - wire.h)
            state.elements.wireframes[wireIndex].x = newX
            state.elements.wireframes[wireIndex].y = newY
          }
        }),

        handleWireframeResize: (id, newWidth, newHeight) => set((state) => {
          const wireIndex = state.elements.wireframes.findIndex(wire => wire.id === id)
          if (wireIndex !== -1) {
            const wire = state.elements.wireframes[wireIndex]
            const constrainedW = Math.min(Math.max(newWidth, 50), CANVAS_CONFIG.width - wire.x)
            const constrainedH = Math.min(Math.max(newHeight, 50), CANVAS_CONFIG.height - wire.h)
            state.elements.wireframes[wireIndex].w = constrainedW
            state.elements.wireframes[wireIndex].h = constrainedH
          }
        }),

        // === SYNC ACTIONS (WebSocket futur) ===
        syncFromServer: (elements) => set((state) => {
          state.elements = elements
        })
      }))
    )
  )
)

// Selectors optimisés (évite re-renders inutiles)
export const useElements = () => useAppStore(state => state.elements)
export const useNotes = () => useAppStore(state => state.elements.notes)
export const useImages = () => useAppStore(state => state.elements.images)
export const useWireframes = () => useAppStore(state => state.elements.wireframes)

export const useViewport = () => useAppStore(state => state.viewport)
export const useTools = () => useAppStore(state => state.tools)
export const useModes = () => useAppStore(state => state.modes)
export const useSelection = () => useAppStore(state => state.selection)
export const usePanels = () => useAppStore(state => state.panels)
export const useTextEdit = () => useAppStore(state => state.textEdit)
export const useColors = () => useAppStore(state => state.colors)

// Actions selectors (pour éviter de récupérer tout le store)
export const useElementsActions = () => useAppStore(state => ({
  addNote: state.addNote,
  updateNote: state.updateNote,
  deleteNote: state.deleteNote,
  addImage: state.addImage,
  updateImage: state.updateImage,
  deleteImage: state.deleteImage,
  addWireframe: state.addWireframe,
  updateWireframe: state.updateWireframe,
  deleteWireframe: state.deleteWireframe,
  handleDrag: state.handleDrag,
  handleWireframeDrag: state.handleWireframeDrag,
  handleWireframeResize: state.handleWireframeResize
}))

export const useViewportActions = () => useAppStore(state => ({
  setScale: state.setScale,
  setTranslate: state.setTranslate,
  resetView: state.resetView
}))

export const useToolsActions = () => useAppStore(state => ({
  setActiveTool: state.setActiveTool,
  setToolColor: state.setToolColor,
  setToolWidth: state.setToolWidth
}))

export const useModesActions = () => useAppStore(state => ({
  setDrawingMode: state.setDrawingMode,
  setPlacementMode: state.setPlacementMode,
  setWirePlacement: state.setWirePlacement
}))

export const usePanelsActions = () => useAppStore(state => ({
  toggleLayersPanel: state.toggleLayersPanel,
  toggleTodoPanel: state.toggleTodoPanel,
  toggleIconPicker: state.toggleIconPicker,
  toggleDrawingTools: state.toggleDrawingTools
}))

export const useTextEditActions = () => useAppStore(state => ({
  startTextEdit: state.startTextEdit,
  updateTextStyles: state.updateTextStyles,
  finishTextEdit: state.finishTextEdit
}))

export const useColorsActions = () => useAppStore(state => ({
  setSelectedColor: state.setSelectedColor,
  setActiveColor: state.setActiveColor
}))

// Selectors dérivés (calculés)
export const useSortedNotes = () => useAppStore(state => 
  state.elements.notes.slice().sort((a, b) => a.z - b.z)
)

export const useSortedImages = () => useAppStore(state =>
  state.elements.images.slice().sort((a, b) => (a.z ?? 0) - (b.z ?? 0))
)

export const useSortedWireframes = () => useAppStore(state =>
  state.elements.wireframes.slice().sort((a, b) => a.z - b.z)
)

// === PERSISTENCE LOCALE (optionnel) ===
// Auto-save en localStorage (backup)
if (typeof window !== 'undefined') {
  useAppStore.subscribe(
    (state) => state.elements,
    (elements) => {
      const saveToStorage = () => {
        try {
          localStorage.setItem('tracklab-backup', JSON.stringify(elements))
        } catch (error) {
          console.warn('Failed to save to localStorage:', error)
        }
      }
      setTimeout(saveToStorage, 1000)
    }
  )
}

export default useAppStore