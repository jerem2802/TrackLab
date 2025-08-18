import { useMemo } from 'react'
import { 
  Group, 
  Ungroup, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Trash2, 
  Copy, 
   
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { LayerElement, LayerOperations } from '../types/layers'

interface Props {
  selectedLayers: string[]
  layers: Record<string, LayerElement>
  operations: LayerOperations
}

export default function LayerToolbar({ selectedLayers, layers, operations }: Props) {
  // Calculer les propriétés des éléments sélectionnés
  const selectionInfo = useMemo(() => {
    const selected = selectedLayers.map(id => layers[id]).filter(Boolean)
    
    if (selected.length === 0) {
      return {
        count: 0,
        canGroup: false,
        canUngroup: false,
        allVisible: false,
        allHidden: false,
        allLocked: false,
        allUnlocked: false,
        hasGroups: false,
        hasIndividuals: false
      }
    }

    const groups = selected.filter(layer => layer.type === 'group')
    const individuals = selected.filter(layer => layer.type !== 'group')
    
    return {
      count: selected.length,
      canGroup: individuals.length >= 2, // Au moins 2 éléments individuels
      canUngroup: groups.length > 0, // Au moins un groupe
      allVisible: selected.every(layer => layer.visible),
      allHidden: selected.every(layer => !layer.visible),
      allLocked: selected.every(layer => layer.locked),
      allUnlocked: selected.every(layer => !layer.locked),
      hasGroups: groups.length > 0,
      hasIndividuals: individuals.length > 0
    }
  }, [selectedLayers, layers])

  const handleGroupSelected = () => {
    if (!selectionInfo.canGroup) return
    
    const individualsToGroup = selectedLayers.filter(id => {
      const layer = layers[id]
      return layer && layer.type !== 'group'
    })
    
    operations.groupLayers(individualsToGroup, `Groupe ${Date.now()}`)
  }

  const handleUngroupSelected = () => {
    if (!selectionInfo.canUngroup) return
    
    selectedLayers.forEach(id => {
      const layer = layers[id]
      if (layer && layer.type === 'group') {
        operations.ungroupLayer(id)
      }
    })
  }

  const handleToggleVisibility = () => {
    const shouldShow = !selectionInfo.allVisible
    
    selectedLayers.forEach(id => {
      const layer = layers[id]
      if (layer && layer.visible !== shouldShow) {
        operations.toggleVisibility(id)
      }
    })
  }

  const handleToggleLock = () => {
    const shouldLock = !selectionInfo.allLocked
    
    selectedLayers.forEach(id => {
      const layer = layers[id]
      if (layer && layer.locked !== shouldLock) {
        operations.toggleLock(id)
      }
    })
  }

  const handleDeleteSelected = () => {
    if (selectedLayers.length === 0) return
    
    const confirmed = window.confirm(
      `Supprimer ${selectedLayers.length} élément${selectedLayers.length > 1 ? 's' : ''} ?`
    )
    
    if (confirmed) {
      selectedLayers.forEach(id => {
        operations.deleteLayer(id)
      })
    }
  }

  const handleDuplicateSelected = () => {
    // TODO: Implémenter la duplication
    console.log('Duplication en développement')
  }

  const handleMoveUp = () => {
    // TODO: Implémenter le réordonnancement
    console.log('Déplacement vers le haut en développement')
  }

  const handleMoveDown = () => {
    // TODO: Implémenter le réordonnancement  
    console.log('Déplacement vers le bas en développement')
  }

  if (selectionInfo.count === 0) {
    return (
      <div className="p-3 border-b border-gray-100">
        <div className="py-2 text-xs text-center text-gray-400">
          Sélectionnez des éléments pour voir les actions
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 border-b border-gray-100 bg-gray-50">
      {/* Compteur de sélection */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-600">
          {selectionInfo.count} élément{selectionInfo.count > 1 ? 's' : ''} sélectionné{selectionInfo.count > 1 ? 's' : ''}
        </span>
        
        {/* Actions rapides */}
        <div className="flex items-center gap-1">
          {/* Visibilité */}
          <button
            onClick={handleToggleVisibility}
            className={`p-1.5 rounded transition-colors ${
              selectionInfo.allVisible 
                ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                : selectionInfo.allHidden
                ? 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
            }`}
            title={
              selectionInfo.allVisible 
                ? 'Masquer la sélection' 
                : selectionInfo.allHidden
                ? 'Afficher la sélection'
                : 'Basculer la visibilité'
            }
          >
            {selectionInfo.allHidden ? (
              <EyeOff size={14} />
            ) : (
              <Eye size={14} />
            )}
          </button>

          {/* Verrouillage */}
          <button
            onClick={handleToggleLock}
            className={`p-1.5 rounded transition-colors ${
              selectionInfo.allLocked 
                ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                : selectionInfo.allUnlocked
                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
            }`}
            title={
              selectionInfo.allLocked 
                ? 'Déverrouiller la sélection' 
                : selectionInfo.allUnlocked
                ? 'Verrouiller la sélection'
                : 'Basculer le verrouillage'
            }
          >
            {selectionInfo.allLocked ? (
              <Lock size={14} />
            ) : (
              <Unlock size={14} />
            )}
          </button>

          {/* Suppression */}
          <button
            onClick={handleDeleteSelected}
            className="p-1.5 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
            title="Supprimer la sélection"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Actions principales */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Groupement */}
        {selectionInfo.canGroup && (
          <button
            onClick={handleGroupSelected}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            title={`Grouper ${selectionInfo.count} éléments`}
          >
            <Group size={14} />
            Grouper
          </button>
        )}

        {/* Dégroupement */}
        {selectionInfo.canUngroup && (
          <button
            onClick={handleUngroupSelected}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
            title="Dégrouper la sélection"
          >
            <Ungroup size={14} />
            Dégrouper
          </button>
        )}

        {/* Duplication */}
        <button
          onClick={handleDuplicateSelected}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          title="Dupliquer la sélection"
          disabled
        >
          <Copy size={14} />
          Dupliquer
        </button>

        {/* Réordonnancement */}
        <div className="flex items-center overflow-hidden border border-gray-300 rounded">
          <button
            onClick={handleMoveUp}
            className="p-1.5 text-gray-600 hover:bg-gray-100 transition-colors"
            title="Déplacer vers le haut"
            disabled
          >
            <ChevronUp size={14} />
          </button>
          <div className="w-px bg-gray-300" />
          <button
            onClick={handleMoveDown}
            className="p-1.5 text-gray-600 hover:bg-gray-100 transition-colors"
            title="Déplacer vers le bas"
            disabled
          >
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Informations contextuelles */}
      {(selectionInfo.hasGroups || selectionInfo.hasIndividuals) && (
        <div className="mt-2 text-xs text-gray-500">
          {selectionInfo.hasGroups && selectionInfo.hasIndividuals && (
            <span>Sélection mixte : groupes et éléments individuels</span>
          )}
          {selectionInfo.hasGroups && !selectionInfo.hasIndividuals && (
            <span>
              {selectionInfo.count} groupe{selectionInfo.count > 1 ? 's' : ''} sélectionné{selectionInfo.count > 1 ? 's' : ''}
            </span>
          )}
          {!selectionInfo.hasGroups && selectionInfo.hasIndividuals && selectionInfo.canGroup && (
            <span>Cliquez sur "Grouper" pour créer un groupe</span>
          )}
        </div>
      )}
    </div>
  )
}