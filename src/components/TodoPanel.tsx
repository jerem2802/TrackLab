// TodoPanel.tsx
import { useState } from "react"
import { Plus, X } from "lucide-react"

type Todo = { id: string; text: string; done: boolean }

export default function TodoPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [todos, setTodos] = useState<Todo[]>([
    { id: crypto.randomUUID(), text: "Tâche 1", done: false },
    { id: crypto.randomUUID(), text: "Tâche 2", done: false },
  ])
  const [text, setText] = useState("")

  if (!open) return null

  const addTodo = () => {
    if (!text.trim()) return
    setTodos((prev) => [...prev, { id: crypto.randomUUID(), text: text.trim(), done: false }])
    setText("")
  }

  return (
    <div className="fixed z-50 top-6 right-6">
      <div className="relative w-[420px]">
        {/* Image planchette */}
        <img
          src="/presse-papiers.png" // 👉 place ton png dans public/
          alt="Clipboard"
          className="w-full h-auto pointer-events-none select-none drop-shadow-2xl"
        />

        {/* Zone feuille dans la découpe */}
        <div className="absolute left-[55px] right-[58px] top-[150px] bottom-[40px] overflow-y-auto p-4 bg-white/90 rounded">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">📝 To-do list</h2>
            <button onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className="flex gap-2 mb-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTodo()}
              placeholder="Écrire une tâche…"
              className="flex-1 px-2 py-1 border rounded outline-none"
            />
            <button onClick={addTodo} className="px-3 py-1 text-white bg-blue-500 rounded">
              <Plus size={16} />
            </button>
          </div>

          <ul className="space-y-2">
            {todos.map((t) => (
              <li key={t.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() =>
                    setTodos((prev) =>
                      prev.map((todo) =>
                        todo.id === t.id ? { ...todo, done: !todo.done } : todo
                      )
                    )
                  }
                />
                <span className={t.done ? "line-through opacity-60" : ""}>{t.text}</span>
                <button onClick={() => setTodos((prev) => prev.filter((todo) => todo.id !== t.id))}>
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
