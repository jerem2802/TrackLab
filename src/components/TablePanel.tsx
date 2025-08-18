import {  useEffect, useRef, useState } from "react";
import { X, Plus, Minus, GripVertical } from "lucide-react";

type Column = { id: string; title: string; width: number }; // px
type Row = string[];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function TablePanel({ isOpen, onClose }: Props) {
  // ---------------- Tableau (identique au MVP)
  const [columns, setColumns] = useState<Column[]>([
    { id: "c1", title: "Colonne 1", width: 180 },
    { id: "c2", title: "Colonne 2", width: 180 },
  ]);
  const [rows, setRows] = useState<Row[]>(Array.from({ length: 10 }, () => ["", ""]));

  const addColumn = () => {
    setColumns((cols) => {
      const id = `c${Date.now().toString(36)}`;
      setRows((rs) => rs.map((r) => [...r, ""]));
      return [...cols, { id, title: `Colonne ${cols.length + 1}`, width: 180 }];
    });
  };
  const removeColumn = (index: number) => {
    setColumns((cols) => {
      if (cols.length <= 1) return cols;
      setRows((rs) => rs.map((r) => r.filter((_, i) => i !== index)));
      return cols.filter((_, i) => i !== index);
    });
  };
  const renameColumn = (i: number, title: string) =>
    setColumns((cols) => cols.map((c, idx) => (idx === i ? { ...c, title } : c)));

  const addRow = () => setRows((rs) => [...rs, Array.from({ length: columns.length }, () => "")]);
  const removeRow = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i));
  const editCell = (ri: number, ci: number, v: string) =>
    setRows((rs) => rs.map((r, i) => (i === ri ? r.map((c, j) => (j === ci ? v : c)) : r)));

  // ---- Redimensionnement des colonnes
  const colResRef = useRef<{ index: number; startX: number; startW: number } | null>(null);
  const onColResizeStart = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    colResRef.current = { index, startX: e.clientX, startW: columns[index].width };
    window.addEventListener("mousemove", onColResizing);
    window.addEventListener("mouseup", onColResizeEnd);
  };
  const onColResizing = (e: MouseEvent) => {
    const ctx = colResRef.current;
    if (!ctx) return;
    const w = Math.max(100, ctx.startW + (e.clientX - ctx.startX));
    setColumns((cols) => cols.map((c, i) => (i === ctx.index ? { ...c, width: w } : c)));
  };
  const onColResizeEnd = () => {
    colResRef.current = null;
    window.removeEventListener("mousemove", onColResizing);
    window.removeEventListener("mouseup", onColResizeEnd);
  };

  // ---------------- Fenêtre : position + taille (drag + resize)
  const [pos, setPos] = useState({ x: 0, y: 80 });
  const [size, setSize] = useState({ w: 1000, h: 520 });
  const minSize = { w: 520, h: 320 };

  // centre horizontal au premier open
  useEffect(() => {
    if (!isOpen) return;
    setPos((p) => ({ x: Math.max(16, (window.innerWidth - size.w) / 2), y: p.y }));
  }, [isOpen, size.w]);

  // drag fenêtre
  const dragRef = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);
  const onDragStart = (e: React.MouseEvent) => {
    dragRef.current = { sx: e.clientX, sy: e.clientY, px: pos.x, py: pos.y };
    window.addEventListener("mousemove", onDragging);
    window.addEventListener("mouseup", onDragEnd);
  };
  const onDragging = (e: MouseEvent) => {
    const ctx = dragRef.current;
    if (!ctx) return;
    const nx = Math.max(8, Math.min(window.innerWidth - 8 - size.w, ctx.px + (e.clientX - ctx.sx)));
    const ny = Math.max(8, Math.min(window.innerHeight - 8 - size.h, ctx.py + (e.clientY - ctx.sy)));
    setPos({ x: nx, y: ny });
  };
  const onDragEnd = () => {
    dragRef.current = null;
    window.removeEventListener("mousemove", onDragging);
    window.removeEventListener("mouseup", onDragEnd);
  };

  // resize fenêtre (poignée bas-droite)
  const winResRef = useRef<{ sx: number; sy: number; sw: number; sh: number } | null>(null);
  const onWinResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    winResRef.current = { sx: e.clientX, sy: e.clientY, sw: size.w, sh: size.h };
    window.addEventListener("mousemove", onWinResizing);
    window.addEventListener("mouseup", onWinResizeEnd);
  };
  const onWinResizing = (e: MouseEvent) => {
    const ctx = winResRef.current;
    if (!ctx) return;
    const w = Math.max(minSize.w, ctx.sw + (e.clientX - ctx.sx));
    const h = Math.max(minSize.h, ctx.sh + (e.clientY - ctx.sy));
    setSize({ w, h });
  };
  const onWinResizeEnd = () => {
    winResRef.current = null;
    window.removeEventListener("mousemove", onWinResizing);
    window.removeEventListener("mouseup", onWinResizeEnd);
  };

  // ESC pour fermer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop cliquable */}
      <div className="fixed inset-0 z-[59] bg-black/20" onClick={onClose} />
      {/* Fenêtre flottante */}
      <div
        className="fixed z-[60] rounded-2xl border border-gray-200 bg-white shadow-2xl"
        style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
      >
        {/* Barre de titre (zone de drag) */}
        <div
          className="flex items-center justify-between px-3 py-2 border-b cursor-move select-none rounded-t-2xl bg-gradient-to-r from-white to-gray-50"
          onMouseDown={onDragStart}
        >
          <div className="flex items-center gap-2">
            <GripVertical size={16} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-800">Tableau</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                addColumn();
              }}
              className="inline-flex items-center gap-1 px-2 py-1 ml-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              title="Ajouter une colonne"
            >
              <Plus size={14} /> Colonne
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                addRow();
              }}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white rounded-md bg-emerald-600 hover:bg-emerald-700"
              title="Ajouter une ligne"
            >
              <Plus size={14} /> Ligne
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 rounded-md hover:bg-gray-100"
            title="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Corps */}
        <div className="flex h-[calc(100%-64px)] flex-col p-3">
          <div className="relative flex-1 min-h-0 overflow-auto border border-gray-200 rounded-lg">
            {/* En-têtes */}
            <div className="sticky top-0 z-10 flex bg-gray-50/95 backdrop-blur">
              {columns.map((col, i) => (
                <div
                  key={col.id}
                  className="flex items-stretch border-r border-gray-200"
                  style={{ width: col.width }}
                >
                  <input
                    value={col.title}
                    onChange={(e) => renameColumn(i, e.target.value)}
                    className="w-full px-2 py-2 text-sm font-medium bg-transparent outline-none"
                  />
                  <button
                    onClick={() => removeColumn(i)}
                    className="px-2 text-gray-500 border-l border-gray-200 hover:bg-red-50 hover:text-red-600"
                    title="Supprimer cette colonne"
                  >
                    <Minus size={14} />
                  </button>
                  <div
                    onMouseDown={(e) => onColResizeStart(e, i)}
                    className="w-1 bg-transparent select-none cursor-col-resize hover:bg-blue-300"
                    title="Redimensionner la colonne"
                  />
                </div>
              ))}
            </div>

            {/* Lignes */}
            {rows.map((row, rIdx) => (
              <div
                key={rIdx}
                className={`flex border-t border-gray-200 ${rIdx % 2 ? "bg-white" : "bg-gray-50/30"}`}
              >
                {columns.map((col, cIdx) => (
                  <div key={col.id} className="border-r border-gray-200" style={{ width: col.width }}>
                    <input
                      value={row[cIdx] ?? ""}
                      onChange={(e) => editCell(rIdx, cIdx, e.target.value)}
                      className="block w-full px-2 py-2 text-sm bg-transparent outline-none focus:bg-blue-50"
                    />
                  </div>
                ))}
                <button
                  onClick={() => removeRow(rIdx)}
                  className="px-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                  title="Supprimer cette ligne"
                >
                  <Minus size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-3 py-1 mt-2 text-xs text-gray-600 border border-gray-200 rounded-md">
            <span>
              {rows.length} ligne(s) • {columns.length} colonne(s)
            </span>
            <span>Astuce : drag sur la barre du haut pour déplacer • poignée bleue pour redimensionner les colonnes</span>
          </div>
        </div>

        {/* Poignée de redimensionnement fenêtre */}
        <div
          onMouseDown={onWinResizeStart}
          className="absolute w-3 h-3 bg-gray-300 rounded-sm bottom-2 right-2 cursor-se-resize"
          title="Redimensionner la fenêtre"
        />
      </div>
    </>
  );
}
