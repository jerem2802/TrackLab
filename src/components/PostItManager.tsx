import { useEffect } from 'react'
import { StickyNote } from '../types/notes'

interface Props {
  selectedColor: string
  scale: number
  contentRef: React.RefObject<HTMLDivElement | null>
  setNotes: React.Dispatch<React.SetStateAction<StickyNote[]>>
}

export default function PostItManager({ selectedColor, scale, contentRef, setNotes }: Props) {
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

      // S'assurer que les coordonnées sont dans les limites du canvas
      if (x < 0 || y < 0 || x > 8000 || y > 6000) return

      // Créer le nouveau post-it
      const newNote: StickyNote = {
        id: Date.now().toString(),
        text: '',
        x: Math.max(0, Math.min(x - 80, 8000 - 160)), // Centrer et contraindre
        y: Math.max(0, Math.min(y - 80, 6000 - 160)),
        color: selectedColor,
        visible: true,  // ← AJOUTER CETTE LIGNE
        locked: false   // ← AJOUTER CETTE LIGNE
      }

      setNotes(prev => [...prev, newNote])
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
  }, [selectedColor, scale, contentRef, setNotes])

  return null
}