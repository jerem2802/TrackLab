import { useState } from "react"
import { X, Plus } from "lucide-react"

type Todo = { id: string; text: string; done: boolean }

type Props = {
  open: boolean
  onClose: () => void
}

export default function TodoPanel({ open, onClose }: Props) {
  const [todos, setTodos] = useState<Todo[]>([
    { id: "t1", text: "Tâche 1", done: false },
    { id: "t2", text: "Tâche 2", done: false },
  ])

  if (!open) return null

  const addTask = () =>
    setTodos(prev => [...prev, { id: crypto.randomUUID(), text: "Nouvelle tâche", done: false }])

  const toggle = (id: string) =>
    setTodos(prev => prev.map(t => (t.id === id ? { ...t, done: !t.done } : t)))

  const edit = (id: string, text: string) =>
    setTodos(prev => prev.map(t => (t.id === id ? { ...t, text } : t)))

  const remove = (id: string) =>
    setTodos(prev => prev.filter(t => t.id !== id))

  return (
    <>
      {/* Overlay pour fermer au clic */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Panneau latéral */}
      <div
        className="fixed top-0 right-0 z-50 flex flex-col h-full bg-white shadow-xl todo-panel w-80"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-sm font-semibold text-blue-700">To-do List</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100"
            title="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Liste */}
        <div className="flex-1 p-4 space-y-2 overflow-auto">
          {todos.map(t => (
            <div key={t.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => toggle(t.id)}
              />
              <input
                value={t.text}
                onChange={e => edit(t.id, e.target.value)}
                className={`flex-1 bg-transparent outline-none text-sm ${
                  t.done ? "line-through text-gray-400" : ""
                }`}
              />
              <button
                onClick={() => remove(t.id)}
                className="px-2 text-xs text-gray-400 hover:text-red-500"
                title="Supprimer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t">
          <button
            onClick={addTask}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            <Plus size={12} /> Ajouter une tâche
          </button>
        </div>
      </div>
    </>
  )
}
