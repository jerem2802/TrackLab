import { useState, useRef } from 'react'
import { Eye, EyeOff, Lock, Unlock, Edit2, Trash2, MoreVertical } from 'lucide-react'
import { LayerElement, LayerOperations, getLayerDisplayName, getLayerIcon } from '../types/layers'

interface Props {
  layer: LayerElement
  isSelected: boolean
  operations: LayerOperations
  indentLevel?: number // Pour les éléments dans des groupes
}

export default function LayerItem({ layer, isSelected, operations, indentLevel = 0 }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(layer.name)
  const [showMenu, setShowMenu] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDoubleClick = () => {
    setIsEditing(true)
    setEditName(layer.name || getLayerDisplayName(layer))
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleNameSubmit = () => {
    if (editName.trim() !== layer.name) {
      operations.renameLayer(layer.id, editName.trim())
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit()
    } else if (e.key === 'Escape') {
      setEditName(layer.name)
      setIsEditing(false)
    }
  }

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation()
    operations.selectLayer(layer.id, e.ctrlKey || e.metaKey)
  }

  const handleVisibilityToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    operations.toggleVisibility(layer.id)
  }

  const handleLockToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    operations.toggleLock(layer.id)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    operations.deleteLayer(layer.id)
    setShowMenu(false)
  }

  const displayName = layer.name || getLayerDisplayName(layer)
  const icon = getLayerIcon(layer.type)

  return (
    <div
      className={`group relative flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
        isSelected 
          ? 'bg-blue-100 border border-blue-300' 
          : 'hover:bg-gray-50 border border-transparent'
      } ${layer.locked ? 'opacity-60' : ''}`}
      style={{ marginLeft: indentLevel * 20 }}
      onClick={handleSelect}
      onDoubleClick={handleDoubleClick}
    >
      {/* Icône de type */}
      <span className="text-sm" title={`Type: ${layer.type}`}>
        {icon}
      </span>

      {/* Nom de l'élément */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={handleKeyDown}
            className="w-full px-1 py-0 text-sm bg-white border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span 
            className={`block text-sm truncate ${
              layer.visible ? 'text-gray-900' : 'text-gray-400 line-through'
            }`}
            title={displayName}
          >
            {displayName}
          </span>
        )}
      </div>

      {/* Indicateurs et actions */}
      <div className="flex items-center gap-1 transition-opacity opacity-0 group-hover:opacity-100">
        {/* Bouton visibilité */}
        <button
          onClick={handleVisibilityToggle}
          className={`p-1 rounded hover:bg-gray-200 transition-colors ${
            !layer.visible ? 'opacity-100' : ''
          }`}
          title={layer.visible ? 'Masquer' : 'Afficher'}
        >
          {layer.visible ? (
            <Eye size={14} className="text-gray-600" />
          ) : (
            <EyeOff size={14} className="text-gray-400" />
          )}
        </button>

        {/* Bouton verrouillage */}
        <button
          onClick={handleLockToggle}
          className={`p-1 rounded hover:bg-gray-200 transition-colors ${
            layer.locked ? 'opacity-100' : ''
          }`}
          title={layer.locked ? 'Déverrouiller' : 'Verrouiller'}
        >
          {layer.locked ? (
            <Lock size={14} className="text-red-500" />
          ) : (
            <Unlock size={14} className="text-gray-600" />
          )}
        </button>

        {/* Menu contextuel */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="p-1 transition-colors rounded hover:bg-gray-200"
            title="Plus d'actions"
          >
            <MoreVertical size={14} className="text-gray-600" />
          </button>

          {showMenu && (
            <>
              {/* Overlay pour fermer le menu */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              
              {/* Menu dropdown */}
              <div className="absolute right-0 z-20 w-40 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg top-full">
                <button
                  onClick={() => {
                    setIsEditing(true)
                    setEditName(layer.name || getLayerDisplayName(layer))
                    setShowMenu(false)
                    setTimeout(() => inputRef.current?.focus(), 0)
                  }}
                  className="flex items-center w-full gap-2 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <Edit2 size={14} />
                  Renommer
                </button>
                
                <button
                  onClick={handleDelete}
                  className="flex items-center w-full gap-2 px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                  <Trash2 size={14} />
                  Supprimer
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Indicateur de données spécifiques */}
      <div className="flex items-center gap-1">
        {/* Pour les notes : afficher un point de couleur */}
        {layer.type === 'note' && layer.data?.color && (
          <div
            className="w-3 h-3 border border-gray-300 rounded-full"
            style={{ backgroundColor: layer.data.color }}
            title={`Couleur: ${layer.data.color}`}
          />
        )}

        {/* Pour les images : afficher les dimensions */}
        {layer.type === 'image' && layer.data?.width && layer.data?.height && (
          <span className="text-xs text-gray-400" title="Dimensions">
            {layer.data.width}×{layer.data.height}
          </span>
        )}

        {/* Indicateur de texte pour les notes */}
        {layer.type === 'note' && layer.data?.text && (
          <span className="text-xs text-gray-400" title="Contient du texte">
            📝
          </span>
        )}
      </div>
    </div>
  )
}


// 🎯 Fonctionnalités du LayerItem :

// Double-clic pour renommer avec validation
// Boutons show/hide et lock/unlock au hover
// Menu contextuel avec actions supplémentaires
// Indicateurs visuels (couleur des notes, dimensions des images)
// Sélection multiple avec Ctrl/Cmd
// Indentation pour les éléments dans des groupes
// États visuels (sélectionné, masqué, verrouillé)

// ✅ Détails UX :

// Icônes contextuelles selon le type
// Nom tronqué avec tooltip complet
// Indicateurs de contenu (texte, couleur, etc.)
// Feedback visuel immédiat
// Raccourcis clavier (Enter/Escape)