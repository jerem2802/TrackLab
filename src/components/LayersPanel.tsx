import { useState, useEffect, useMemo } from 'react'
import LayerItem from './LayerItem'
import { Search, Folder, MoreHorizontal } from 'lucide-react'
import LayerGroup from './LayerGroup'
import LayerToolbar from './LayerToolbar'
import { LayerElement, LayersState, LayerOperations, getLayerDisplayName } from '../types/layers'

interface Props {
  // État des éléments du canvas
  notes: Array<{ id: string; text: string; color: string }>
  images: Array<{ id: string; src: string; width: number; height: number; note?: string }>
  // Callbacks pour synchroniser avec le canvas
  onLayerSelect: (layerId: string, multiSelect?: boolean) => void
  onLayerVisibilityToggle: (layerId: string, visible: boolean) => void
  onLayerLockToggle: (layerId: string, locked: boolean) => void
  onLayerDelete: (layerId: string) => void
  onLayerRename: (layerId: string, newName: string) => void
  // État du panel
  isOpen: boolean
  onToggle: () => void
}

export default function LayersPanel({
  notes,
  images,
  onLayerSelect,
  onLayerVisibilityToggle,
  onLayerLockToggle,
  onLayerDelete,
  onLayerRename,
  isOpen,
  onToggle
}: Props) {
  const [layersState, setLayersState] = useState<LayersState>({
    layers: {},
    selectedLayers: [],
    expandedGroups: new Set<string>()
  })
  const [searchTerm, setSearchTerm] = useState('')

  // 🔹 Synchroniser les layers avec les éléments du canvas
  useEffect(() => {
    const newLayers: Record<string, LayerElement> = {}

    // Notes
    notes.forEach(note => {
      newLayers[note.id] = {
        id: note.id,
        name: note.text || 'Note vide',
        type: 'note',
        visible: true,
        locked: false,
        selected: layersState.selectedLayers.includes(note.id),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        data: {
          color: note.color,
          text: note.text
        }
      }
    })

    // Images
    images.forEach(image => {
      newLayers[image.id] = {
        id: image.id,
        name: image.note || 'Image',
        type: 'image',
        visible: true,
        locked: false,
        selected: layersState.selectedLayers.includes(image.id),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        data: {
          src: image.src,
          width: image.width,
          height: image.height
        }
      }
    })

    // ⚡ Remplacer complètement → supprime aussi les orphelins
    setLayersState(prev => ({
      ...prev,
      layers: newLayers,
      selectedLayers: prev.selectedLayers.filter(id => newLayers[id])
    }))
  }, [notes, images])

  // Recherche
  const filteredLayers = useMemo(() => {
    if (!searchTerm) return Object.values(layersState.layers)
    return Object.values(layersState.layers).filter(layer => {
      const displayName = getLayerDisplayName(layer).toLowerCase()
      return displayName.includes(searchTerm.toLowerCase())
    })
  }, [layersState.layers, searchTerm])

  // Groupes & éléments
  const { groupedLayers, individualLayers } = useMemo(() => {
    const groups: LayerElement[] = []
    const individuals: LayerElement[] = []

    filteredLayers.forEach(layer => {
      if (layer.type === 'group') {
        groups.push(layer)
      } else if (!layer.groupId || layersState.expandedGroups.has(layer.groupId)) {
        individuals.push(layer)
      }
    })

    return {
      groupedLayers: groups.sort((a, b) => b.updatedAt - a.updatedAt),
      individualLayers: individuals.sort((a, b) => b.updatedAt - a.updatedAt)
    }
  }, [filteredLayers, layersState.expandedGroups])

  // 🔹 Operations
  const layerOperations: LayerOperations = {
    createLayer: (element) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
      const newLayer: LayerElement = {
        ...element,
        id,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      setLayersState(prev => ({
        ...prev,
        layers: { ...prev.layers, [id]: newLayer }
      }))
    },

    updateLayer: (id, updates) => {
      setLayersState(prev => ({
        ...prev,
        layers: {
          ...prev.layers,
          [id]: {
            ...prev.layers[id],
            ...updates,
            updatedAt: Date.now()
          }
        }
      }))
    },

    deleteLayer: (id) => {
      const layer = layersState.layers[id]
      if (!layer) return

      // 🔹 Supprimer aussi côté canvas
      onLayerDelete(id)

      // 🔹 Supprimer du panel
      setLayersState(prev => {
        const newLayers = { ...prev.layers }
        delete newLayers[id]
        return {
          ...prev,
          layers: newLayers,
          selectedLayers: prev.selectedLayers.filter(layerId => layerId !== id)
        }
      })
    },

    toggleVisibility: (id) => {
      const layer = layersState.layers[id]
      if (!layer) return
      const newVisible = !layer.visible
      layerOperations.updateLayer(id, { visible: newVisible })
      onLayerVisibilityToggle(id, newVisible)
    },

    toggleLock: (id) => {
      const layer = layersState.layers[id]
      if (!layer) return
      const newLocked = !layer.locked
      layerOperations.updateLayer(id, { locked: newLocked })
      onLayerLockToggle(id, newLocked)
    },

    renameLayer: (id, newName) => {
      layerOperations.updateLayer(id, { name: newName })
      onLayerRename(id, newName)
    },

    selectLayer: (id, multiSelect = false) => {
      setLayersState(prev => {
        let newSelected: string[]

        if (multiSelect) {
          newSelected = prev.selectedLayers.includes(id)
            ? prev.selectedLayers.filter(layerId => layerId !== id)
            : [...prev.selectedLayers, id]
        } else {
          newSelected = [id]
        }

        const newLayers = { ...prev.layers }
        Object.keys(newLayers).forEach(layerId => {
          newLayers[layerId] = {
            ...newLayers[layerId],
            selected: newSelected.includes(layerId)
          }
        })

        return {
          ...prev,
          layers: newLayers,
          selectedLayers: newSelected
        }
      })

      onLayerSelect(id, multiSelect)
    },

    groupLayers: (layerIds, groupName = 'Nouveau groupe') => {
      if (layerIds.length < 2) return
      const groupId = `group-${Date.now()}`
      const newGroup: LayerElement = {
        id: groupId,
        name: groupName,
        type: 'group',
        visible: true,
        locked: false,
        selected: false,
        children: layerIds,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        data: { collapsed: false }
      }

      setLayersState(prev => {
        const newLayers = { ...prev.layers }
        newLayers[groupId] = newGroup
        layerIds.forEach(layerId => {
          if (newLayers[layerId]) {
            newLayers[layerId] = {
              ...newLayers[layerId],
              groupId,
              updatedAt: Date.now()
            }
          }
        })
        return {
          ...prev,
          layers: newLayers,
          selectedLayers: [groupId],
          expandedGroups: new Set([...prev.expandedGroups, groupId])
        }
      })
    },

    ungroupLayer: (groupId) => {
      const group = layersState.layers[groupId]
      if (!group || group.type !== 'group') return
      setLayersState(prev => {
        const newLayers = { ...prev.layers }
        group.children?.forEach(childId => {
          if (newLayers[childId]) {
            newLayers[childId] = {
              ...newLayers[childId],
              groupId: undefined,
              updatedAt: Date.now()
            }
          }
        })
        delete newLayers[groupId]
        return {
          ...prev,
          layers: newLayers,
          selectedLayers: group.children || [],
          expandedGroups: new Set([...prev.expandedGroups].filter(id => id !== groupId))
        }
      })
    },

    moveToGroup: (layerId, groupId) => {
      layerOperations.updateLayer(layerId, { groupId: groupId || undefined })
    }
  }

  const hasElements = notes.length > 0 || images.length > 0

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed z-30 p-2 transition-colors bg-white rounded-lg shadow-lg top-20 left-4 hover:bg-gray-50"
        title="Ouvrir le panel des layers"
      >
        <Folder size={20} className="text-gray-600" />
      </button>
    )
  }

  return (
    <div className="fixed top-0 left-0 z-20 flex flex-col h-full bg-white border-r border-gray-200 shadow-lg w-80 layers-panel">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Layers</h2>
        <button
          onClick={onToggle}
          className="p-1 transition-colors rounded hover:bg-gray-100"
          title="Fermer le panel"
        >
          <MoreHorizontal size={18} className="text-gray-500" />
        </button>
      </div>

      {!hasElements ? (
        <div className="flex items-center justify-center flex-1 p-6">
          <div className="text-center text-gray-500">
            <Folder size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Aucun élément sur le canvas</p>
            <p className="mt-1 text-xs">Ajoutez des post-its ou images pour les voir ici</p>
          </div>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search size={16} className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pr-3 text-sm border border-gray-200 rounded-lg pl-9 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Toolbar */}
          <LayerToolbar
            selectedLayers={layersState.selectedLayers}
            layers={layersState.layers}
            operations={layerOperations}
          />

          {/* Liste */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
              {groupedLayers.map(group => (
                <LayerGroup
                  key={group.id}
                  group={group}
                  layers={layersState.layers}
                  selectedLayers={layersState.selectedLayers}
                  isExpanded={layersState.expandedGroups.has(group.id)}
                  onToggleExpand={(groupId) => {
                    setLayersState(prev => {
                      const newExpanded = new Set(prev.expandedGroups)
                      if (newExpanded.has(groupId)) newExpanded.delete(groupId)
                      else newExpanded.add(groupId)
                      return { ...prev, expandedGroups: newExpanded }
                    })
                  }}
                  operations={layerOperations}
                />
              ))}

              {individualLayers.map(layer => (
                <LayerItem
                  key={layer.id}
                  layer={layer}
                  isSelected={layersState.selectedLayers.includes(layer.id)}
                  operations={layerOperations}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
