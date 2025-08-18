import { ReactNode, useEffect, useState } from "react"
import { createPortal } from "react-dom"

export default function Portal({ children }: { children: ReactNode }) {
  const [el, setEl] = useState<HTMLElement | null>(null)
  useEffect(() => {
    const node = document.createElement("div")
    document.body.appendChild(node)
    setEl(node)
    return () => { document.body.removeChild(node) }
  }, [])
  if (!el) return null
  return createPortal(children, el)
}
