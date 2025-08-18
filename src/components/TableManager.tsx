import { useEffect, useState } from "react"
import TableItem, { TableModel } from "./TableItem"
import TablePanel from "./TablePanel"
import Portal from "./Portal"

type Props = {
  worldWidth: number
  worldHeight: number
  translate: { x:number; y:number }
  scale: number
  setAddTableFn: (fn: () => void) => void
}

export default function TableManager({ worldWidth, worldHeight, translate, scale, setAddTableFn }: Props) {
  const [tables, setTables] = useState<TableModel[]>([])
  const [editorFor, setEditorFor] = useState<string | null>(null)

  const clamp = (t: TableModel): TableModel => ({
    ...t,
    x: Math.min(Math.max(t.x, 0), worldWidth  - t.w),
    y: Math.min(Math.max(t.y, 0), worldHeight - t.h),
  })

  const addTable = () => {
    const cx = (window.innerWidth  / 2 - translate.x) / scale
    const cy = (window.innerHeight / 2 - translate.y) / scale
    const w = 640, h = 320
    const x = Math.max(0, Math.min(cx - w/2, worldWidth  - w))
    const y = Math.max(0, Math.min(cy - h/2, worldHeight - h))

    const t: TableModel = {
      id: crypto.randomUUID(),
      x, y, w, h,
      z: Date.now(),
      name: "Tableau",
      createdAt: Date.now(),
    }
    console.log("[TableManager] addTable", t)
    setTables(ts => [...ts, t])
  }

  // Branche le bouton du header → passer la fonction DIRECTEMENT
  useEffect(() => {
    setAddTableFn(addTable)   // ⬅️ la correction est ici
  }, [setAddTableFn, translate, scale, worldWidth, worldHeight])

  const updateTable = (id: string, patch: Partial<TableModel>) =>
    setTables(ts => ts.map(t => t.id === id ? clamp({ ...t, ...patch }) : t))

  const deleteTable = (id: string) =>
    setTables(ts => ts.filter(t => t.id !== id))

  const bringFront = (id: string) =>
    updateTable(id, { z: Date.now() })

  return (
    <>
      {tables.map(t => (
        <TableItem
          key={t.id}
          table={t}
          onChange={(p)=>updateTable(t.id, p)}
          onDelete={()=>deleteTable(t.id)}
          onFocus={()=>bringFront(t.id)}
          onEdit={()=>setEditorFor(t.id)}
        />
      ))}

      {/* Rendu en Portal pour éviter le parent transformé */}
      <Portal>
        <TablePanel
          isOpen={editorFor !== null}
          onClose={()=>setEditorFor(null)}
        />
      </Portal>
    </>
  )
}
