import {
  Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight,
  ChevronDown
} from 'lucide-react'

export interface TextStyles {
  fontFamily: string
  fontSize: number
  fontWeight: 'normal' | 'bold'
  fontStyle: 'normal' | 'italic'
  textDecoration: 'none' | 'underline'
  textAlign: 'left' | 'center' | 'right'
  color: string
}

interface TextToolbarProps {
  styles: TextStyles
  onStyleChange: (newStyles: Partial<TextStyles>) => void
}

// --- Nouvelles familles avec regroupements ---
type FontOption = { label: string; value: string; group: 'Sans-serif' | 'Serif' | 'Monospace' }
const FONT_OPTIONS: FontOption[] = [
  // Sans-serif
  { label: 'Roboto',        value: 'Roboto',        group: 'Sans-serif' },
  { label: 'Inter',         value: 'Inter',         group: 'Sans-serif' },
  { label: 'Poppins',       value: 'Poppins',       group: 'Sans-serif' },
  { label: 'Helvetica',     value: 'Helvetica',     group: 'Sans-serif' },
  { label: 'Arial',         value: 'Arial',         group: 'Sans-serif' },

  // Serif
  { label: 'Merriweather',  value: 'Merriweather',           group: 'Serif' },
  { label: 'Times New Roman', value: '"Times New Roman"',    group: 'Serif' },
  { label: 'Georgia',       value: 'Georgia',       group: 'Serif' },

  // Monospace
  { label: 'Fira Code',     value: '"Fira Code"',   group: 'Monospace' },
  { label: 'Courier New',   value: '"Courier New"', group: 'Monospace' },
]

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64]

// pour comparer proprement (quotes éventuelles)
const normalize = (s: string) => s.replace(/["']/g, '')

export default function TextToolbar({ styles, onStyleChange }: TextToolbarProps) {
  const selectedFamilyValue =
    FONT_OPTIONS.find(o => normalize(o.value) === normalize(styles.fontFamily) || o.label === normalize(styles.fontFamily))?.value
    ?? styles.fontFamily

  return (
    <div
      className="flex items-center gap-3 px-4 py-2 bg-white border-b border-gray-200"
      data-text-toolbar
    >
      {/* Font Family */}
      <div className="relative">
        <select
          value={selectedFamilyValue}
          onChange={(e) => onStyleChange({ fontFamily: e.target.value })}
          className="px-3 py-1 pr-8 text-sm bg-white border border-gray-300 rounded appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label="Police"
        >
          <optgroup label="Sans-serif">
            {FONT_OPTIONS.filter(f => f.group === 'Sans-serif').map(f => (
              <option key={f.label} value={f.value}>{f.label}</option>
            ))}
          </optgroup>
          <optgroup label="Serif">
            {FONT_OPTIONS.filter(f => f.group === 'Serif').map(f => (
              <option key={f.label} value={f.value}>{f.label}</option>
            ))}
          </optgroup>
          <optgroup label="Monospace">
            {FONT_OPTIONS.filter(f => f.group === 'Monospace').map(f => (
              <option key={f.label} value={f.value}>{f.label}</option>
            ))}
          </optgroup>
        </select>
        <ChevronDown className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 pointer-events-none right-2 top-1/2" />
      </div>

      {/* Font Size */}
      <div className="relative">
        <select
          value={styles.fontSize}
          onChange={(e) => onStyleChange({ fontSize: parseInt(e.target.value, 10) })}
          className="px-3 py-1 pr-8 text-sm bg-white border border-gray-300 rounded appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label="Taille de police"
        >
          {FONT_SIZES.map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
        <ChevronDown className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 pointer-events-none right-2 top-1/2" />
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300" />

      {/* Bold */}
      <button
        onClick={() => onStyleChange({ fontWeight: styles.fontWeight === 'bold' ? 'normal' : 'bold' })}
        className={`p-2 rounded hover:bg-gray-100 transition-colors ${styles.fontWeight === 'bold' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
        title="Gras"
        aria-pressed={styles.fontWeight === 'bold'}
      >
        <Bold className="w-4 h-4" />
      </button>

      {/* Italic */}
      <button
        onClick={() => onStyleChange({ fontStyle: styles.fontStyle === 'italic' ? 'normal' : 'italic' })}
        className={`p-2 rounded hover:bg-gray-100 transition-colors ${styles.fontStyle === 'italic' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
        title="Italique"
        aria-pressed={styles.fontStyle === 'italic'}
      >
        <Italic className="w-4 h-4" />
      </button>

      {/* Underline */}
      <button
        onClick={() => onStyleChange({ textDecoration: styles.textDecoration === 'underline' ? 'none' : 'underline' })}
        className={`p-2 rounded hover:bg-gray-100 transition-colors ${styles.textDecoration === 'underline' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
        title="Souligné"
        aria-pressed={styles.textDecoration === 'underline'}
      >
        <Underline className="w-4 h-4" />
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300" />

      {/* Text Align */}
      <div className="flex">
        <button
          onClick={() => onStyleChange({ textAlign: 'left' })}
          className={`p-2 rounded-l hover:bg-gray-100 transition-colors ${styles.textAlign === 'left' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
          title="Aligner à gauche"
          aria-pressed={styles.textAlign === 'left'}
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onStyleChange({ textAlign: 'center' })}
          className={`p-2 hover:bg-gray-100 transition-colors ${styles.textAlign === 'center' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
          title="Centrer"
          aria-pressed={styles.textAlign === 'center'}
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          onClick={() => onStyleChange({ textAlign: 'right' })}
          className={`p-2 rounded-r hover:bg-gray-100 transition-colors ${styles.textAlign === 'right' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
          title="Aligner à droite"
          aria-pressed={styles.textAlign === 'right'}
        >
          <AlignRight className="w-4 h-4" />
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300" />

      {/* Color Picker */}
      <div className="relative">
        <input
          type="color"
          value={styles.color}
          onChange={(e) => onStyleChange({ color: e.target.value })}
          className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
          title="Couleur du texte"
          aria-label="Couleur du texte"
        />
      </div>
    </div>
  )
}
