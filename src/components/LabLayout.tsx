import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import PostItPalette from './PostItPalette'
import PostItNote from './PostItNote'
import PostItManager from './PostItManager'
import ImageItem from './ImageItems'
import { StickyNote } from '../types/notes'
import LayersPanel from './LayersPanel'
import TableManager from './TableManager'
import TodoPanel from './TodoPanel'

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

const CANVAS_CONFIG = {
  width: 8000,
  height: 6000,
  minZoom: 0.1,
  maxZoom: 3.0,
  defaultZoom: 1,
}

export default function LabLayout() {
  const { user } = useAuth()

  // UI state
  const [notes, setNotes] = useState<StickyNote[]>([])
  const [images, setImages] = useState<DroppedImage[]>([])
  const [selectedColor, setSelectedColor] = useState('#ffeb3b')
  const [drawingMode, setDrawingMode] = useState(false)
  const [eraseMode, setEraseMode] = useState(false)
  const [currentScale, setCurrentScale] = useState(CANVAS_CONFIG.defaultZoom)
  const [layersPanelOpen, setLayersPanelOpen] = useState(false)
  const [placementMode, setPlacementMode] = useState(false)
  const [showTodo, setShowTodo] = useState(false) // ← Todo panel

  // Pan/zoom refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const scaleRef = useRef(CANVAS_CONFIG.defaultZoom)
  const translateRef = useRef({
    x: (window.innerWidth - CANVAS_CONFIG.width * CANVAS_CONFIG.defaultZoom) / 2,
    y: (window.innerHeight - CANVAS_CONFIG.height * CANVAS_CONFIG.defaultZoom) / 2,
  })
  const rafRef = useRef(0)
  const spacePressedRef = useRef(false)

  const dragStateRef = useRef<{
    isDragging: boolean
    startX: number
    startY: number
    initialTranslate: { x: number; y: number }
  }>({
    isDragging: false,
    startX: 0,
    startY: 0,
    initialTranslate: { x: 0, y: 0 },
  })

  // callback fourni par TableManager (bouton header → ajoute un tableau)
  const addTableFnRef = useRef<null | (() => void)>(null)

  const updateTransform = () => {
    if (!contentRef.current) return
    contentRef.current.style.transform =
      `translate(${translateRef.current.x}px, ${translateRef.current.y}px) scale(${scaleRef.current})`
    setCurrentScale(scaleRef.current)
  }

  useEffect(() => {
    updateTransform()
  }, [])

  // ===== Notes =====
  const handleCreateNote = (color: string) => {
    setSelectedColor(color)
    setPlacementMode(true)
  }

  const handleDrag = (id: string, dx: number, dy: number) => {
    setNotes(prev => prev.map(note => {
      if (note.id === id) {
        const newX = Math.min(Math.max(note.x + dx, 0), CANVAS_CONFIG.width - 160)
        const newY = Math.min(Math.max(note.y + dy, 0), CANVAS_CONFIG.height - 160)
        return { ...note, x: newX, y: newY }
      }
      return note
    }))
  }

  const handleTextUpdate = (id: string, text: string) =>
    setNotes(prev => prev.map(n => (n.id === id ? { ...n, text } : n)))

  const handleDelete = (id: string) =>
    setNotes(prev => prev.filter(n => n.id !== id))

  // ===== Images =====
  const screenToWorld = (clientX: number, clientY: number) => ({
    x: (clientX - translateRef.current.x) / scaleRef.current,
    y: (clientY - translateRef.current.y) / scaleRef.current,
  })

  const fileToDataURL = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result as string)
      r.onerror = reject
      r.readAsDataURL(file)
    })

  const addImageFromFile = async (file: File, clientX: number, clientY: number) => {
    if (!file.type.startsWith('image/')) return
    const src = await fileToDataURL(file)
    const { x, y } = screenToWorld(clientX, clientY)
    const W = 220, H = 160
    const constrainedX = Math.min(Math.max(x - W / 2, 0), CANVAS_CONFIG.width - W)
    const constrainedY = Math.min(Math.max(y - H / 2, 0), CANVAS_CONFIG.height - H)
    setImages(prev => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        x: constrainedX,
        y: constrainedY,
        width: W,
        height: H,
        src,
        createdAt: Date.now(),
        z: Date.now(),
      },
    ])
  }

  const updateImage = (id: string, patch: Partial<DroppedImage>) => {
    setImages(prev =>
      prev.map(img => {
        if (img.id !== id) return img
        const updated = { ...img, ...patch }
        if (patch.x !== undefined || patch.width !== undefined) {
          updated.x = Math.min(Math.max(updated.x, 0), CANVAS_CONFIG.width - updated.width)
        }
        if (patch.y !== undefined || patch.height !== undefined) {
          updated.y = Math.min(Math.max(updated.y, 0), CANVAS_CONFIG.height - updated.height)
        }
        return updated
      }),
    )
  }

  const deleteImage = (id: string) =>
    setImages(prev => prev.filter(it => it.id !== id))

  const bringImageToFront = (id: string) =>
    updateImage(id, { z: Date.now() })

  // ===== Canvas Drawing =====
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !drawingMode) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.imageSmoothingEnabled = true
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    let drawing = false

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const getPos = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const startDraw = (e: MouseEvent) => {
      if (spacePressedRef.current) return
      drawing = true
      const { x, y } = getPos(e)
      ctx.beginPath()
      ctx.moveTo(x, y)
    }

    const draw = (e: MouseEvent) => {
      if (!drawing || spacePressedRef.current) return
      const { x, y } = getPos(e)
      ctx.globalCompositeOperation = eraseMode ? 'destination-out' : 'source-over'
      ctx.lineWidth = eraseMode ? 20 : 2
      ctx.strokeStyle = '#111'
      ctx.lineTo(x, y)
      ctx.stroke()
    }

    const endDraw = () => {
      drawing = false
      ctx.closePath()
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
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

  // ===== Zoom molette =====
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return
      e.preventDefault()

      const delta = e.deltaY * 0.001
      const newScale = Math.min(
        Math.max(scaleRef.current * (1 - delta), CANVAS_CONFIG.minZoom),
        CANVAS_CONFIG.maxZoom,
      )
      const scaleFactor = newScale / scaleRef.current

      const mouseX = e.clientX
      const mouseY = e.clientY
      translateRef.current.x = mouseX - (mouseX - translateRef.current.x) * scaleFactor
      translateRef.current.y = mouseY - (mouseY - translateRef.current.y) * scaleFactor
      scaleRef.current = newScale

      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(updateTransform)
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [])

  // ===== Clavier =====
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !spacePressedRef.current) {
        e.preventDefault()
        spacePressedRef.current = true
        document.body.style.cursor = 'grab'
      }
      if (e.code === 'Escape' && placementMode) setPlacementMode(false)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spacePressedRef.current = false
        document.body.style.cursor = placementMode ? 'crosshair' : 'default'
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      document.body.style.cursor = 'default'
    }
  }, [placementMode])

  // ===== Pan (Espace + drag) =====
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!spacePressedRef.current || e.button !== 0) return
      if (!isPanTarget(e.target)) return

      e.preventDefault()
      dragStateRef.current = {
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        initialTranslate: { ...translateRef.current },
      }
      document.body.style.cursor = 'grabbing'
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStateRef.current.isDragging) return
      const dx = e.clientX - dragStateRef.current.startX
      const dy = e.clientY - dragStateRef.current.startY

      translateRef.current.x = dragStateRef.current.initialTranslate.x + dx
      translateRef.current.y = dragStateRef.current.initialTranslate.y + dy

      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(updateTransform)
    }

    const handleMouseUp = () => {
      if (!dragStateRef.current.isDragging) return
      dragStateRef.current.isDragging = false
      document.body.style.cursor = spacePressedRef.current ? 'grab' : placementMode ? 'crosshair' : 'default'
    }

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [placementMode])

  const isPanTarget = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false
    return (
      !target.closest('.note') &&
      !target.closest('button') &&
      !target.closest('.image-item') &&
      !target.closest('.note-modal') &&
      !target.closest('.table-item') &&
      !target.closest('.todo-panel')
    )
  }

  // ===== DnD images =====
  const onDragOver = (e: React.DragEvent) => {
    if ([...e.dataTransfer.items].some(i => i.kind === 'file')) e.preventDefault()
  }

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) await addImageFromFile(file, e.clientX, e.clientY)
  }

  const resetView = () => {
    scaleRef.current = CANVAS_CONFIG.defaultZoom
    translateRef.current = {
      x: (window.innerWidth - CANVAS_CONFIG.width * CANVAS_CONFIG.defaultZoom) / 2,
      y: (window.innerHeight - CANVAS_CONFIG.height * CANVAS_CONFIG.defaultZoom) / 2,
    }
    setCurrentScale(CANVAS_CONFIG.defaultZoom)
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(updateTransform)
  }

  return (
    <div
      className={`fixed inset-0 flex flex-col overflow-hidden bg-gradient-to-br from-[#e0f7ff] to-[#dbeafe] ${
        drawingMode ? 'cursor-crosshair' : placementMode ? 'cursor-crosshair' : ''
      }`}
    >
      {/* LayersPanel */}
      <LayersPanel
        notes={notes}
        images={images}
        onLayerSelect={(layerId: string, multiSelect?: boolean) => {
          console.log('Layer selected:', layerId, multiSelect)
        }}
        onLayerVisibilityToggle={(layerId: string, visible: boolean) => {
          console.log('Toggle visibility:', layerId, visible)
        }}
        onLayerLockToggle={(layerId: string, locked: boolean) => {
          console.log('Toggle lock:', layerId, locked)
        }}
        onLayerDelete={(layerId: string) => {
          handleDelete(layerId)
          deleteImage(layerId)
        }}
        onLayerRename={(layerId: string, newName: string) => {
          console.log('Rename:', layerId, newName)
        }}
        isOpen={layersPanelOpen}
        onToggle={() => setLayersPanelOpen(!layersPanelOpen)}
      />

      {/* Header */}
      <div
        className="h-[72px] flex-shrink-0 bg-white shadow-lg z-20 flex items-center justify-between px-6 py-4"
        style={{ marginLeft: layersPanelOpen ? '320px' : '0px', transition: 'margin-left 0.3s ease' }}
      >
        <div className="flex items-center gap-2">
          <img src="/logo2.png" alt="TrackLab logo" className="w-20 h-17 drop-shadow-xl" />
          <h1 className="text-3xl font-bold text-fuchsia-950">TrackLab </h1>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Connecté : {user?.email || 'Utilisateur'}</span>

          <div className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 rounded-lg">
            <span>Zoom: {Math.round(currentScale * 100)}%</span>
            <button
              onClick={resetView}
              className="px-2 py-1 text-xs text-white bg-blue-500 rounded hover:bg-blue-600"
            >
              Reset
            </button>
          </div>

          {/* Todo button */}
          <button
            onClick={() => setShowTodo(true)}
            className="px-3 py-2 text-sm text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            title="Ouvrir la to-do"
          >
            📋 To-do
          </button>

          {/* Tableau */}
          <button
            onClick={() => addTableFnRef.current?.()}
            className="px-3 py-2 text-sm text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            title="Ajouter un tableau"
          >
            📊 Tableau
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Post-it :</span>
            <PostItPalette onCreateNote={handleCreateNote} />
          </div>

          {placementMode && (
            <button
              onClick={() => setPlacementMode(false)}
              className="px-3 py-2 text-sm text-red-600 transition-colors bg-red-100 rounded-lg hover:bg-red-200"
            >
              ✕
            </button>
          )}

          <button
            onClick={() => setDrawingMode(p => !p)}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              drawingMode ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ✏️ Dessiner
          </button>

          <button
            onClick={() => setEraseMode(p => !p)}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              eraseMode ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🧽 Effacer
          </button>
        </div>
      </div>

      {/* Workspace */}
      <div
        className="relative flex-1 overflow-hidden"
        style={{ marginLeft: layersPanelOpen ? '320px' : '0px', transition: 'margin-left 0.3s ease' }}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {/* Drawing layer */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 z-10 pointer-events-auto"
          style={{
            pointerEvents: drawingMode ? 'auto' : 'none',
            cursor: drawingMode ? 'crosshair' : 'default',
          }}
        />

        {/* World */}
        <div
          ref={contentRef}
          className="absolute top-0 left-0 border border-gray-300 border-dashed bg-white/5"
          style={{
            width: CANVAS_CONFIG.width,
            height: CANVAS_CONFIG.height,
            transformOrigin: 'top left',
            transform: `translate(${translateRef.current.x}px, ${translateRef.current.y}px) scale(${scaleRef.current})`,
          }}
        >
          {/* Grid */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(to right, #ccc 1px, transparent 1px),
                linear-gradient(to bottom, #ccc 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />

          {/* Placement Post-it */}
          {placementMode && (
            <PostItManager
              selectedColor={selectedColor}
              scale={currentScale}
              contentRef={contentRef}
              setNotes={setNotes}
              onPlaced={() => setPlacementMode(false)}
            />
          )}

          {/* Images */}
          {images
            .slice()
            .sort((a, b) => (a.z ?? 0) - (b.z ?? 0))
            .map(img => (
              <ImageItem
                key={img.id}
                img={img}
                scale={currentScale}
                onChange={patch => updateImage(img.id, patch)}
                onDelete={() => deleteImage(img.id)}
                onFocus={() => bringImageToFront(img.id)}
              />
            ))}

          {/* Post-its */}
          {notes.map(note => (
            <PostItNote
              key={note.id}
              note={note}
              scale={currentScale}
              onDrag={handleDrag}
              onUpdateText={handleTextUpdate}
              onDelete={handleDelete}
            />
          ))}

          {/* Tables */}
          <TableManager
            worldWidth={CANVAS_CONFIG.width}
            worldHeight={CANVAS_CONFIG.height}
            translate={translateRef.current}
            scale={scaleRef.current}
            setAddTableFn={fn => {
              addTableFnRef.current = fn
            }}
          />
        </div>
      </div>

      {/* Aide */}
      <div className="absolute z-20 p-3 text-sm text-white rounded-lg bottom-4 left-4 bg-black/70">
        <div className="mb-1 font-medium">Navigation :</div>
        <div>• <kbd className="px-1 bg-gray-600 rounded">Espace + Glisser</kbd> : Déplacer la vue</div>
        <div>• <kbd className="px-1 bg-gray-600 rounded">Molette</kbd> : Zoomer/Dézoomer</div>
        <div>• Glisser une image pour l'ajouter</div>
        {placementMode && (
          <div className="mt-2 text-yellow-300">
            <div>• <kbd className="px-1 bg-gray-600 rounded">Clic</kbd> : Placer le post-it</div>
            <div>• <kbd className="px-1 bg-gray-600 rounded">Escape</kbd> : Annuler</div>
          </div>
        )}
      </div>

      {/* TodoPanel au niveau racine */}
      <div className="todo-panel">
        <TodoPanel open={showTodo} onClose={() => setShowTodo(false)} />
      </div>
    </div>
  )
}
