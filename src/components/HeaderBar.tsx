import { useRef, useEffect } from 'react'
import PostItPalette from './PostItPalette'
import ZoomControls from './ZoomControl'
import TextToolbar, { TextStyles } from './TextToolbar'

export type Tool = 'pencil' | 'eraser'

interface Props {
  user: { email: string } | null
  currentScale: number
  layersPanelOpen: boolean
  placementMode: boolean
  drawingMode: boolean
  activeTool: Tool
  activeColor: string
  activeWidth: number
  showDrawingTools: boolean
  onResetView: () => void
  onShowTodo: () => void
  onAddTable: () => void
  onCreateNote: (color: string) => void
  onCancelPlacement: () => void
  onToggleDrawing: () => void
  onSetDrawingTool: (tool: Tool) => void
  onSetDrawingColor: (color: string) => void
  onSetDrawingWidth: (width: number) => void
  onClearDrawing: () => void
  onUndoDrawing: () => void
  onToggleDrawingTools: () => void
  selectedText?: { id: string; type: string; styles: TextStyles } | null
  onApplyTextStyle?: (styles: Partial<TextStyles>) => void
  onFinishTextEdit?: () => void
}

export default function HeaderBar({
  user,
  currentScale,
  layersPanelOpen,
  placementMode,
  drawingMode,
  activeTool,
  activeColor,
  activeWidth,
  showDrawingTools,
  onResetView,
  onShowTodo,
  onAddTable,
  onCreateNote,
  onCancelPlacement,
  onToggleDrawing,
  onSetDrawingTool,
  onSetDrawingColor,
  onSetDrawingWidth,
  onClearDrawing,
  onUndoDrawing,
  onToggleDrawingTools,
  selectedText,
  onApplyTextStyle,
}: Props): JSX.Element {
  const dropdownRef = useRef<HTMLDivElement>(null)

  const colors = [
    '#000000', '#FF0000', '#00AA00', '#0066FF',
    '#FFCC00', '#FF00AA', '#00CCCC', '#FF7F00',
  ]

  const tools: { name: Tool; icon: string; label: string }[] = [
    { name: 'pencil', icon: '✏️', label: 'Crayon' },
    { name: 'eraser', icon: '🧽', label: 'Gomme' },
  ]

  // Fermer le panneau d’outils de dessin au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && showDrawingTools) {
        onToggleDrawingTools()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDrawingTools, onToggleDrawingTools])

  // Fermer avec Échap
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showDrawingTools) onToggleDrawingTools()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showDrawingTools, onToggleDrawingTools])

  const handlePickTool = (tool: Tool) => onSetDrawingTool(tool)

  const handlePickColor = (color: string) => {
    onSetDrawingColor(color)
    if (activeTool === 'eraser') onSetDrawingTool('pencil')
  }

  return (
    <>
      <div
        className="z-20 flex-shrink-0 bg-white shadow-lg"
        style={{ marginLeft: layersPanelOpen ? '320px' : '0px', transition: 'margin-left 0.3s ease' }}
      >
        <div className="h-[72px] flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img src="/logo2.png" alt="TrackLab logo" className="w-20 h-17 drop-shadow-xl" />
              <h1 className="text-3xl font-extrabold text-transparent bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text">
                TrackLab
              </h1>
            </div>

            {/* TextToolbar visible quand un élément texte est en édition */}
            {selectedText && selectedText.styles && (
              <div className="flex items-center text-toolbar" data-text-toolbar>
                <div className="w-px h-8 mr-4 bg-gray-300" />
                <TextToolbar
                  styles={selectedText.styles}
                  onStyleChange={(newStyles) => onApplyTextStyle?.(newStyles)}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Connecté : {user?.email || 'Utilisateur'}</span>

            <button
              onClick={onShowTodo}
              className="px-3 py-2 text-sm text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              📋 To-do
            </button>

            <button
              onClick={onAddTable}
              className="px-3 py-2 text-sm text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              📊 Tableau
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Post-it :</span>
              <PostItPalette onCreateNote={onCreateNote} />
            </div>

            {placementMode && (
              <button
                onClick={onCancelPlacement}
                className="px-3 py-2 text-sm text-red-600 transition-colors bg-red-100 rounded-lg hover:bg-red-200"
                aria-label="Annuler le placement"
              >
                ✕
              </button>
            )}

            {/* Dessin + panneau d’options */}
            <div className="relative" ref={dropdownRef}>
              <div className="flex">
                <button
                  onClick={onToggleDrawing}
                  className={`px-3 py-2 text-sm rounded-l-lg transition-colors ${
                    drawingMode
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  ✏️ Dessiner
                </button>
                <button
                  onClick={onToggleDrawingTools}
                  className={`px-2 py-2 text-sm rounded-r-lg border-l transition-colors ${
                    drawingMode
                      ? 'bg-purple-500 text-white border-purple-400'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border-gray-300'
                  }`}
                  aria-expanded={showDrawingTools}
                >
                  {showDrawingTools ? '▲' : '▼'}
                </button>
              </div>

              {showDrawingTools && (
                <div className="absolute right-0 z-[60] mt-2 bg-white border rounded-lg shadow-xl top-full w-80">
                  <div className="p-4">
                    <div className="mb-4">
                      <label className="block mb-2 text-sm font-medium">Outils :</label>
                      <div className="flex gap-2">
                        {tools.map(tool => (
                          <button
                            key={tool.name}
                            onClick={() => handlePickTool(tool.name)}
                            className={`p-3 text-sm rounded border flex-1 transition-colors
                              ${activeTool === tool.name
                                ? 'bg-purple-600 text-white border-purple-600'
                                : 'bg-gray-100 hover:bg-gray-200 border-gray-300'
                              }`}
                          >
                            {tool.icon} {tool.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {activeTool === 'pencil' && (
                      <div className="mb-4">
                        <label className="block mb-2 text-sm font-medium">Couleurs :</label>
                        <div className="grid grid-cols-8 gap-1">
                          {colors.map(color => (
                            <button
                              key={color}
                              onClick={() => handlePickColor(color)}
                              className={`w-8 h-8 rounded border-2 transition-all
                                ${activeColor === color ? 'ring-2 ring-purple-500 ring-offset-1' : 'border-gray-300'}`}
                              style={{ backgroundColor: color }}
                              aria-label={`Couleur ${color}`}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTool === 'pencil' && (
                      <div className="mb-4">
                        <label className="block mb-2 text-sm font-medium">
                          Épaisseur : {activeWidth}px
                        </label>
                        <input
                          type="range"
                          min={1}
                          max={20}
                          value={activeWidth}
                          onChange={(e) => onSetDrawingWidth(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    )}

                    <div className="flex gap-2 pt-4 border-t">
                      <button
                        onClick={() => { onUndoDrawing(); onToggleDrawingTools() }}
                        className="flex-1 px-3 py-2 text-sm text-white bg-yellow-500 rounded"
                      >
                        ↶ Annuler
                      </button>
                      <button
                        onClick={() => { onClearDrawing(); onToggleDrawingTools() }}
                        className="flex-1 px-3 py-2 text-sm text-white bg-red-500 rounded"
                      >
                        🗑️ Effacer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ZoomControls zoomPercent={Math.round(currentScale * 100)} onReset={onResetView} />
    </>
  )
}
