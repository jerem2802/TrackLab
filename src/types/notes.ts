import type { CSSProperties } from 'react'

export interface StickyNote {
  id: string
  x: number
  y: number
  color: string
  text: string
  z: number
  
  textStyles?: Partial<
    Pick<
      CSSProperties,
      | 'fontFamily'
      | 'fontSize'
      | 'fontWeight'
      | 'fontStyle'
      | 'textDecoration'
      | 'textAlign'
      | 'color'
      | 'letterSpacing'
      | 'lineHeight'
    >
  >
}
