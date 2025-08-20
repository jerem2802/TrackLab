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
        {/* Zone feuille dans la découpe - DERRIÈRE */}
        <div 
          className="absolute left-[59px] right-[52px] top-[134px] bottom-[85px] p-4  bg-white/90 rounded z-10"
          style={{
            backgroundImage: 'url(/fiole_purple.png)',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: '345px',
            backgroundBlendMode: 'multiply'
          }}
        >
          <div className="absolute inset-0 rounded bg-white/85"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="pt-5 font-bold">To-do list</h2>
              <button onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-1 mb-5">
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

        {/* Image planchette - DEVANT */}
        <img
          src="/presse-papiers.png"
          alt="Clipboard"
          className="relative z-20 w-full h-auto pointer-events-none select-none drop-shadow-2xl"
        />
      </div>
    </div>
  )
}