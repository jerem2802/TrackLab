import { create } from 'zustand'
import { StickyNote } from '../types/notes'

type NotesState = {
  notes: StickyNote[]

  // CRUD
  addNote: (note: Omit<StickyNote, 'id' | 'z'> & Partial<Pick<StickyNote, 'z'>>) => void
  updateNoteText: (id: string, text: string) => void
  deleteNote: (id: string) => void

  // mouvements
  moveNote: (id: string, x: number, y: number) => void         // position absolue (monde)
  nudgeNote: (id: string, dx: number, dy: number) => void       // delta relatif (monde)

  // styles de texte
  updateNoteStyles: (
    id: string,
    styles: Partial<NonNullable<StickyNote['textStyles']>>
  ) => void
}

const CANVAS = { width: 20000, height: 15000, NOTE_W: 160, NOTE_H: 160 }

export const useNotesStore = create<NotesState>((set) => ({
  notes: [],

  addNote: (data) => {
    const note: StickyNote = {
      ...data,
      id: crypto.randomUUID(),
      z: data.z ?? Date.now(),
    }
    set((state) => ({ notes: [...state.notes, note] }))
  },

  updateNoteText: (id, text) => {
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? { ...n, text } : n)),
    }))
  },

  deleteNote: (id) => {
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
    }))
  },

  moveNote: (id, x, y) => {
    const nx = Math.min(Math.max(x, 0), CANVAS.width  - CANVAS.NOTE_W)
    const ny = Math.min(Math.max(y, 0), CANVAS.height - CANVAS.NOTE_H)
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, x: nx, y: ny, z: Date.now() } : n
      ),
    }))
  },

  nudgeNote: (id, dx, dy) => {
    set((state) => ({
      notes: state.notes.map((n) => {
        if (n.id !== id) return n
        const nx = Math.min(Math.max(n.x + dx, 0), CANVAS.width  - CANVAS.NOTE_W)
        const ny = Math.min(Math.max(n.y + dy, 0), CANVAS.height - CANVAS.NOTE_H)
        return { ...n, x: nx, y: ny, z: Date.now() }
      }),
    }))
  },

  updateNoteStyles: (id, styles) => {
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id
          ? { ...n, textStyles: { ...(n.textStyles ?? {}), ...styles } }
          : n
      ),
    }))
  },
}))

export default useNotesStore
