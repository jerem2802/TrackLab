// components/WireframeElement.tsx
import { useEffect, useRef, useState, CSSProperties } from 'react'
import * as LucideIcons from 'lucide-react'

/** Types exportés (LabLayout importe { type WireEl }) */
export type WireType =
  | 'select' | 'desktop' | 'mobile' | 'diamond' | 'arrow' | 'line'
  | 'text' | 'image' | 'button' | 'input' | 'nav' | 'icon' | 'card'

export type TextStyle = Partial<
  Pick<
    CSSProperties,
    'fontWeight' | 'fontStyle' | 'fontSize' | 'color' | 'textAlign' |
    'textDecoration' | 'letterSpacing' | 'lineHeight' | 'fontFamily'
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
  text?: string          // utilisé pour persister l'édition (simple et cards)
  variant?: string       // pour 'card' => 'basic' | 'iconCard' | 'gradientCard', pour 'nav' => 'horizontal' | 'vertical' | 'tabs' | 'breadcrumb'
  iconName?: string
  textStyles?: TextStyle
}

type Props = {
  wireframe: WireEl
  scale: number
  onDrag: (id: string, dx: number, dy: number) => void
  onResize: (id: string, width: number, height: number) => void
  onTextUpdate: (id: string, text: string) => void
  onDelete: (id: string) => void
  onFocus: (id: string) => void
  onStartTextEdit?: (id: string, type: WireType, styles: TextStyle) => void
}

/* ---------- Constantes ---------- */
const Z_FRAME = 1
const Z_ELEMENT_BASE = 1_000_000

/* ---------- Serialisation simple pour les cards ---------- */
type CardState = {
  title: string
  subtitle: string
  body: string
  cta: string
  icon: string
  gradient: string
}
const CARD_PREFIX = 'CARD::'

const defaultCardByVariant = (variant?: string): CardState => {
  switch (variant) {
    case 'iconCard':
      return {
        title: 'Titre avec Icône',
        subtitle: 'Sous-titre',
        body: 'Mets une icône au-dessus du texte.',
        cta: '',
        icon: '⭐',
        gradient: '',
      }
    case 'gradientCard':
      return {
        title: 'Titre percutant',
        subtitle: 'Accroche visuelle',
        body: 'Fond en dégradé + CTA centré.',
        cta: 'Découvrir',
        icon: '',
        gradient: 'linear-gradient(135deg,#7f5af0,#2cb67d)',
      }
    default:
      return {
        title: 'Titre de la carte',
        subtitle: 'Sous-titre',
        body: 'Double-clique pour éditer. Clique à l’extérieur pour quitter l’édition.',
        cta: 'En savoir plus',
        icon: '',
        gradient: '',
      }
  }
}

function parseCard(text?: string, variant?: string): CardState {
  if (text && text.startsWith(CARD_PREFIX)) {
    try {
      const j = JSON.parse(text.slice(CARD_PREFIX.length) || '{}')
      return {
        ...defaultCardByVariant(variant),
        ...j,
        // garde les champs éventuels manquants
        title: j.title ?? defaultCardByVariant(variant).title,
        subtitle: j.subtitle ?? defaultCardByVariant(variant).subtitle,
        body: j.body ?? defaultCardByVariant(variant).body,
        cta: j.cta ?? defaultCardByVariant(variant).cta,
        icon: j.icon ?? defaultCardByVariant(variant).icon,
        gradient: j.gradient ?? defaultCardByVariant(variant).gradient,
      }
    } catch {
      // si JSON invalide : on traite le texte brut comme titre
      return { ...defaultCardByVariant(variant), title: text }
    }
  }
  // pas sérialisé → on prend le texte comme titre si fourni
  if (text && text.trim()) {
    return { ...defaultCardByVariant(variant), title: text.trim() }
  }
  return defaultCardByVariant(variant)
}

function stringifyCard(c: CardState): string {
  return CARD_PREFIX + JSON.stringify(c)
}

/* ========================================================= */

