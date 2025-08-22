import { useState, useRef, useEffect, CSSProperties } from 'react'
import * as LucideIcons from 'lucide-react'

// -------------------- Types --------------------
type WireType =
  | 'select' | 'desktop' | 'mobile' | 'diamond' | 'arrow' | 'line'
  | 'text' | 'image' | 'button' | 'input' | 'card' | 'nav' | 'icon'

type TextStyle = Partial<
  Pick<
    CSSProperties,
    | 'fontWeight'
    | 'fontStyle'
    | 'fontSize'
    | 'color'
    | 'textAlign'
    | 'textDecoration'
    | 'letterSpacing'
    | 'lineHeight'
  >
>

export type WireEl = {
  id: string
  type: WireType
  x: number
  y: number
  w: number
  h: number
  z: number
  text?: string
  variant?: string
  iconName?: string
  textStyles?: TextStyle
}

interface WireframeElementProps {
  wireframe: WireEl
  scale: number
  onDrag: (id: string, dx: number, dy: number) => void
  onResize: (id: string, width: number, height: number) => void
  onTextUpdate: (id: string, text: string) => void
  onDelete: (id: string) => void
  onFocus: (id: string) => void
  onStartTextEdit?: (id: string, type: WireType, styles: TextStyle) => void
}

// -------------------- Z-index rules --------------------
const Z_FRAME = 1                 // desktop/mobile restent derrière
const Z_ELEMENT_BASE = 1_000_000  // le reste au-dessus

