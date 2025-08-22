import { useState, useRef, useEffect } from 'react'
import type { StickyNote } from '../types/notes'

type Props = {
  note: StickyNote
  scale: number
  onDrag: (id: string, dx: number, dy: number) => void
  onUpdateText: (id: string, text: string) => void
  onDelete: (id: string) => void
  // ⬇️ branchement TextToolbar
  onStartTextEdit?: (id: string, type: 'note', styles: StickyNote['textStyles']) => void
}

export default function PostItNote({
  note,
  scale,
  onDrag,
  onUpdateText,
  onDelete,
  onStartTextEdit,
}: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(note.text)
  const dragRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => setDraft(note.text), [note.text])

  const startEdit = () => {
    onStartTextEdit?.(note.id, 'note', note.textStyles || {})
    setIsEditing(true)
  }

  const onMouseDown = (e: React.MouseEvent) => {
    const t = e.target as HTMLElement
    if (isEditing || t.closest('textarea,button,[data-no-drag]')) return
    e.preventDefault()
    e.stopPropagation()
    dragRef.current = { x: e.clientX, y: e.clientY }
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return
      const dx = (ev.clientX - dragRef.current.x) / scale
      const dy = (ev.clientY - dragRef.current.y) / scale
      onDrag(note.id, dx, dy)
      dragRef.current = { x: ev.clientX, y: ev.clientY }
    }
    const onUp = () => {
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const commit = () => {
    onUpdateText(note.id, draft)
    setIsEditing(false)
  }

  return (
    <div
      className="absolute rounded-md shadow-lg note"
      style={{ left: note.x, top: note.y, width: 160, height: 160, background: note.color }}
      onMouseDown={onMouseDown}
      onDoubleClick={(e) => { e.stopPropagation(); startEdit() }}
    >
      <div className="absolute flex gap-1 right-1 top-1">
        <button data-no-drag onClick={(e) => { e.stopPropagation(); startEdit() }} className="px-2 py-1 text-xs rounded bg-black/10">✏️</button>
        <button data-no-drag onClick={(e) => { e.stopPropagation(); onDelete(note.id) }} className="px-2 py-1 text-xs rounded bg-black/10">×</button>
      </div>

      <div className="w-full h-full p-3">
        {isEditing ? (
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === 'Escape') { setDraft(note.text); setIsEditing(false) } }}
            className="w-full h-full bg-transparent outline-none resize-none"
            style={{ whiteSpace: 'pre-wrap', ...(note.textStyles || {}) }}
          />
        ) : (
          <div className="w-full h-full" style={{ whiteSpace: 'pre-wrap', ...(note.textStyles || {}) }}>
            {note.text}
          </div>
        )}
      </div>
    </div>
  )
}