export default function WireframeElement({
  wireframe,
  scale,
  onDrag,
  onResize,
  onTextUpdate,
  onDelete,
  onFocus,
  onStartTextEdit,
}: Props) {
  const w = wireframe
  const IS_FRAME = w.type === 'desktop' || w.type === 'mobile'

  /* ----- drag / resize ----- */
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const resizeStartRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    const t = e.target as HTMLElement
    if (t.closest('input,textarea,button,[contenteditable],.resize-handle,.delete-handle,[data-no-drag]')) return
    e.preventDefault()
    e.stopPropagation()
    if (!IS_FRAME) onFocus(w.id)
    setIsDragging(true)
    dragStartRef.current = { x: e.clientX, y: e.clientY }
  }

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    resizeStartRef.current = { x: e.clientX, y: e.clientY, w: w.w, h: w.h }
  }

  useEffect(() => {
    if (!isDragging && !isResizing) return
    const mm = (e: MouseEvent) => {
      if (isDragging && dragStartRef.current) {
        const dx = (e.clientX - dragStartRef.current.x) / scale
        const dy = (e.clientY - dragStartRef.current.y) / scale
        onDrag(w.id, dx, dy)
        dragStartRef.current = { x: e.clientX, y: e.clientY }
      }
      if (isResizing && resizeStartRef.current) {
        const dx = (e.clientX - resizeStartRef.current.x) / scale
        const dy = (e.clientY - resizeStartRef.current.y) / scale
        const newW = Math.max(50, resizeStartRef.current.w + dx)
        const newH = Math.max(50, resizeStartRef.current.h + dy)
        onResize(w.id, newW, newH)
      }
    }
    const mu = () => {
      setIsDragging(false)
      setIsResizing(false)
      dragStartRef.current = null
      resizeStartRef.current = null
    }
    document.addEventListener('mousemove', mm)
    document.addEventListener('mouseup', mu)
    return () => {
      document.removeEventListener('mousemove', mm)
      document.removeEventListener('mouseup', mu)
    }
  }, [isDragging, isResizing, scale, onDrag, onResize, w.id])

  /* ----- édition générique (text/input/button/nav/icon...) ----- */
  const [isEditing, setIsEditing] = useState(false)
  const [tempText, setTempText] = useState(w.text || '')

  const commitGeneric = () => {
    onTextUpdate(w.id, tempText)
    setIsEditing(false)
  }
  const cancelGeneric = () => {
    setTempText(w.text || '')
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') cancelGeneric()
    if (e.key === 'Enter' && !e.shiftKey && w.type !== 'card') {
      e.preventDefault()
      commitGeneric()
    }
  }

  /* ----- édition des cards ----- */
  const [cardEdit, setCardEdit] = useState<CardState | null>(null)
  const openCardEditor = () => {
    setCardEdit(parseCard(w.text, w.variant))
    setIsEditing(true)
  }
  const commitCard = () => {
    if (!cardEdit) return
    onTextUpdate(w.id, stringifyCard(cardEdit))
    setIsEditing(false)
    setCardEdit(null)
  }
  const cancelCard = () => {
    setIsEditing(false)
    setCardEdit(null)
  }

  /* ----- double-clic ----- */
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (w.type === 'card') {
      openCardEditor()
      onStartTextEdit?.(w.id, w.type, w.textStyles || {})
      return
    }
    if (['text','desktop','mobile','button','input','nav','icon'].includes(w.type)) {
      onStartTextEdit?.(w.id, w.type, w.textStyles || {})
      setTempText(w.text || '')
      setIsEditing(true)
    }
  }

  /* commit au clic extérieur (édition en cours) */
  useEffect(() => {
    if (!isEditing) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      const inside = t.closest(`[data-wire-id="${w.id}"]`)
      const insideToolbar = t.closest('.text-toolbar') || t.closest('[data-text-toolbar]')
      if (!inside && !insideToolbar) {
        if (w.type === 'card') commitCard()
        else commitGeneric()
      }
    }
    document.addEventListener('mousedown', onDown, true)
    return () => document.removeEventListener('mousedown', onDown, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, cardEdit, tempText, w.id, w.type])

  /* ----- styles ----- */
  const zIndex = ['desktop','mobile'].includes(w.type) ? Z_FRAME : Z_ELEMENT_BASE + (w.z ?? 0)
  const baseStyle: CSSProperties = {
    position: 'absolute',
    left: w.x, top: w.y,
    width: w.w, height: w.h,
    zIndex,
    userSelect: isEditing ? 'text' : 'none',
    cursor: isEditing ? 'text' : (isDragging ? 'grabbing' : 'grab'),
    outline: isHovered ? '2px solid #66ED54' : 'none',
    outlineOffset: '2px',
    ...(w.textStyles || {}),
  }

  const styleByType = (): CSSProperties => {
    switch (w.type) {
      case 'desktop':
        return { backgroundColor: 'white', border: '2px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }
      case 'mobile':
        return { backgroundColor: 'white', border: '2px solid #e5e7eb', borderRadius: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }
      case 'button': {
        switch (w.variant) {
          case 'secondary': return { backgroundColor: 'white', border: '2px solid #3b82f6', borderRadius: 6, color: '#3b82f6' }
          case 'outline': return { backgroundColor: 'transparent', border: '2px solid #6b7280', borderRadius: 6, color: '#6b7280' }
          case 'danger': return { backgroundColor: '#ef4444', border: '1px solid #dc2626', borderRadius: 6, color: 'white' }
          case 'success': return { backgroundColor: '#22c55e', border: '1px solid #16a34a', borderRadius: 6, color: 'white' }
          default: return { backgroundColor: '#3b82f6', border: '1px solid #2563eb', borderRadius: 6, color: 'white' }
        }
      }
      case 'input':
        return { backgroundColor: 'white', border: '2px solid #d1d5db', borderRadius: 6 }
      case 'card':
        return { backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.12)', overflow: 'hidden' }
      case 'text':
        return { backgroundColor: 'rgba(255,255,255,0.9)', border: '1px dashed rgba(156,163,175,0.6)', borderRadius: 4 }
      case 'image':
        return { backgroundColor: 'rgba(229,231,235,0.5)', border: '2px dashed rgba(156,163,175,0.6)', borderRadius: 4 }
      case 'nav':
        return { backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: w.variant === 'tabs' ? 8 : 6, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
      case 'icon':
        return { backgroundColor: 'rgba(255,255,255,0.9)', border: '1px dashed rgba(156,163,175,0.4)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }
      case 'diamond':
        return { backgroundColor: 'rgba(255,255,255,0.2)', border: '1px dashed rgba(255,255,255,0.6)', transform: 'rotate(45deg)' }
      case 'line':
      case 'arrow':
        return { backgroundColor: 'white', height: 2, cursor: 'move' }
      default:
        return { backgroundColor: 'rgba(255,255,255,0.2)', border: '1px dashed rgba(255,255,255,0.6)', borderRadius: 4 }
    }
  }

  /* ----- rendus ----- */
  const renderCard = () => {
    const c = parseCard(w.text, w.variant)

    if (w.variant === 'gradientCard') {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full p-4 text-center text-white"
             style={{ background: c.gradient }}>
          <div className="text-lg font-bold" style={{ fontSize: Math.max(12, 14/scale) }}>{c.title}</div>
          <div className="text-sm opacity-90" style={{ fontSize: Math.max(10, 12/scale) }}>{c.subtitle}</div>
          <div className="mt-2 text-sm" style={{ fontSize: Math.max(10, 12/scale) }}>{c.body}</div>
          {c.cta && (
            <div className="px-3 py-1 mt-3 text-xs rounded bg-white/20 hover:bg-white/30" style={{ fontSize: Math.max(8, 10/scale) }}>
              {c.cta}
            </div>
          )}
        </div>
      )
    }

    if (w.variant === 'iconCard') {
      const iconTxt = c.icon || '⭐'
      return (
        <div className="flex flex-col items-center justify-center w-full h-full p-4 text-center">
          <div className="mb-2 text-4xl select-none" style={{ fontSize: Math.max(20, 32/scale) }}>{iconTxt}</div>
          <div className="font-semibold" style={{ fontSize: Math.max(12, 14/scale) }}>{c.title}</div>
          <div className="text-sm text-gray-500" style={{ fontSize: Math.max(10, 12/scale) }}>{c.subtitle}</div>
          <div className="mt-2 text-sm" style={{ fontSize: Math.max(10, 12/scale) }}>{c.body}</div>
        </div>
      )
    }

    // basic
    return (
      <div className="flex flex-col w-full h-full p-4">
        <div className="font-semibold text-gray-900" style={{ fontSize: Math.max(12, 14/scale) }}>{c.title}</div>
        <div className="text-sm text-gray-500" style={{ fontSize: Math.max(10, 12/scale) }}>{c.subtitle}</div>
        <div className="mt-2 text-sm text-gray-700" style={{ fontSize: Math.max(10, 12/scale) }}>{c.body}</div>
        {c.cta && (
          <div className="self-start px-3 py-1 mt-3 text-xs text-white rounded bg-violet-600" style={{ fontSize: Math.max(8, 10/scale) }}>
            {c.cta}
          </div>
        )}
      </div>
    )
  }

  const renderCardEditor = () => {
    if (!cardEdit) return null
    return (
      <div className="absolute inset-0 p-3 bg-white/95 backdrop-blur-sm" data-no-drag onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex flex-col h-full gap-2">
          <input
            className="w-full px-2 py-1 text-sm border rounded outline-none"
            placeholder="Titre"
            autoFocus
            value={cardEdit.title}
            onChange={e => setCardEdit({ ...cardEdit, title: e.target.value })}
          />
          <input
            className="w-full px-2 py-1 text-sm border rounded outline-none"
            placeholder="Sous-titre"
            value={cardEdit.subtitle}
            onChange={e => setCardEdit({ ...cardEdit, subtitle: e.target.value })}
          />
          <textarea
            className="w-full flex-1 min-h-[60px] px-2 py-1 text-sm border rounded outline-none resize-none"
            placeholder="Contenu…"
            value={cardEdit.body}
            onChange={e => setCardEdit({ ...cardEdit, body: e.target.value })}
          />
          <div className="grid items-center grid-cols-2 gap-2">
            <input
              className="px-2 py-1 text-sm border rounded outline-none"
              placeholder="CTA (optionnel)"
              value={cardEdit.cta}
              onChange={e => setCardEdit({ ...cardEdit, cta: e.target.value })}
            />
            {w.variant === 'iconCard' && (
              <input
                className="px-2 py-1 text-sm border rounded outline-none"
                placeholder="Icône (ex: ⭐)"
                value={cardEdit.icon}
                onChange={e => setCardEdit({ ...cardEdit, icon: e.target.value })}
              />
            )}
            {w.variant === 'gradientCard' && (
              <input
                className="col-span-2 px-2 py-1 text-sm border rounded outline-none"
                placeholder="CSS gradient"
                value={cardEdit.gradient}
                onChange={e => setCardEdit({ ...cardEdit, gradient: e.target.value })}
              />
            )}
          </div>
          {/* pas de boutons : clic extérieur → commit ; Esc géré via keydown global du parent */}
        </div>
      </div>
    )
  }

  const renderNav = () => {
    const variant = w.variant || 'horizontal'
    if (variant === 'vertical') {
      return (
        <div className="flex flex-col w-full h-full p-4 space-y-3">
          <div className="pb-2 text-sm font-medium text-gray-900 border-b" style={{ fontSize: Math.max(12, 14/scale) }}>Menu</div>
          {['Dashboard','Profile','Settings','Help','Logout'].map(it => (
            <div key={it} className="pl-2 text-sm text-gray-600" style={{ fontSize: Math.max(10, 12/scale) }}>{it}</div>
          ))}
        </div>
      )
    }
    if (variant === 'tabs') {
      return (
        <div className="flex items-center justify-between w-full h-full px-6">
          <div className="flex items-center space-x-8">
            <div className="text-sm font-bold text-gray-900" style={{ fontSize: Math.max(12, 14/scale) }}>Brand</div>
            <div className="hidden space-x-6 md:flex">
              {['Products','Solutions','Resources','Pricing'].map(it => (
                <div key={it} className="text-sm text-gray-600" style={{ fontSize: Math.max(10, 12/scale) }}>{it}</div>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden px-3 py-1 text-xs text-gray-500 bg-gray-100 rounded-full sm:block" style={{ fontSize: Math.max(8, 10/scale) }}>🔍 Search</div>
            <div className="text-xs text-gray-600" style={{ fontSize: Math.max(8, 10/scale) }}>Login</div>
            <div className="px-3 py-1 text-xs text-white bg-blue-500 rounded" style={{ fontSize: Math.max(8, 10/scale) }}>Sign Up</div>
          </div>
        </div>
      )
    }
    if (variant === 'breadcrumb') {
      return (
        <div className="flex items-center w-full h-full px-4 space-x-2">
          {['Home','Category','Subcategory','Page'].map((crumb, i, arr) => (
            <div key={crumb} className="flex items-center space-x-2">
              <div className={`text-sm ${i===arr.length-1 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}
                   style={{ fontSize: Math.max(10, 12/scale) }}>{crumb}</div>
              {i < arr.length-1 && <div className="text-gray-400" style={{ fontSize: Math.max(8, 10/scale) }}>/</div>}
            </div>
          ))}
        </div>
      )
    }
    // horizontal
    return (
      <div className="flex items-center w-full h-full px-4 space-x-6">
        <div className="text-sm font-medium text-gray-900" style={{ fontSize: Math.max(12, 14/scale) }}>Logo</div>
        <div className="flex space-x-4">
          {['Home','About','Services','Contact'].map(it => (
            <div key={it} className="text-sm text-gray-600" style={{ fontSize: Math.max(10, 12/scale) }}>{it}</div>
          ))}
        </div>
        <div className="px-3 py-1 ml-auto text-xs text-white bg-blue-500 rounded" style={{ fontSize: Math.max(8, 10/scale) }}>CTA</div>
      </div>
    )
  }

  const renderIcon = () => {
    const iconName = w.iconName || 'Star'
    const Icon =
      LucideIcons[iconName as keyof typeof LucideIcons] as
        | React.ComponentType<React.SVGProps<SVGSVGElement>>
        | undefined
    const size = Math.min(w.w * 0.7, w.h * 0.7, 36)
    if (!Icon) {
      return <div className="flex items-center justify-center w-full h-full text-sm text-gray-500">Icon</div>
    }
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Icon width={size} height={size} className="text-gray-700" />
      </div>
    )
  }

  const renderContent = () => {
    // mode édition
    if (isEditing && w.type === 'card') {
      return (
        <>
          {renderCard()}
          {renderCardEditor()}
        </>
      )
    }
    if (isEditing) {
      return (
        <input
          type="text"
          value={tempText}
          onChange={(e) => setTempText(e.target.value)}
          onKeyDown={handleKeyDown}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute inset-0 w-full h-full px-2 py-1 bg-transparent border-none outline-none"
          style={{ boxSizing: 'border-box', fontSize: Math.max(12, 14 / scale), wordBreak: 'break-word', overflow: 'hidden' }}
          autoFocus
          data-no-drag
        />
      )
    }

    switch (w.type) {
      case 'desktop':
        return (
          <div className="flex flex-col w-full h-full">
            <div className="relative h-8 bg-gray-100 border-b rounded-t-lg">
              <div className="absolute -translate-x-1/2 left-1/2 -top-2">
                <div className="px-2 py-[2px] rounded-full bg-gray-800 text-white text-[15px] leading-none select-none pointer-events-none">
                  {(w.text ?? '').replace(/\bframe\b/gi, '').trim() || 'Desktop'}
                </div>
              </div>
            </div>
            <div className="flex-1 p-3" />
          </div>
        )

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

      case 'icon':
        return renderIcon()

      case 'nav':
        return renderNav()

      case 'button':
        return (
          <div className="flex items-center justify-center w-full h-full px-4 py-2 overflow-hidden">
            <span className="text-sm font-medium text-center truncate" style={{ fontSize: Math.max(10, 14/scale) }}>
              {w.text || 'Button'}
            </span>
          </div>
        )

      case 'input':
        return (
          <div className="flex items-center w-full h-full px-3 py-2">
            <span className="text-sm text-gray-500" style={{ fontSize: Math.max(12, 14/scale) }}>
              {w.text || 'Placeholder text...'}
            </span>
          </div>
        )

      case 'text':
        return (
          <div className="w-full h-full p-2" style={{ fontSize: Math.max(12, 14/scale) }}>
            {w.text || 'Text'}
          </div>
        )

      case 'image':
        return <div className="w-full h-full" />

      case 'card':
        return renderCard()

      case 'arrow':
        return <div className="absolute top-0 right-0 w-0 h-0 border-t-2 border-b-2 border-l-4 border-l-white border-t-transparent border-b-transparent" />

      default:
        return null
    }
  }

  return (
    <div
      className="wireframe-element"
      data-wire-id={w.id}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{ ...baseStyle, ...styleByType() }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        {renderContent()}

        {/* Delete */}
        {isHovered && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(w.id) }}
            className="absolute flex items-center justify-center text-white transition-colors bg-red-500 rounded-full hover:bg-red-600 delete-handle"
            style={{
              top: `-${8 / scale}px`,
              right: `-${8 / scale}px`,
              width: `${20 / scale}px`,
              height: `${20 / scale}px`,
              fontSize: `${12 / scale}px`,
              minWidth: '16px', minHeight: '16px', maxWidth: '24px', maxHeight: '24px',
            }}
            aria-label="Delete"
          >
            ×
          </button>
        )}

        {/* Resize */}
        {isHovered && w.type !== 'line' && w.type !== 'arrow' && (
          <div
            onMouseDown={handleResizeMouseDown}
            className="absolute transition-colors rounded cursor-se-resize bg-tracklab hover:bg-tracklab/80 resize-handle"
            style={{
              bottom: `-${4 / scale}px`,
              right: `-${4 / scale}px`,
              width: `${12 / scale}px`,
              height: `${12 / scale}px`,
              minWidth: '8px', minHeight: '8px', maxWidth: '16px', maxHeight: '16px',
            }}
            aria-label="Resize"
          />
        )}
      </div>
    </div>
  )
}
