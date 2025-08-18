// components/TableItem.tsx
import { useRef } from "react"
import { GripVertical, Pencil, X } from "lucide-react"

export type TableModel = {
  id: string
  x: number
  y: number
  w: number
  h: number
  z: number
  name: string
  createdAt: number
}

type Props = {
  table: TableModel
  onChange: (patch: Partial<TableModel>) => void
  onDelete: () => void
  onFocus: () => void
  onEdit: () => void
}

export default function TableItem({ table, onChange, onDelete, onFocus, onEdit }: Props) {
  const dragRef = useRef<{ dx: number; dy: number } | null>(null)
  const resRef  = useRef<{ sx: number; sy: number; w: number; h: number } | null>(null)

  const onHeaderDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    onFocus()
    dragRef.current = { dx: e.clientX - table.x, dy: e.clientY - table.y }
    window.addEventListener("mousemove", onDrag)
    window.addEventListener("mouseup", onDragEnd)
  }
  const onDrag = (e: MouseEvent) => {
    if (!dragRef.current) return
    const { dx, dy } = dragRef.current
    onChange({ x: e.clientX - dx, y: e.clientY - dy })
  }
  const onDragEnd = () => {
    dragRef.current = null
    window.removeEventListener("mousemove", onDrag)
    window.removeEventListener("mouseup", onDragEnd)
  }

  const onResizeDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    onFocus()
    resRef.current = { sx: e.clientX, sy: e.clientY, w: table.w, h: table.h }
    window.addEventListener("mousemove", onResizing)
    window.addEventListener("mouseup", onResizeEnd)
  }
  const onResizing = (e: MouseEvent) => {
    if (!resRef.current) return
    const { sx, sy, w, h } = resRef.current
    const nw = Math.max(360, w + (e.clientX - sx))
    const nh = Math.max(200, h + (e.clientY - sy))
    onChange({ w: nw, h: nh })
  }
  const onResizeEnd = () => {
    resRef.current = null
    window.removeEventListener("mousemove", onResizing)
    window.removeEventListener("mouseup", onResizeEnd)
  }

  return (
    <div
      className="table-item"
      onMouseDown={(e)=>{ e.stopPropagation(); onFocus() }}
      style={{
        position:'absolute', left:table.x, top:table.y, width:table.w, height:table.h, zIndex:table.z,
        background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, boxShadow:'0 2px 10px rgba(0,0,0,.12)',
        display:'flex', flexDirection:'column', overflow:'hidden', userSelect:'none'
      }}
    >
      {/* HEADER */}
      <div
        onMouseDown={onHeaderDown}
        className="flex items-center gap-2 px-2 border-b border-gray-200 select-none h-9 bg-slate-50 cursor-grab"
      >
        <GripVertical size={16} />
        <input
          value={table.name}
          onChange={(e)=>onChange({ name: e.target.value })}
          onMouseDown={(e)=>e.stopPropagation()}
          className="text-sm font-semibold bg-transparent outline-none"
          style={{width:180}}
        />
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={(e)=>{ e.stopPropagation(); onEdit() }}
            className="px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
            title="Éditer dans la fenêtre"
          >
            <Pencil size={14}/>
          </button>
          <button
            onClick={(e)=>{ e.stopPropagation(); onDelete() }}
            className="px-2 py-1 text-xs bg-red-100 rounded hover:bg-red-200"
            title="Supprimer"
          >
            <X size={14}/>
          </button>
        </div>
      </div>

      {/* MINI TABLE PREVIEW */}
      <div className="flex-1 overflow-auto text-sm" onMouseDown={(e)=>e.stopPropagation()}>
        <div className="min-w-[360px]">
          {/* Header colonnes */}
          <div className="sticky top-0 flex border-b bg-slate-50 border-slate-200">
            {["Colonne 1", "Colonne 2"].map((h, i) => (
              <div key={i} className="flex-1 px-2 py-1 font-medium border-r border-slate-200">
                {h}
              </div>
            ))}
          </div>
          {/* Quelques lignes */}
          {Array.from({ length: 5 }).map((_, r) => (
            <div key={r} className={`flex ${r % 2 ? "bg-white" : "bg-slate-50/40"} border-b border-slate-100`}>
              {Array.from({ length: 2 }).map((_, c) => (
                <div key={c} className="flex-1 border-r border-slate-100">
                  <div className="px-2 py-1 truncate text-slate-500">—</div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="px-2 mt-2 text-xs text-slate-400">
          Édition complète (colonnes + / lignes +) via le bouton ✏️ ci-dessus.
        </div>
      </div>

      {/* HANDLE resize */}
      <div
        onMouseDown={onResizeDown}
        title="Redimensionner"
        style={{ position:'absolute', right:2, bottom:2, width:14, height:14,
                 borderRight:'2px solid #94a3b8', borderBottom:'2px solid #94a3b8', cursor:'nwse-resize' }}
      />
    </div>
  )
}
