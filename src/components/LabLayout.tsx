import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import PostItNote from './PostItNote'
import PostItManager from './PostItManager'
import ImageItem from './ImageItems'
import { StickyNote } from '../types/notes'
import LayersPanel from './LayersPanel'
import TableManager from './TableManager'
import TodoPanel from './TodoPanel'
import HeaderBar, { Tool } from './HeaderBar'
import DrawingLayer, { DrawingLayerRef } from './DrawingLayer'

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
  width: 20000,
  height: 15000,
  maxZoom: 3.0,
  defaultZoom: 0.5,
}

export default function LabLayout() {
  const { user } = useAuth()

  // UI state
  const [notes, setNotes] = useState<StickyNote[]>([])
  const [images, setImages] = useState<DroppedImage[]>([])
  const [selectedColor, setSelectedColor] = useState('#ffeb3b')
  const [currentScale, setCurrentScale] = useState(1)
  const [layersPanelOpen, setLayersPanelOpen] = useState(false)
  const [placementMode, setPlacementMode] = useState(false)
  const [showTodo, setShowTodo] = useState(false)

  // Drawing state
  const [drawingMode, setDrawingMode] = useState(false)
  const [activeTool, setActiveTool] = useState<Tool>('pencil')
  const [activeColor, setActiveColor] = useState('#000000')
  const [activeWidth, setActiveWidth] = useState(3)
  const [showDrawingTools, setShowDrawingTools] = useState(false)

  // Refs pan/zoom & DOM
  const workspaceRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const drawingLayerRef = useRef<DrawingLayerRef>(null)
  const scaleRef = useRef(1)
  const minZoomRef = useRef(1)
  const translateRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef(0)
  const spacePressedRef = useRef(false)

  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    initialTranslate: { x: 0, y: 0 },
  })

  const addTableFnRef = useRef<null | (() => void)>(null)

  // ---- helpers ----
  const getWorkspaceRect = () => workspaceRef.current?.getBoundingClientRect()

  const computeMinZoom = useCallback(() => {
    const r = getWorkspaceRect()
    const w = r?.width ?? window.innerWidth
    const h = r?.height ?? window.innerHeight
    
    const fillZoom = Math.max(w / CANVAS_CONFIG.width, h / CANVAS_CONFIG.height)
    return Math.max(fillZoom, 0.1)
  }, [])

  const centerTranslate = useCallback((scale: number) => {
    const r = getWorkspaceRect()
    const w = r?.width ?? window.innerWidth
    const h = r?.height ?? window.innerHeight
    
    const worldWidth = CANVAS_CONFIG.width * scale
    const worldHeight = CANVAS_CONFIG.height * scale
    
    return {
      x: (w - worldWidth) / 2,
      y: (h - worldHeight) / 2,
    }
  }, [])

  const constrainTranslate = useCallback((translate: { x: number; y: number }, scale: number) => {
    const r = getWorkspaceRect()
    const w = r?.width ?? window.innerWidth
    const h = r?.height ?? window.innerHeight
    
    const worldWidth = CANVAS_CONFIG.width * scale
    const worldHeight = CANVAS_CONFIG.height * scale
    
    const minX = w - worldWidth
    const maxX = 0
    const minY = h - worldHeight
    const maxY = 0
    
    return {
      x: Math.min(Math.max(translate.x, minX), maxX),
      y: Math.min(Math.max(translate.y, minY), maxY),
    }
  }, [])

  const applyTransform = useCallback(() => {
    if (!contentRef.current) return
    contentRef.current.style.transform =
      `translate(${translateRef.current.x}px, ${translateRef.current.y}px) scale(${scaleRef.current})`
    setCurrentScale(scaleRef.current)
  }, [])

  const updateTransform = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(applyTransform)
  }, [applyTransform])

  // ---- init + observe ----
  useLayoutEffect(() => {
    minZoomRef.current = computeMinZoom()
    scaleRef.current = Math.max(CANVAS_CONFIG.defaultZoom, minZoomRef.current)
    translateRef.current = centerTranslate(scaleRef.current)
    applyTransform()

    const el = workspaceRef.current
    if (!el) return

    const recalc = () => {
      minZoomRef.current = computeMinZoom()
      if (scaleRef.current < minZoomRef.current) {
        scaleRef.current = minZoomRef.current
      }
      translateRef.current = centerTranslate(scaleRef.current)
      applyTransform()
    }

    const ro = new ResizeObserver(recalc)
    ro.observe(el)
    window.addEventListener('resize', recalc)

    recalc()

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', recalc)
    }
  }, [applyTransform, centerTranslate, computeMinZoom])

  // ===== Drawing handlers =====
  const handleToggleDrawing = () => {
    setDrawingMode(!drawingMode)
    if (placementMode) {
      setPlacementMode(false)
    }
  }

  const handleSetDrawingTool = (tool: Tool) => {
    setActiveTool(tool)
    drawingLayerRef.current?.setTool(tool)
  }

  const handleSetDrawingColor = (color: string) => {
    setActiveColor(color)
    drawingLayerRef.current?.setColor(color)
  }

  const handleSetDrawingWidth = (width: number) => {
    setActiveWidth(width)
    drawingLayerRef.current?.setWidth(width)
  }

  const handleClearDrawing = () => {
    drawingLayerRef.current?.clear()
  }

  const handleUndoDrawing = () => {
    drawingLayerRef.current?.undo()
  }

  // ===== Notes =====
  const handleCreateNote = (color: string) => {
    if (drawingMode) {
      setDrawingMode(false)
    }
    setSelectedColor(color)
    setPlacementMode(true)
  }

  const handleDrag = (id: string, dx: number, dy: number) => {
    setNotes(prev =>
      prev.map(note => {
        if (note.id !== id) return note
        const newX = Math.min(Math.max(note.x + dx, 0), CANVAS_CONFIG.width - 160)
        const newY = Math.min(Math.max(note.y + dy, 0), CANVAS_CONFIG.height - 160)
        return { ...note, x: newX, y: newY }
      }),
    )
  }

  const handleTextUpdate = (id: string, text: string) =>
    setNotes(prev => prev.map(n => (n.id === id ? { ...n, text } : n)))

  const handleDelete = (id: string) =>
    setNotes(prev => prev.filter(n => n.id !== id))

  // ===== Images =====
  const screenToWorld = (clientX: number, clientY: number) => {
    const r = getWorkspaceRect()
    const localX = clientX - (r?.left ?? 0)
    const localY = clientY - (r?.top ?? 0)
    return {
      x: (localX - translateRef.current.x) / scaleRef.current,
      y: (localY - translateRef.current.y) / scaleRef.current,
    }
  }

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

  // ===== Zoom molette =====
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return
      e.preventDefault()

      const delta = e.deltaY * 0.001
      const unclamped = scaleRef.current * (1 - delta)
      const newScale = Math.min(
        Math.max(unclamped, minZoomRef.current),
        CANVAS_CONFIG.maxZoom
      )

      const r = getWorkspaceRect()
      const mouseX = e.clientX - (r?.left ?? 0)
      const mouseY = e.clientY - (r?.top ?? 0)

      const scaleFactor = newScale / scaleRef.current
      translateRef.current.x = mouseX - (mouseX - translateRef.current.x) * scaleFactor
      translateRef.current.y = mouseY - (mouseY - translateRef.current.y) * scaleFactor
      translateRef.current = constrainTranslate(translateRef.current, newScale)
      scaleRef.current = newScale

      updateTransform()
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [updateTransform, constrainTranslate])

  const getCursor = useCallback(() => {
    if (placementMode) return 'crosshair'
    if (drawingMode) return activeTool === 'eraser' ? 'grab' : 'crosshair'
    return 'default'
  }, [placementMode, drawingMode, activeTool])

  // ===== Clavier =====
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !spacePressedRef.current) {
        e.preventDefault()
        spacePressedRef.current = true
        document.body.style.cursor = 'grab'
      }
      if (e.code === 'Escape') {
        if (placementMode) setPlacementMode(false)
        if (drawingMode) setDrawingMode(false)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spacePressedRef.current = false
        document.body.style.cursor = getCursor()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      document.body.style.cursor = 'default'
    }
  }, [placementMode, drawingMode, getCursor])

  // ===== Pan =====
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

      const newTranslate = {
        x: dragStateRef.current.initialTranslate.x + dx,
        y: dragStateRef.current.initialTranslate.y + dy,
      }
      translateRef.current = constrainTranslate(newTranslate, scaleRef.current)

      updateTransform()
    }

    const handleMouseUp = () => {
      if (!dragStateRef.current.isDragging) return
      dragStateRef.current.isDragging = false
      document.body.style.cursor = spacePressedRef.current ? 'grab' : getCursor()
    }

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [updateTransform, constrainTranslate, getCursor])

  const isPanTarget = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false
    return (
      !target.closest('.note') &&
      !target.closest('button') &&
      !target.closest('.image-item') &&
      !target.closest('.note-modal') &&
      !target.closest('.table-item') &&
      !target.closest('.todo-panel') &&
      !target.closest('.layers-panel')
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

  // ===== Reset vue =====
  const resetView = () => {
    minZoomRef.current = computeMinZoom()
    scaleRef.current = Math.max(CANVAS_CONFIG.defaultZoom, minZoomRef.current)
    translateRef.current = centerTranslate(scaleRef.current)
    setCurrentScale(scaleRef.current)
    updateTransform()
  }

  // ===== Handlers LayersPanel =====
  const handleLayerDeleteFromPanel = (layerId: string) => {
    handleDelete(layerId)
    deleteImage(layerId)
  }

  const handleLayerRenameFromPanel = (layerId: string, newName: string) => {
    setNotes(prev => prev.map(n => (n.id === layerId ? { ...n, text: newName } : n)))
    setImages(prev => prev.map(img => (img.id === layerId ? { ...img, note: newName } : img)))
  }

  return (
    <div
      className={`fixed inset-0 flex flex-col overflow-hidden ${getCursor() === 'crosshair' ? 'cursor-crosshair' : ''}`}
    >
      {/* LayersPanel */}
      <LayersPanel
        notes={notes}
        images={images}
        onLayerSelect={(layerId, multiSelect) => {
          console.log('Layer selected:', layerId, multiSelect)
        }}
        onLayerVisibilityToggle={(layerId, visible) => {
          console.log('Toggle visibility:', layerId, visible)
        }}
        onLayerLockToggle={(layerId, locked) => {
          console.log('Toggle lock:', layerId, locked)
        }}
        onLayerDelete={handleLayerDeleteFromPanel}
        onLayerRename={handleLayerRenameFromPanel}
        isOpen={layersPanelOpen}
        onToggle={() => setLayersPanelOpen(!layersPanelOpen)}
      />

      {/* Header */}
      <HeaderBar
        user={user}
        currentScale={currentScale}
        layersPanelOpen={layersPanelOpen}
        placementMode={placementMode}
        drawingMode={drawingMode}
        activeTool={activeTool}
        activeColor={activeColor}
        activeWidth={activeWidth}
        showDrawingTools={showDrawingTools}
        onResetView={resetView}
        onShowTodo={() => setShowTodo(true)}
        onAddTable={() => addTableFnRef.current?.()}
        onCreateNote={handleCreateNote}
        onCancelPlacement={() => setPlacementMode(false)}
        onToggleDrawing={handleToggleDrawing}
        onSetDrawingTool={handleSetDrawingTool}
        onSetDrawingColor={handleSetDrawingColor}
        onSetDrawingWidth={handleSetDrawingWidth}
        onClearDrawing={handleClearDrawing}
        onUndoDrawing={handleUndoDrawing}
        onToggleDrawingTools={() => setShowDrawingTools(prev => !prev)}
      />

      {/* Workspace */}
      <div
        ref={workspaceRef}
        className="relative flex-1 overflow-hidden bg-transparent"
        style={{ marginLeft: layersPanelOpen ? '320px' : '0px', transition: 'margin-left 0.3s ease' }}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {/* DrawingLayer - au niveau workspace, pas dans le monde */}
        <DrawingLayer
          ref={drawingLayerRef}
          active={drawingMode && !showDrawingTools} // Désactiver si modal ouverte
          tool={activeTool}
          color={activeColor}
          width={activeWidth}
          transform={{
            x: translateRef.current.x,
            y: translateRef.current.y,
            scale: scaleRef.current
          }}
          worldSize={{ width: CANVAS_CONFIG.width, height: CANVAS_CONFIG.height }}
        />

        {/* Monde zoomable */}
        <div
          ref={contentRef}
          className="absolute top-0 left-0 border border-gray-300 border-dashed bg-gradient-to-br from-[#e0f7ff] to-[#dbeafe] z-0"
          style={{
            width: CANVAS_CONFIG.width,
            height: CANVAS_CONFIG.height,
            transformOrigin: 'top left',
            transform: `translate(${translateRef.current.x}px, ${translateRef.current.y}px) scale(${scaleRef.current})`,
          }}
        >
          {/* Grille */}
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
            setAddTableFn={fn => { addTableFnRef.current = fn }}
          />
        </div>
      </div>

      {/* Aide */}
      <div className="absolute z-20 p-3 text-sm text-white rounded-lg bottom-4 left-4 bg-black/70">
        <div className="mb-1 font-medium">Navigation :</div>
        <div>• <kbd className="px-1 bg-gray-600 rounded">Espace + Clic + Glisser</kbd> : Déplacer la vue</div>
        <div>• <kbd className="px-1 bg-gray-600 rounded">Molette</kbd> : Zoomer/Dézoomer</div>
        <div>• Glisser une image pour l'ajouter</div>
        {placementMode && (
          <div className="mt-2 text-yellow-300">
            <div>• <kbd className="px-1 bg-gray-600 rounded">Clic</kbd> : Placer le post-it</div>
            <div>• <kbd className="px-1 bg-gray-600 rounded">Escape</kbd> : Annuler</div>
          </div>
        )}
        {drawingMode && (
          <div className="mt-2 text-green-300">
            <div>• Mode dessin actif - {activeTool === 'eraser' ? 'Gomme' : 'Crayon'}</div>
            <div>• <kbd className="px-1 bg-gray-600 rounded">Escape</kbd> : Quitter le mode dessin</div>
          </div>
        )}
      </div>

      {/* TodoPanel */}
      <div className="todo-panel">
        <TodoPanel open={showTodo} onClose={() => setShowTodo(false)} />
      </div>
    </div>
  )
}