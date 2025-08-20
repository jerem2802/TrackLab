import { useState, useRef } from 'react'
import { ChevronRight, ChevronDown, Folder, FolderOpen, Eye, EyeOff, Lock, Unlock, Edit2, Trash2, Ungroup, MoreVertical } from 'lucide-react'
import LayerItem from './LayerItem'
import { LayerElement, LayerOperations } from '../types/layers'

interface Props {
  group: LayerElement
  layers: Record<string, LayerElement>
  selectedLayers: string[]
  isExpanded: boolean
  onToggleExpand: (groupId: string) => void
  operations: LayerOperations
}

export default function LayerGroup({ 
  group, 
  layers, 
  selectedLayers, 
  isExpanded, 
  onToggleExpand, 
  operations 
}: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(group.name)
  const [showMenu, setShowMenu] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Récupérer les enfants du groupe
  const children = (group.children || [])
    .map(childId => layers[childId])
    .filter(Boolean)
    .sort((a, b) => b.updatedAt - a.updatedAt)

  const isSelected = selectedLayers.includes(group.id)
  const hasSelectedChildren = children.some(child => selectedLayers.includes(child.id))

  // Calculer les propriétés du groupe basées sur ses enfants
  const allChildrenVisible = children.every(child => child.visible)
  const someChildrenVisible = children.some(child => child.visible)
  const allChildrenLocked = children.every(child => child.locked)
  const someChildrenLocked = children.some(child => child.locked)

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    setEditName(group.name)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleNameSubmit = () => {
    if (editName.trim() !== group.name) {
      operations.renameLayer(group.id, editName.trim())
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit()
    } else if (e.key === 'Escape') {
      setEditName(group.name)
      setIsEditing(false)
    }
  }

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation()
    operations.selectLayer(group.id, e.ctrlKey || e.metaKey)
  }

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleExpand(group.id)
  }

  const handleGroupVisibilityToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    const newVisible = !allChildrenVisible
    
    // Appliquer à tous les enfants
    children.forEach(child => {
      if (child.visible !== newVisible) {
        operations.toggleVisibility(child.id)
      }
    })
  }

  const handleGroupLockToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    const newLocked = !allChildrenLocked
    
    // Appliquer à tous les enfants
    children.forEach(child => {
      if (child.locked !== newLocked) {
        operations.toggleLock(child.id)
      }
    })
  }

  const handleUngroup = () => {
    operations.ungroupLayer(group.id)
    setShowMenu(false)
  }

  const handleDeleteGroup = () => {
    // Supprimer tous les enfants puis le groupe
    children.forEach(child => {
      operations.deleteLayer(child.id)
    })
    setShowMenu(false)
  }

  return (
    <div className="select-none">
      {/* Header du groupe */}
      <div
        className={`group relative flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
          isSelected 
            ? 'bg-blue-100 border border-blue-300' 
            : hasSelectedChildren
            ? 'bg-blue-50 border border-blue-200'
            : 'hover:bg-gray-50 border border-transparent'
        }`}
        onClick={handleSelect}
        onDoubleClick={handleDoubleClick}
      >
        {/* Bouton expand/collapse */}
        <button
          onClick={handleToggleExpand}
          className="p-0.5 hover:bg-gray-200 rounded transition-colors"
          title={isExpanded ? 'Réduire' : 'Développer'}
        >
          {isExpanded ? (
            <ChevronDown size={16} className="text-gray-600" />
          ) : (
            <ChevronRight size={16} className="text-gray-600" />
          )}
        </button>

        {/* Icône de dossier */}
        <span className="text-sm" title="Groupe">
          {isExpanded ? (
            <FolderOpen size={16} className="text-blue-600" />
          ) : (
            <Folder size={16} className="text-gray-600" />
          )}
        </span>

        {/* Nom du groupe */}
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
            <div className="flex items-center gap-2">
              <span 
                className={`text-sm font-medium truncate ${
                  someChildrenVisible ? 'text-gray-900' : 'text-gray-400 line-through'
                }`}
                title={group.name}
              >
                {group.name}
              </span>
              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                {children.length}
              </span>
            </div>
          )}
        </div>

        {/* Actions du groupe */}
        <div className="flex items-center gap-1 transition-opacity opacity-0 group-hover:opacity-100">
          {/* Bouton visibilité du groupe */}
          <button
            onClick={handleGroupVisibilityToggle}
            className={`p-1 rounded hover:bg-gray-200 transition-colors ${
              !someChildrenVisible ? 'opacity-100' : ''
            }`}
            title={allChildrenVisible ? 'Masquer tout' : 'Afficher tout'}
          >
            {someChildrenVisible ? (
              allChildrenVisible ? (
                <Eye size={14} className="text-gray-600" />
              ) : (
                <Eye size={14} className="text-blue-500" />
              )
            ) : (
              <EyeOff size={14} className="text-gray-400" />
            )}
          </button>

          {/* Bouton verrouillage du groupe */}
          <button
            onClick={handleGroupLockToggle}
            className={`p-1 rounded hover:bg-gray-200 transition-colors ${
              someChildrenLocked ? 'opacity-100' : ''
            }`}
            title={allChildrenLocked ? 'Déverrouiller tout' : 'Verrouiller tout'}
          >
            {someChildrenLocked ? (
              allChildrenLocked ? (
                <Lock size={14} className="text-red-500" />
              ) : (
                <Lock size={14} className="text-orange-500" />
              )
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
                <div className="absolute right-0 z-20 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg top-full w-44">
                  <button
                    onClick={() => {
                      setIsEditing(true)
                      setEditName(group.name)
                      setShowMenu(false)
                      setTimeout(() => inputRef.current?.focus(), 0)
                    }}
                    className="flex items-center w-full gap-2 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <Edit2 size={14} />
                    Renommer
                  </button>
                  
                  <button
                    onClick={handleUngroup}
                    className="flex items-center w-full gap-2 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <Ungroup size={14} />
                    Dégrouper
                  </button>
                  
                  <div className="my-1 border-t border-gray-100" />
                  
                  <button
                    onClick={handleDeleteGroup}
                    className="flex items-center w-full gap-2 px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                    Supprimer le groupe
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Contenu du groupe (enfants) */}
      {isExpanded && children.length > 0 && (
        <div className="pl-2 mt-1 ml-4 space-y-1 border-l-2 border-gray-100">
          {children.map(child => (
            <LayerItem
              key={child.id}
              layer={child}
              isSelected={selectedLayers.includes(child.id)}
              operations={operations}
              indentLevel={1}
            />
          ))}
        </div>
      )}

      {/* État vide du groupe */}
      {isExpanded && children.length === 0 && (
        <div className="mt-2 mb-2 ml-8 text-xs italic text-gray-400">
          Groupe vide
        </div>
      )}
    </div>
  )
}