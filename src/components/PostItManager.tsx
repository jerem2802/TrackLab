import { useEffect } from 'react'
import { StickyNote } from '../types/notes'

// Dimensions du canvas
const CANVAS_CONFIG = {
  width: 20000,
  height: 15000,
}

// Styles de texte par défaut pour un nouveau Post-it
const DEFAULT_TEXT_STYLES: StickyNote['textStyles'] = {
  fontFamily: 'Roboto',
  fontSize: 14,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
  textAlign: 'left',
  color: '#000000',
}

interface Props {
  selectedColor: string
  scale: number
  contentRef: React.RefObject<HTMLDivElement | null>
  setNotes: React.Dispatch<React.SetStateAction<StickyNote[]>>
  onPlaced?: () => void
}

export default function PostItManager({
  selectedColor,
  scale,
  contentRef,
  setNotes,
  onPlaced,
}: Props) {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // clic gauche uniquement
      if (e.button !== 0) return

      // ignorer clics sur éléments interactifs
      if (!(e.target instanceof HTMLElement)) return
      if (
        e.target.closest('.note') ||
        e.target.closest('button') ||
        e.target.closest('.image-item') ||
        e.target.closest('.note-modal') ||
        e.target.closest('textarea') ||
        e.target.closest('input')
      ) {
        return
      }

      if (!contentRef.current) return

      // position relative au monde
      const rect = contentRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / scale
      const y = (e.clientY - rect.top) / scale

      // bornes du monde
      if (x < 0 || y < 0 || x > CANVAS_CONFIG.width || y > CANVAS_CONFIG.height) return

      // créer la note (160x160)
      const SIZE = 160
      const newNote: StickyNote = {
        id: (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
          ? crypto.randomUUID()
          : Date.now().toString(),
        text: '',
        x: Math.max(0, Math.min(x - SIZE / 2, CANVAS_CONFIG.width - SIZE)),
        y: Math.max(0, Math.min(y - SIZE / 2, CANVAS_CONFIG.height - SIZE)),
        z: Date.now(),
        color: selectedColor,
        // 🔗 très important: styles initiaux pour la TextToolbar
        textStyles: { ...DEFAULT_TEXT_STYLES },
      }

      setNotes(prev => [...prev, newNote])
      onPlaced?.()
    }

    const el = contentRef.current
    if (el) el.addEventListener('click', handleClick)

    return () => {
      if (el) el.removeEventListener('click', handleClick)
    }
  }, [selectedColor, scale, contentRef, setNotes, onPlaced])

  return null
}
