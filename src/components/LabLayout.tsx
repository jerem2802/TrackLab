import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LabLayout() {
  const { user } = useAuth()

  const [notes, setNotes] = useState([
    { id: '1', text: 'Exemple de post-it', x: 100, y: 100 }
  ])
  const [scale, setScale] = useState(1)
  const [drawingMode, setDrawingMode] = useState(false)
  const [eraseMode, setEraseMode] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const toggleDrawing = () => {
    setDrawingMode((prev) => !prev)
  }

  const addNote = () => {
    const id = Date.now().toString()
    setNotes((prev) => [...prev, { id, text: 'Nouvelle note', x: 200, y: 200 }])
  }

  const handleDrag = (id: string, dx: number, dy: number) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, x: note.x + dx, y: note.y + dy } : note
      )
    )
  }

 useEffect(() => {
  const canvas = canvasRef.current
  if (!canvas || !drawingMode) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Définir le canvas sans l'effacer
  ctx.imageSmoothingEnabled = true
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  let drawing = false

  const resizeCanvas = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }

  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)

  const getPos = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  const startDraw = (e: MouseEvent) => {
    drawing = true
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: MouseEvent) => {
    if (!drawing) return
    const { x, y } = getPos(e)

    ctx.globalCompositeOperation = eraseMode ? 'destination-out' : 'source-over'
    ctx.lineWidth = eraseMode ? 20 : 2
    ctx.strokeStyle = '#111' // utile pour le crayon, ignoré en gomme

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const endDraw = () => {
    drawing = false
    ctx.closePath()
  }

  canvas.addEventListener('mousedown', startDraw)
  canvas.addEventListener('mousemove', draw)
  window.addEventListener('mouseup', endDraw)

  return () => {
    canvas.removeEventListener('mousedown', startDraw)
    canvas.removeEventListener('mousemove', draw)
    window.removeEventListener('mouseup', endDraw)
    window.removeEventListener('resize', resizeCanvas)
  }
}, [drawingMode, eraseMode])



  return (
    <div className={`fixed inset-0 flex flex-col overflow-hidden bg-gradient-to-br from-[#e0f7ff] to-[#dbeafe] ${drawingMode ? 'cursor-crosshair' : ''}`}>
      <div className="h-[72px] flex-shrink-0 bg-white shadow z-10 flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl font-bold">🧠 TrackLab – Lab Visuel</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            Connecté en tant que {user?.email}
          </span>
          <button
            onClick={addNote}
            className="px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            ➕ Ajouter une note
          </button>
          <button
            onClick={toggleDrawing}
            className={`px-3 py-1 text-sm rounded ${drawingMode ? 'bg-green-500 text-white' : 'bg-gray-200 text-black'}`}
          >
            ✏️
          </button>
          <button
            onClick={() => setEraseMode((prev) => !prev)}
            className={`px-3 py-1 text-sm rounded ${eraseMode ? 'bg-red-500 text-white' : 'bg-gray-200 text-black'}`}
          >
            🧽
          </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          className={`absolute top-0 left-0 z-20 ${drawingMode ? 'cursor-crosshair' : 'pointer-events-none'}`}
        />

        <div
          style={{
            width: 3000,
            height: 3000,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0
          }}
        >
          {notes.map((note) => (
            <DraggableNote
              key={note.id}
              note={note}
              onDrag={handleDrag}
              scale={scale}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

type StickyNote = {
  id: string
  text: string
  x: number
  y: number
}

type DraggableNoteProps = {
  note: StickyNote
  onDrag: (id: string, dx: number, dy: number) => void
  scale: number
}

function DraggableNote({ note, onDrag, scale }: DraggableNoteProps) {
  const [dragging, setDragging] = useState(false)
  const [start, setStart] = useState({ x: 0, y: 0 })

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true)
    setStart({ x: e.clientX, y: e.clientY })
  }

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (dragging) {
        const dx = (e.clientX - start.x) / scale
        const dy = (e.clientY - start.y) / scale
        onDrag(note.id, dx, dy)
        setStart({ x: e.clientX, y: e.clientY })
      }
    }

    const onMouseUp = () => setDragging(false)

    if (dragging) {
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [dragging, start, onDrag, note.id, scale])

  return (
    <div
      onMouseDown={onMouseDown}
      className="absolute w-48 px-3 py-2 text-sm text-black bg-yellow-200 rounded shadow cursor-move"
      style={{ top: note.y, left: note.x }}
    >
      {note.text}
    </div>
  )
}