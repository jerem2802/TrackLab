import { useState, useRef } from 'react';
import { StickyNote } from '../types/notes';
import { Pencil, X } from 'lucide-react';

interface Props {
  note: StickyNote;
  scale: number;
  onDrag: (id: string, dx: number, dy: number) => void;
  onUpdateText: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}

// Supprimez isEditing et setEditingId du Props si vous les aviez

export default function PostItNote({ note, scale, onDrag, onUpdateText, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const start = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (editing || e.button !== 0) return;
    start.current = { x: e.clientX, y: e.clientY };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const dx = (e.clientX - start.current.x) / scale;
    const dy = (e.clientY - start.current.y) / scale;
    onDrag(note.id, dx, dy);
    start.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={`absolute w-40 h-40 p-2 rounded shadow-lg note cursor-grab active:cursor-grabbing select-none overflow-hidden ${editing ? 'z-50' : 'z-0'}`}
      onMouseDown={handleMouseDown}
      style={{ left: note.x, top: note.y, backgroundColor: note.color }}
    >
      <div className="absolute top-0 right-0 w-0 h-0 border-t-[30px] border-l-[30px] border-t-white border-l-transparent" />

      {!editing ? (
        <>
         <button
  className="absolute z-10 p-1 text-xs bg-white rounded shadow top-1 left-1"
  onClick={(e) => {
    e.stopPropagation();
    setEditing(true);
  }}
>
  <Pencil size={14} className="text-orange-500" />
</button>
<button
  className="absolute z-10 p-1 text-xs bg-white rounded shadow top-1 right-1"
  onClick={(e) => {
    e.stopPropagation();
    onDelete(note.id);
  }}
>
  <X size={14} className="text-purple-500" />
</button>
          <div className="break-words whitespace-pre-wrap">{note.text || ' '}</div>
        </>
      ) : (
        <textarea
          className="w-full h-full bg-transparent outline-none resize-none"
          value={note.text}
          onChange={(e) => onUpdateText(note.id, e.target.value)}
          onBlur={() => setEditing(false)}
          autoFocus
        />
      )}
    </div>
  );
}
