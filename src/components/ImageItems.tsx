import { useRef, useState } from "react";
import { Trash2, MoveDiagonal2, FileText } from "lucide-react";

// Type pour correspondre à celui de LabLayout
type DroppedImage = {
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

type Props = {
  img: DroppedImage;
  scale: number;
  onChange: (patch: Partial<DroppedImage>) => void;
  onDelete: () => void;
  onFocus: () => void;
};

export default function ImageItem({ img, scale, onChange, onDelete, onFocus }: Props) {
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const resizeStart = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const [note, setNote] = useState(img.note || "");
  const [isEditingNote, setIsEditingNote] = useState(false);

  // Drag
  const onPointerDown = (e: React.PointerEvent) => {
    // Ignorer si on clique sur les boutons d'action ou la modal
    if ((e.target as HTMLElement).closest(".img-resize") || 
        (e.target as HTMLElement).closest(".img-action-btn") ||
        (e.target as HTMLElement).closest(".note-modal")) return;
    
    e.stopPropagation();
    onFocus();
    dragStart.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current || resizeStart.current || isEditingNote) return;
    const dx = (e.clientX - dragStart.current.x) / scale;
    const dy = (e.clientY - dragStart.current.y) / scale;
    dragStart.current = { x: e.clientX, y: e.clientY };
    onChange({ x: img.x + dx, y: img.y + dy, z: Date.now() });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    dragStart.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  // Resize
  const onResizeDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    onFocus();
    resizeStart.current = { x: e.clientX, y: e.clientY, width: img.width, height: img.height };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onResizeMove = (e: React.PointerEvent) => {
    if (!resizeStart.current) return;
    const dx = (e.clientX - resizeStart.current.x) / scale;
    const dy = (e.clientY - resizeStart.current.y) / scale;
    onChange({
      width: Math.max(40, resizeStart.current.width + dx),
      height: Math.max(40, resizeStart.current.height + dy),
      z: Date.now(),
    });
  };

  const onResizeUp = (e: React.PointerEvent) => {
    resizeStart.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  // Note handlers
  const handleNoteSubmit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingNote(false);
    onChange({ note });
  };

  const handleNoteCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNote(img.note || "");
    setIsEditingNote(false);
  };

  const handleOpenNoteEditor = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNote(img.note || "");
    setIsEditingNote(true);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div
      className="absolute select-none image-item group"
      style={{
        left: img.x,
        top: img.y,
        width: img.width,
        height: img.height,
        zIndex: img.z ?? 1,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Container pour l'image avec position relative pour les icônes */}
      <div className="relative w-full h-full">
        {/* Image */}
        <img
          src={img.src}
          alt=""
          draggable={false}
          className="block object-cover w-full h-full select-none" // object-cover au lieu de object-contain
          style={{ pointerEvents: "none" }}
        />

        {/* Pastille de note (visible si une note existe) */}
        {img.note && !isEditingNote && (
          <div 
            className="absolute bg-blue-500 border-2 border-white rounded-full shadow-sm pointer-events-none"
            style={{
              top: '8px',
              left: '8px',
              width: '12px',
              height: '12px'
            }}
            title="Note disponible"
          />
        )}

        {/* Bouton Note : coin intérieur haut-gauche */}
        <button
          onClick={handleOpenNoteEditor}
          className="absolute p-1 transition rounded-full shadow opacity-0 img-action-btn bg-white/90 group-hover:opacity-100 hover:bg-white"
          style={{
            top: '4px',
            left: '4px'
          }}
          title="Ajouter/Éditer une note"
        >
          <FileText className="w-4 h-4 text-blue-600" />
        </button>

        {/* Bouton Supprimer : coin intérieur haut-droit */}
        <button
          onClick={handleDeleteClick}
          className="absolute p-1 transition rounded-full shadow opacity-0 img-action-btn bg-white/90 group-hover:opacity-100 hover:bg-white"
          style={{
            top: '4px',
            right: '4px'
          }}
          title="Supprimer"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>

        {/* Handle Resize : coin intérieur bas-droit */}
        <button
          className="absolute p-1 transition rounded-full shadow opacity-0 img-resize bg-white/90 cursor-se-resize group-hover:opacity-100 hover:bg-white"
          style={{
            bottom: '4px',
            right: '4px'
          }}
          title="Redimensionner"
          onPointerDown={onResizeDown}
          onPointerMove={onResizeMove}
          onPointerUp={onResizeUp}
        >
          <MoveDiagonal2 className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Modal d'édition de note */}
      {isEditingNote && (
        <div 
          className="absolute z-50 p-4 bg-white border-2 border-gray-200 rounded-lg shadow-xl note-modal"
          style={{
            top: '44px',
            left: '4px',
            minWidth: '220px',
            maxWidth: Math.max(220, img.width - 8) + 'px'
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onPointerMove={(e) => e.stopPropagation()}
        >
          <div className="mb-2">
            <label className="block mb-1 text-xs font-medium text-gray-700">
              Note sur l'image
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Écrivez votre note ici..."
              className="w-full h-20 p-2 text-sm border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              onPointerDown={(e) => e.stopPropagation()}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={handleNoteCancel}
              className="px-3 py-1 text-sm text-gray-600 transition-colors rounded hover:text-gray-800 hover:bg-gray-100"
            >
              Annuler
            </button>
            <button
              onClick={handleNoteSubmit}
              className="px-3 py-1 text-sm text-white transition-colors bg-blue-500 rounded hover:bg-blue-600"
            >
              Sauver
            </button>
          </div>
        </div>
      )}
    </div>
  );
}