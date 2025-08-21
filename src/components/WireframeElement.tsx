import { useState, useRef, useEffect } from 'react'

type WireEl = {
  id: string
  type: 'select' | 'desktop' | 'mobile' | 'diamond' | 'arrow' | 'line' | 'text' | 'image' | 'button' | 'input' | 'card'
  x: number
  y: number
  w: number
  h: number
  z: number
  text?: string
  variant?: string // Pour les variants de style
}

interface WireframeElementProps {
  wireframe: WireEl
  scale: number
  onDrag: (id: string, dx: number, dy: number) => void
  onResize: (id: string, width: number, height: number) => void
  onTextUpdate: (id: string, text: string) => void
  onDelete: (id: string) => void
  onFocus: (id: string) => void
}

export default function WireframeElement({
  wireframe,
  scale,
  onDrag,
  onResize,
  onTextUpdate,
  onDelete,
  onFocus,
}: WireframeElementProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [tempText, setTempText] = useState(wireframe.text || '')
  const [isHovered, setIsHovered] = useState(false)
  
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const resizeStartRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null)

  // Gestion du drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget && !e.currentTarget.contains(e.target as Node)) return
    e.preventDefault()
    e.stopPropagation()
    
    onFocus(wireframe.id)
    setIsDragging(true)
    dragStartRef.current = { x: e.clientX, y: e.clientY }
  }

  // Gestion du resize
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsResizing(true)
    resizeStartRef.current = { 
      x: e.clientX, 
      y: e.clientY, 
      w: wireframe.w, 
      h: wireframe.h 
    }
  }

  // Events mouse globaux
  useEffect(() => {
    if (!isDragging && !isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && dragStartRef.current) {
        const dx = (e.clientX - dragStartRef.current.x) / scale
        const dy = (e.clientY - dragStartRef.current.y) / scale
        onDrag(wireframe.id, dx, dy)
        dragStartRef.current = { x: e.clientX, y: e.clientY }
      }
      
      if (isResizing && resizeStartRef.current) {
        const dx = (e.clientX - resizeStartRef.current.x) / scale
        const dy = (e.clientY - resizeStartRef.current.y) / scale
        const newWidth = Math.max(50, resizeStartRef.current.w + dx)
        const newHeight = Math.max(50, resizeStartRef.current.h + dy)
        onResize(wireframe.id, newWidth, newHeight)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
      dragStartRef.current = null
      resizeStartRef.current = null
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing, scale, onDrag, onResize, wireframe.id])

  // Gestion de l'édition
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (['text', 'desktop', 'mobile', 'button', 'input', 'card'].includes(wireframe.type)) {
      setIsEditing(true)
      setTempText(wireframe.text || '')
    }
  }

  const getButtonStyle = () => {
    if (wireframe.type !== 'button') return {}
    
    switch (wireframe.variant) {
      case 'secondary':
        return {
          backgroundColor: 'white',
          border: '2px solid #3b82f6',
          color: '#3b82f6'
        }
      case 'outline':
        return {
          backgroundColor: 'transparent',
          border: '2px solid #6b7280',
          color: '#6b7280'
        }
      case 'danger':
        return {
          backgroundColor: '#ef4444',
          border: '1px solid #dc2626',
          color: 'white'
        }
      case 'success':
        return {
          backgroundColor: '#22c55e',
          border: '1px solid #16a34a',
          color: 'white'
        }
      default: // primary
        return {
          backgroundColor: '#3b82f6',
          border: '1px solid #2563eb',
          color: 'white'
        }
    }
  }

  const handleTextSubmit = () => {
    onTextUpdate(wireframe.id, tempText)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleTextSubmit()
    }
    if (e.key === 'Escape') {
      setIsEditing(false)
      setTempText(wireframe.text || '')
    }
  }

  // Styles selon le type
  const getWireframeStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: wireframe.x,
      top: wireframe.y,
      width: wireframe.w,
      height: wireframe.h,
      zIndex: wireframe.z,
      cursor: isDragging ? 'grabbing' : 'grab',
      userSelect: 'none',
      outline: isHovered ? '2px solid #3b82f6' : 'none',
      outlineOffset: '2px',
    }

    switch (wireframe.type) {
      case 'desktop':
        return {
          ...baseStyle,
          backgroundColor: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }
      
      case 'mobile':
        return {
          ...baseStyle,
          backgroundColor: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }
      
      case 'button': {
        const buttonStyle = getButtonStyle()
        return {
          ...baseStyle,
          ...buttonStyle,
          borderRadius: '6px',
        }
      }
      
      case 'input':
        return {
          ...baseStyle,
          backgroundColor: 'white',
          border: '2px solid #d1d5db',
          borderRadius: '6px',
        }
      
      case 'card':
        return {
          ...baseStyle,
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        }
      
      case 'text':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          border: '1px dashed rgba(156, 163, 175, 0.6)',
          borderRadius: '4px',
        }
      
      case 'image':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(229, 231, 235, 0.5)',
          border: '2px dashed rgba(156, 163, 175, 0.6)',
          borderRadius: '4px',
        }
      
      case 'diamond':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          border: '1px dashed rgba(255, 255, 255, 0.6)',
          transform: 'rotate(45deg)',
        }
      
      case 'line':
      case 'arrow':
        return {
          ...baseStyle,
          backgroundColor: 'white',
          height: '2px',
          cursor: 'move',
        }
      
      default:
        return {
          ...baseStyle,
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          border: '1px dashed rgba(255, 255, 255, 0.6)',
          borderRadius: '4px',
        }
    }
  }

  // Contenu selon le type
  const renderContent = () => {
    if (isEditing) {
      return (
        <input
          type="text"
          value={tempText}
          onChange={(e) => setTempText(e.target.value)}
          onBlur={handleTextSubmit}
          onKeyDown={handleKeyDown}
          className="w-full h-full px-2 py-1 text-sm bg-transparent border-none outline-none"
          style={{ fontSize: Math.max(12, 14 / scale) }}
          autoFocus
        />
      )
    }

    switch (wireframe.type) {
      case 'desktop':
        return (
          <div className="flex flex-col w-full h-full">
            <div className="flex items-center justify-between px-3 py-2 bg-gray-100 border-b">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              </div>
              <div className="text-xs text-gray-600">1440×900</div>
            </div>
            <div className="flex-1 p-3">
              <div className="text-sm text-gray-700" style={{ fontSize: Math.max(12, 14 / scale) }}>
                {wireframe.text || 'Desktop Frame'}
              </div>
            </div>
          </div>
        )
      
      case 'mobile':
        return (
          <div className="flex flex-col w-full h-full">
            <div className="flex items-center justify-between px-3 py-2 bg-gray-100 border-b rounded-t-3xl">
              <div className="w-8 h-1 bg-gray-400 rounded-full"></div>
              <div className="text-xs text-gray-600">375×667</div>
            </div>
            <div className="flex-1 p-3">
              <div className="text-sm text-gray-700" style={{ fontSize: Math.max(12, 14 / scale) }}>
                {wireframe.text || 'Mobile Frame'}
              </div>
            </div>
          </div>
        )
      
      case 'button': {
        const buttonTextStyle  = getButtonStyle()
        return (
          <div className="flex items-center justify-center w-full h-full px-4 py-2 overflow-hidden">
            <span 
              className="text-sm font-medium text-center truncate" 
              style={{ 
                fontSize: Math.max(10, 14 / scale),
                lineHeight: '1.2',
                color: buttonTextStyle.color
              }}
            >
              {wireframe.text || 'Button'}
            </span>
          </div>
        )
      }
      
      case 'input':
        return (
          <div className="flex items-center w-full h-full px-3 py-2">
            <span className="text-sm text-gray-500" style={{ fontSize: Math.max(12, 14 / scale) }}>
              {wireframe.text || 'Placeholder text...'}
            </span>
          </div>
        )
      
      case 'card':
        return (
          <div className="flex flex-col w-full h-full p-4">
            <div className="mb-2 text-sm font-medium text-gray-900" style={{ fontSize: Math.max(12, 14 / scale) }}>
              {wireframe.text || 'Card Title'}
            </div>
            <div className="text-xs text-gray-500" style={{ fontSize: Math.max(10, 12 / scale) }}>
              Card content goes here...
            </div>
          </div>
        )
      
      case 'text':
        return (
          <div className="flex items-center justify-center w-full h-full px-2 py-1">
            <span className="text-sm text-gray-700" style={{ fontSize: Math.max(12, 14 / scale) }}>
              {wireframe.text || 'Text'}
            </span>
          </div>
        )
      
      case 'image':
        return (
          <div className="flex items-center justify-center w-full h-full text-gray-500">
            <div className="text-center">
              <div className="text-lg">🖼️</div>
              <div className="text-xs" style={{ fontSize: Math.max(10, 12 / scale) }}>
                Image Placeholder
              </div>
            </div>
          </div>
        )
      
      case 'arrow':
        return (
          <div className="absolute top-0 right-0 w-0 h-0 border-t-2 border-b-2 border-l-4 border-l-white border-t-transparent border-b-transparent"></div>
        )
      
      default:
        return null
    }
  }

  return (
    <div 
      className="wireframe-element"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={getWireframeStyle()}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        {renderContent()}
        
        {/* Bouton de suppression */}
        {isHovered && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(wireframe.id)
            }}
            className="absolute flex items-center justify-center text-white transition-colors bg-red-500 rounded-full hover:bg-red-600"
            style={{ 
              top: `-${8 / scale}px`,
              right: `-${8 / scale}px`,
              width: `${20 / scale}px`,
              height: `${20 / scale}px`,
              fontSize: `${12 / scale}px`,
              minWidth: '16px',
              minHeight: '16px',
              maxWidth: '24px',
              maxHeight: '24px',
            }}
          >
            ×
          </button>
        )}
        
        {/* Poignée de redimensionnement */}
        {isHovered && wireframe.type !== 'line' && wireframe.type !== 'arrow' && (
          <div
            onMouseDown={handleResizeMouseDown}
            className="absolute transition-colors bg-blue-500 rounded cursor-se-resize hover:bg-blue-600"
            style={{ 
              bottom: `-${4 / scale}px`,
              right: `-${4 / scale}px`,
              width: `${12 / scale}px`,
              height: `${12 / scale}px`,
              minWidth: '8px',
              minHeight: '8px',
              maxWidth: '16px',
              maxHeight: '16px',
            }}
          />
        )}
      </div>
    </div>
  )
}