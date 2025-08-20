import {  useRef, useEffect } from 'react'
import PostItPalette from './PostItPalette'

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
}: Props) {
  const dropdownRef = useRef<HTMLDivElement>(null)

  const colors = [
    '#000000', '#FF0000', '#00AA00', '#0066FF',
    '#FFCC00', '#FF00AA', '#00CCCC', '#FF7F00',
  ]

  const tools: { name: Tool; icon: string; label: string }[] = [
    { name: 'pencil', icon: '✏️', label: 'Crayon' },
    { name: 'eraser', icon: '🧽', label: 'Gomme' },
  ]

  // Fermer la dropdown en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && showDrawingTools) {
        onToggleDrawingTools()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDrawingTools, onToggleDrawingTools])

  // Fermer la dropdown avec Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showDrawingTools) {
        onToggleDrawingTools()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showDrawingTools, onToggleDrawingTools])

  const handlePickTool = (tool: Tool) => {
    onSetDrawingTool(tool)
  }

  const handlePickColor = (color: string) => {
    onSetDrawingColor(color)
    // Automatiquement basculer vers le crayon si on était en mode gomme
    if (activeTool === 'eraser') {
      onSetDrawingTool('pencil')
    }
  }

  return (
    <div
      className="h-[72px] flex-shrink-0 bg-white shadow-lg z-20 flex items-center justify-between px-6 py-4"
      style={{ marginLeft: layersPanelOpen ? '320px' : '0px', transition: 'margin-left 0.3s ease' }}
    >
      {/* Branding */}
  <div className="flex items-center gap-2">
  <img src="/logo2.png" alt="TrackLab logo" className="w-20 h-17 drop-shadow-xl" />
<div className="relative">
  <svg className="absolute -z-10 opacity-70" width="0" height="0">
    <defs>
      <filter id="goo">
        <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur"/>
        <feColorMatrix in="blur" mode="matrix"
          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10" result="goo"/>
        <feBlend in="SourceGraphic" in2="goo"/>
      </filter>
    </defs>
  </svg>

  <div className="relative filter [filter:url(#goo)]">
    <h1 className="relative text-3xl font-extrabold text-transparent bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text">
      TrackLab
    </h1>
    {/* petites bulles “réactifs” autour du texte */}
    <span className="absolute -left-3 top-1 h-2 w-2 rounded-full bg-green-400 animate-[float1_3s_infinite]"></span>
    <span className="absolute -left-1 -top-2 h-3 w-3 rounded-full bg-cyan-400 animate-[float2_4s_infinite]"></span>
    <span className="absolute -right-2 -bottom-1 h-2 w-2 rounded-full bg-green-300 animate-[float3_3.5s_infinite]"></span>
  </div>

  <style>{`
    @keyframes float1 { 0%,100%{ transform: translateY(0)} 50%{ transform: translateY(-6px)} }
    @keyframes float2 { 0%,100%{ transform: translateY(0)} 50%{ transform: translateY(-10px)} }
    @keyframes float3 { 0%,100%{ transform: translateY(0)} 50%{ transform: translateY(-7px)} }
  `}</style>
</div>

</div>



      {/* Actions */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">Connecté : {user?.email || 'Utilisateur'}</span>

        <div className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 rounded-lg">
          <span>Zoom: {Math.round(currentScale * 100)}%</span>
          <button
            onClick={onResetView}
            className="px-2 py-1 text-xs text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Reset
          </button>
        </div>

        {/* Todo */}
        <button
          onClick={onShowTodo}
          className="px-3 py-2 text-sm text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          title="Ouvrir la to-do"
        >
          📋 To-do
        </button>

        {/* Tableau */}
        <button
          onClick={onAddTable}
          className="px-3 py-2 text-sm text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          title="Ajouter un tableau"
        >
          📊 Tableau
        </button>

        {/* Post-its */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Post-it :</span>
          <PostItPalette onCreateNote={onCreateNote} />
        </div>

        {placementMode && (
          <button
            onClick={onCancelPlacement}
            className="px-3 py-2 text-sm text-red-600 transition-colors bg-red-100 rounded-lg hover:bg-red-200"
          >
            ✕
          </button>
        )}

        {/* Dessin + menu */}
        <div className="relative" ref={dropdownRef}>
          <div className="flex">
            <button
              onClick={onToggleDrawing}
              className={`px-3 py-2 text-sm rounded-l-lg transition-colors ${
                drawingMode
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Activer/Désactiver le dessin"
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
              title="Outils de dessin"
            >
              {showDrawingTools ? '▲' : '▼'}
            </button>
          </div>

          {/* Dropdown */}
          {showDrawingTools && (
            <div className="absolute right-0 z-[60] mt-2 bg-white border rounded-lg shadow-xl top-full w-80">
              <div className="p-4 bg-gray-600">
                <div className="flex items-center justify-between mb-1">
                  <img src="fiole_rouge.png" alt="" className='h-16 w-18' />
                 <div className="relative inline-block">
  <h3
    className="relative z-10 inline-block text-2xl font-extrabold text-transparent bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text"
  >
    InkLab
  </h3>

  {/* bulles flottantes */}
  <span className="absolute -left-3 top-0 h-2 w-2 rounded-full bg-green-400 animate-[float1_3s_infinite]" />
  <span className="absolute -left-1 -top-2 h-3 w-3 rounded-full bg-cyan-400 animate-[float2_4s_infinite]" />
  <span className="absolute -right-2 -bottom-1 h-2 w-2 rounded-full bg-green-300 animate-[float3_3.5s_infinite]" />

  <style>{`
    @keyframes float1 { 0%,100%{ transform: translateY(0)} 50%{ transform: translateY(-6px)} }
    @keyframes float2 { 0%,100%{ transform: translateY(0)} 50%{ transform: translateY(-10px)} }
    @keyframes float3 { 0%,100%{ transform: translateY(0)} 50%{ transform: translateY(-7px)} }
  `}</style>
</div>

                  <button
                    onClick={onToggleDrawingTools}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {/* État actuel */}
                <div className="p-2 mb-4 text-sm rounded bg-gray-50">
                  <div className="flex items-center gap-2 bg-gray-500">
                    
                    <span className="font-medium">
                      {tools.find(t => t.name === activeTool)?.icon} {tools.find(t => t.name === activeTool)?.label}
                    </span>
                    {activeTool === 'pencil' && (
                      <>
                        <span className="mx-2">•</span>
                        <div 
                          className="w-4 h-4 border rounded"
                          style={{ backgroundColor: activeColor }}
                        />
                        <span>Taille: {activeWidth}px</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Outils */}
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
                        title={tool.label}
                      >
                        <div className="text-center">
                          <div className="text-lg">{tool.icon}</div>
                          <div className="text-xs">{tool.label}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Couleurs (seulement si crayon) */}
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
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Épaisseur (seulement si crayon) */}
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
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                      <span>1px</span>
                      <span>20px</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <button
                    onClick={() => {
                      onUndoDrawing()
                      onToggleDrawingTools()
                    }}
                    className="flex-1 px-3 py-2 text-sm text-white bg-yellow-500 rounded hover:bg-yellow-600"
                    disabled={!drawingMode}
                  >
                    ↶ Annuler
                  </button>
                  <button
                    onClick={() => {
                      onClearDrawing()
                      onToggleDrawingTools()
                    }}
                    className="flex-1 px-3 py-2 text-sm text-white bg-red-500 rounded hover:bg-red-600"
                    disabled={!drawingMode}
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
  )
}