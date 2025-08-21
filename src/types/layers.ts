// Types pour le système de layers (panel latéral)

export type LayerType = 'note' | 'image' | 'group' | 'drawing' | 'wireframe'

export interface LayerElement {
  id: string
  name: string
  type: LayerType
  visible: boolean
  locked: boolean
  selected: boolean
  groupId?: string // ID du groupe parent (si dans un groupe)
  children?: string[] // IDs des enfants (pour les groupes)
  createdAt: number
  updatedAt: number
  // Données spécifiques selon le type
  data?: {
    // Pour les notes
    color?: string
    text?: string
    // Pour les images
    src?: string
    width?: number
    height?: number
    // Pour les groupes
    collapsed?: boolean
    // Pour les wireframes
    wireframeType?: string
    variant?: string
  }
}

export interface LayerGroup extends LayerElement {
  type: 'group'
  children: string[]
  data: {
    collapsed: boolean
  }
}

export interface LayerAction {
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'GROUP' | 'UNGROUP' | 'TOGGLE_VISIBILITY' | 'TOGGLE_LOCK' | 'RENAME' | 'SELECT' | 'MOVE_TO_GROUP'
  payload: {
    layerId?: string
    layerIds?: string[]
    groupId?: string
    updates?: Partial<LayerElement>
    newName?: string
    position?: number
  }
}

export interface LayersState {
  layers: Record<string, LayerElement>
  selectedLayers: string[]
  draggedLayer?: string
  expandedGroups: Set<string>
}

// Helpers pour les actions communes
export interface LayerOperations {
  createLayer: (element: Omit<LayerElement, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateLayer: (id: string, updates: Partial<LayerElement>) => void
  deleteLayer: (id: string) => void
  toggleVisibility: (id: string) => void
  toggleLock: (id: string) => void
  renameLayer: (id: string, newName: string) => void
  selectLayer: (id: string, multiSelect?: boolean) => void
  groupLayers: (layerIds: string[], groupName?: string) => void
  ungroupLayer: (groupId: string) => void
  moveToGroup: (layerId: string, groupId: string | null) => void
}

// Utilitaires
export const getLayerDisplayName = (layer: LayerElement): string => {
  if (layer.name.trim()) return layer.name
  
  switch (layer.type) {
    case 'note':
      return layer.data?.text ? `Note: ${layer.data.text.slice(0, 20)}...` : 'Note vide'
    case 'image':
      return 'Image'
    case 'group':
      return `Groupe (${layer.children?.length || 0} éléments)`
    case 'drawing':
      return 'Dessin'
    case 'wireframe':
      return layer.data?.wireframeType || 'Wireframe'
    default:
      return 'Élément'
  }
}

export const getLayerIcon = (type: LayerType): string => {
  switch (type) {
    case 'note':
      return '📝'
    case 'image':
      return '🖼️'
    case 'group':
      return '📁'
    case 'drawing':
      return '✏️'
    case 'wireframe':
      return '🔧'
    default:
      return '📄'
  }
}