export default function WireframeElement({
  wireframe,
  scale,
  onDrag,
  onResize,
  onTextUpdate,
  onDelete,
  onFocus,
  onStartTextEdit,
}: WireframeElementProps): JSX.Element {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [tempText, setTempText] = useState(wireframe.text || '')
  const [isHovered, setIsHovered] = useState(false)

  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const resizeStartRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null)

  const IS_FRAME = wireframe.type === 'desktop' || wireframe.type === 'mobile'

  // helper pour récupérer une taille par défaut cohérente
  const fs = (fallback: number) => (wireframe.textStyles?.fontSize ?? fallback)

  // -------------------- Drag --------------------
  const handleMouseDown = (e: React.MouseEvent) => {
    const t = e.target as HTMLElement

    // pas de drag quand on édite
    if (isEditing) return

    // ignorer les zones interactives (input, boutons, handles…)
    if (
      t.closest('input, textarea, button, [contenteditable], .resize-handle, .delete-handle, [data-no-drag]')
    ) {
      return
    }

    e.preventDefault()
    e.stopPropagation()

    if (!IS_FRAME) onFocus(wireframe.id)

    setIsDragging(true)
    dragStartRef.current = { x: e.clientX, y: e.clientY }
  }

  // -------------------- Resize --------------------
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      w: wireframe.w,
      h: wireframe.h,
    }
  }

  // -------------------- Global mouse events --------------------
  useEffect(() => {
    if (isEditing) return
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
  }, [isDragging, isResizing, scale, onDrag, onResize, wireframe.id, isEditing])

  // -------------------- Double-click: start text edit --------------------
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (['text', 'desktop', 'mobile', 'button', 'input', 'card', 'nav', 'icon'].includes(wireframe.type)) {
      onStartTextEdit?.(wireframe.id, wireframe.type, wireframe.textStyles || {})
      setIsEditing(true)
      setTempText(wireframe.text || '')
    }
  }

  // -------------------- Button styles --------------------
  const getButtonStyle = (): CSSProperties => {
    if (wireframe.type !== 'button') return {}
    switch (wireframe.variant) {
      case 'secondary':
        return { backgroundColor: 'white', border: '2px solid #3b82f6', color: '#3b82f6' }
      case 'outline':
        return { backgroundColor: 'transparent', border: '2px solid #6b7280', color: '#6b7280' }
      case 'danger':
        return { backgroundColor: '#ef4444', border: '1px solid #dc2626', color: 'white' }
      case 'success':
        return { backgroundColor: '#22c55e', border: '1px solid #16a34a', color: 'white' }
      default: // primary
        return { backgroundColor: '#3b82f6', border: '1px solid #2563eb', color: 'white' }
    }
  }

  // -------------------- Text commit / cancel --------------------
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

  // -------------------- Element style --------------------
  const getWireframeStyle = (): CSSProperties => {
    const zIndex = IS_FRAME ? Z_FRAME : Z_ELEMENT_BASE + (wireframe.z ?? 0)

    const baseStyle: CSSProperties = {
      position: 'absolute',
      left: wireframe.x,
      top: wireframe.y,
      width: wireframe.w,
      height: wireframe.h,
      zIndex,
      cursor: isEditing ? 'text' : (isDragging ? 'grabbing' : 'grab'),
      userSelect: isEditing ? 'text' : 'none',
      outline: isHovered ? '2px solid #66ED54' : 'none',
      outlineOffset: '2px',
      ...(wireframe.textStyles || {}),
    }

    switch (wireframe.type) {
      case 'desktop':
        return { ...baseStyle, backgroundColor: 'white', border: '2px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }
      case 'mobile':
        return { ...baseStyle, backgroundColor: 'white', border: '2px solid #e5e7eb', borderRadius: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }
      case 'button':
        return { ...baseStyle, ...getButtonStyle(), borderRadius: '6px' }
      case 'input':
        return { ...baseStyle, backgroundColor: 'white', border: '2px solid #d1d5db', borderRadius: '6px' }
      case 'card':
        return { ...baseStyle, backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
      case 'text':
        return { ...baseStyle, backgroundColor: 'rgba(255,255,255,0.9)', border: '1px dashed rgba(156,163,175,0.6)', borderRadius: '4px' }
      case 'image':
        return { ...baseStyle, backgroundColor: 'rgba(229,231,235,0.5)', border: '2px dashed rgba(156,163,175,0.6)', borderRadius: '4px' }
      case 'nav':
        return { ...baseStyle, backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: wireframe.variant === 'tabs' ? '8px 8px 0 0' : '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
      case 'icon':
        return { ...baseStyle, backgroundColor: 'rgba(255,255,255,0.9)', border: '1px dashed rgba(156,163,175,0.4)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
      case 'diamond':
        return { ...baseStyle, backgroundColor: 'rgba(255,255,255,0.2)', border: '1px dashed rgba(255,255,255,0.6)', transform: 'rotate(45deg)' }
      case 'line':
      case 'arrow':
        return { ...baseStyle, backgroundColor: 'white', height: '2px', cursor: 'move' }
      default:
        return { ...baseStyle, backgroundColor: 'rgba(255,255,255,0.2)', border: '1px dashed rgba(255,255,255,0.6)', borderRadius: '4px' }
    }
  }

  // -------------------- Content --------------------
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
          style={{ fontSize: fs(14) }}
          autoFocus
        />
      )
    }

    switch (wireframe.type) {
      // Frames
      case 'desktop': {
        const labelDesktop =
          (wireframe.text ?? '').replace(/\bframe\b/gi, '').trim() || 'Desktop'
        return (
          <div className="flex flex-col w-full h-full">
            <div className="relative h-8 bg-gray-100 border-b rounded-t-lg">
              <div className="absolute -translate-x-1/2 left-1/2 -top-2">
                <div className="px-2 py-[2px] rounded-full bg-gray-800 text-white text-[15px] leading-none select-none pointer-events-none">
                  {labelDesktop}
                </div>
              </div>
            </div>
            <div className="flex-1 p-3" />
          </div>
        )
      }

      case 'mobile':
        return (
          <div className="flex flex-col w-full h-full">
            <div className="relative h-8 bg-gray-100 border-b rounded-t-3xl">
              <div className="absolute -translate-x-1/2 left-1/2 -top-2">
                <div className="px-2 py-[2px] rounded-full bg-gray-800 text-white text-[15px] leading-none select-none pointer-events-none">
                  Mobile
                </div>
              </div>
            </div>
            <div className="flex-1 p-3" />
          </div>
        )

      // Icon
      case 'icon': {
        const iconName = wireframe.iconName || 'Star'
        const IconComponent =
          LucideIcons[iconName as keyof typeof LucideIcons] as
            | React.ComponentType<React.SVGProps<SVGSVGElement>>
            | undefined

        if (!IconComponent) {
          return (
            <div className="flex items-center justify-center w-full h-full">
              <span className="text-sm text-gray-500" style={{ fontSize: 12 }}>
                Icon
              </span>
            </div>
          )
        }

        const size = Math.min(wireframe.w * 0.7, wireframe.h * 0.7, 32)
        return (
          <div className="flex items-center justify-center w-full h-full">
            <IconComponent width={size} height={size} className="text-gray-700" />
          </div>
        )
      }

      // Nav
      case 'nav': {
        const variant = wireframe.variant || 'horizontal'
        switch (variant) {
          case 'horizontal':
            return (
              <div className="flex items-center w-full h-full px-4 space-x-6">
                <div className="text-sm font-medium text-gray-900" style={{ fontSize: fs(14) }}>
                  Logo
                </div>
                <div className="flex space-x-4">
                  {['Home', 'About', 'Services', 'Contact'].map((item) => (
                    <div key={item} className="text-sm text-gray-600 hover:text-gray-900" style={{ fontSize: 12 }}>
                      {item}
                    </div>
                  ))}
                </div>
                <div className="ml-auto">
                  <div className="px-3 py-1 text-xs text-white bg-blue-500 rounded" style={{ fontSize: 10 }}>
                    CTA
                  </div>
                </div>
              </div>
            )
          case 'vertical':
            return (
              <div className="flex flex-col w-full h-full p-4 space-y-3">
                <div className="pb-2 text-sm font-medium text-gray-900 border-b" style={{ fontSize: fs(14) }}>
                  Menu
                </div>
                {['Dashboard', 'Profile', 'Settings', 'Help', 'Logout'].map((item) => (
                  <div key={item} className="pl-2 text-sm text-gray-600 hover:text-gray-900" style={{ fontSize: 12 }}>
                    {item}
                  </div>
                ))}
              </div>
            )
          case 'tabs':
            return (
              <div className="flex items-center justify-between w-full h-full px-6">
                <div className="flex items-center space-x-8">
                  <div className="text-sm font-bold text-gray-900" style={{ fontSize: fs(14) }}>
                    Brand
                  </div>
                  <div className="hidden space-x-6 md:flex">
                    {['Products', 'Solutions', 'Resources', 'Pricing'].map((item) => (
                      <div key={item} className="text-sm text-gray-600 hover:text-gray-900" style={{ fontSize: 12 }}>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="hidden px-3 py-1 text-xs text-gray-500 bg-gray-100 rounded-full sm:block" style={{ fontSize: 10 }}>
                    🔍 Search
                  </div>
                  <div className="text-xs text-gray-600" style={{ fontSize: 10 }}>
                    Login
                  </div>
                  <div className="px-3 py-1 text-xs text-white bg-blue-500 rounded" style={{ fontSize: 10 }}>
                    Sign Up
                  </div>
                </div>
              </div>
            )
          case 'breadcrumb':
            return (
              <div className="flex items-center w-full h-full px-4 space-x-2">
                {['Home', 'Category', 'Subcategory', 'Page'].map((crumb, i, arr) => (
                  <div key={crumb} className="flex items-center space-x-2">
                    <div
                      className={`text-sm ${i === arr.length - 1 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}
                      style={{ fontSize: 12 }}
                    >
                      {crumb}
                    </div>
                    {i < arr.length - 1 && (
                      <div className="text-gray-400" style={{ fontSize: 10 }}>/</div>
                    )}
                  </div>
                ))}
              </div>
            )
          default:
            return (
              <div className="flex items-center justify-center w-full h-full">
                <span className="text-sm text-gray-600" style={{ fontSize: fs(14) }}>
                  {wireframe.text || 'Navigation'}
                </span>
              </div>
            )
        }
      }

      // Button
      case 'button': {
        const btnStyle = getButtonStyle()
        return (
          <div className="flex items-center justify-center w-full h-full px-4 py-2 overflow-hidden">
            <span
              className="text-sm font-medium text-center truncate"
              style={{
                fontSize: fs(14),
                lineHeight: '1.2',
                color: btnStyle.color,
                ...(wireframe.textStyles || {}),
              }}
            >
              {wireframe.text || 'Button'}
            </span>
          </div>
        )
      }

      // Input
      case 'input':
        return (
          <div className="flex items-center w-full h-full px-3 py-2">
            <span
              className="text-sm text-gray-500"
              style={{ fontSize: fs(14), ...(wireframe.textStyles || {}) }}
            >
              {wireframe.text || 'Placeholder text...'}
            </span>
          </div>
        )

      // Card
      case 'card':
        return (
          <div className="flex flex-col w-full h-full p-4">
            <div
              className="mb-2 text-sm font-medium text-gray-900"
              style={{ fontSize: fs(14), ...(wireframe.textStyles || {}) }}
            >
              {wireframe.text || 'Card Title'}
            </div>
            <div className="text-xs text-gray-500" style={{ fontSize: 12 }}>
              Card content here...
            </div>
          </div>
        )

      // Text
      case 'text':
        return (
          <div className="flex items-center justify-center w-full h-full px-2 py-1">
            <span
              className="text-sm text-gray-700"
              style={{ fontSize: fs(14), ...(wireframe.textStyles || {}) }}
            >
              {wireframe.text || 'Text'}
            </span>
          </div>
        )

      // Image placeholder
      case 'image':
        return (
          <div className="flex items-center justify-center w-full h-full text-gray-500">
            <div className="text-center">
              <div className="text-lg">🖼️</div>
              <div className="text-xs" style={{ fontSize: 12 }}>
                Image Placeholder
              </div>
            </div>
          </div>
        )

      // Arrow / line
      case 'arrow':
        return <div className="absolute top-0 right-0 w-0 h-0 border-t-2 border-b-2 border-l-4 border-l-white border-t-transparent border-b-transparent" />

      default:
        return null
    }
  }

  // -------------------- Render --------------------
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

        {/* Delete */}
        {isHovered && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(wireframe.id)
            }}
            className="absolute flex items-center justify-center text-white transition-colors bg-red-500 rounded-full hover:bg-red-600 delete-handle"
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
            aria-label="Delete"
          >
            ×
          </button>
        )}

        {/* Resize handle */}
        {isHovered && wireframe.type !== 'line' && wireframe.type !== 'arrow' && (
          <div
            onMouseDown={handleResizeMouseDown}
            className="absolute transition-colors rounded cursor-se-resize bg-tracklab hover:bg-tracklab/80 resize-handle"
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
            aria-label="Resize"
          />
        )}
      </div>
    </div>
  )
}
