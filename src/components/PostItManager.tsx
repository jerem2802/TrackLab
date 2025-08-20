import { useEffect } from 'react'
import { StickyNote } from '../types/notes'

// Importer les dimensions depuis votre config
const CANVAS_CONFIG = {
  width: 20000,
  height: 15000,
}

interface Props {
  selectedColor: string
  scale: number
  contentRef: React.RefObject<HTMLDivElement | null>
  setNotes: React.Dispatch<React.SetStateAction<StickyNote[]>>
  onPlaced?: () => void // ← Nouveau callback pour signaler le placement
}

export default function PostItManager({ selectedColor, scale, contentRef, setNotes, onPlaced }: Props) {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Vérifier que c'est un clic gauche
      if (e.button !== 0) return
      
      // Ignorer les clics sur les éléments interactifs
      if (!(e.target instanceof HTMLElement)) return
      if (e.target.closest('.note') || 
          e.target.closest('button') || 
          e.target.closest('.image-item') ||
          e.target.closest('.note-modal') ||
          e.target.closest('textarea') ||
          e.target.closest('input')) {
        return
      }

      // Vérifier que le contentRef existe
      if (!contentRef.current) return

      // Calculer la position relative au canvas
      const rect = contentRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / scale
      const y = (e.clientY - rect.top) / scale

      // S'assurer que les coordonnées sont dans les limites du canvas (NOUVELLES DIMENSIONS)
      if (x < 0 || y < 0 || x > CANVAS_CONFIG.width || y > CANVAS_CONFIG.height) return

      // Créer le nouveau post-it
      const newNote: StickyNote = {
        id: Date.now().toString(),
        text: '',
        x: Math.max(0, Math.min(x - 80, CANVAS_CONFIG.width - 160)), // Centrer et contraindre avec nouvelles dimensions
        y: Math.max(0, Math.min(y - 80, CANVAS_CONFIG.height - 160)),
        color: selectedColor,
        visible: true,
        locked: false
      }

      setNotes(prev => [...prev, newNote])
      onPlaced?.() // ← Signaler que le post-it a été placé
    }

    const contentEl = contentRef.current
    if (contentEl) {
      contentEl.addEventListener('click', handleClick)
    }

    return () => {
      if (contentEl) {
        contentEl.removeEventListener('click', handleClick)
      }
    }
  }, [selectedColor, scale, contentRef, setNotes, onPlaced])

  return null
}