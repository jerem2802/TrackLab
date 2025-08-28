import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Trash2, MoveDiagonal2, FileText } from "lucide-react"

type NoteMsg = { id: string; text: string; side: "left" | "right"; ts: number }

export type DroppedImage = {
  id: string
  x: number
  y: number
  width: number
  height: number
  src: string
  z?: number
  createdAt: number
  note?: string
  noteThread?: NoteMsg[]
}

type Props = {
  img: DroppedImage
  scale: number
  onChange: (patch: Partial<DroppedImage>) => void
  onDelete: () => void
  onFocus: () => void
}

type ResizeState = { x: number; y: number; width: number; height: number; axis: "w" | "h" | null }

export default function ImageItem({ img, scale, onChange, onDelete, onFocus }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef<{ x: number; y: number } | null>(null)
  const resizeStart = useRef<ResizeState | null>(null)
  const resizing = useRef(false)

  // Chat
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [thread, setThread] = useState<NoteMsg[]>(() => img.noteThread || [])
  const [noteSeen, setNoteSeen] = useState<boolean>(() => !(img.note || img.noteThread?.length))
  const [draft, setDraft] = useState("")

  // Migration ancienne note -> 1er message
  useEffect(() => {
    if (!img.noteThread && img.note) {
      const first: NoteMsg = { id: crypto.randomUUID(), text: img.note, side: "left", ts: Date.now() }
      setThread([first])
      onChange({ noteThread: [first] })
      setNoteSeen(false)
    } else {
      setThread(img.noteThread || [])
      setNoteSeen(!(img.noteThread && img.noteThread.length))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img.note, img.noteThread])

  // "!" si nouveau message pendant fermeture
  const prevCountRef = useRef<number>(thread.length)
  useEffect(() => {
    if (!isChatOpen) {
      if (thread.length > prevCountRef.current) setNoteSeen(false)
      if (thread.length === 0) setNoteSeen(true)
      prevCountRef.current = thread.length
    }
  }, [thread.length, isChatOpen])

  // object-contain padding
  const [aspect, setAspect] = useState(() => (img.width && img.height ? img.width / img.height : 1))
  const { padX, padY } = (() => {
    const W = img.width, H = img.height, a = aspect || 1, r = W / H
    if (a > r) {
      const drawH = W / a
      return { padX: 0, padY: (H - drawH) / 2 }
    } else {
      const drawW = H * a
      return { padX: (W - drawW) / 2, padY: 0 }
    }
  })()

  // UI const
  const uiScale = 1 / scale
  const M = 4
  const BTN = 16
  const EXCL = 18
  const GAP = 6
  const MODAL_W = 520
  const BTN_STYLE: React.CSSProperties = { width: BTN, height: BTN }

  // Drag
  const onPointerDown = (e: React.PointerEvent) => {
    const t = e.target as HTMLElement
    if (t.closest(".img-resize") || t.closest(".img-action-btn") || t.closest(".note-modal")) return
    e.stopPropagation()
    onFocus()
    dragStart.current = { x: e.clientX, y: e.clientY }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (resizing.current || isChatOpen || !dragStart.current) return
    const dx = (e.clientX - dragStart.current.x) / scale
    const dy = (e.clientY - dragStart.current.y) / scale
    dragStart.current = { x: e.clientX, y: e.clientY }
    onChange({ x: img.x + dx, y: img.y + dy, z: Date.now() })
  }
  const onPointerUp = (e: React.PointerEvent) => {
    dragStart.current = null
    ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
  }

  // Resize (ratio, axe auto)
  const doResize = useCallback((clientX: number, clientY: number) => {
    const rs = resizeStart.current
    if (!rs) return
    const dx = (clientX - rs.x) / scale
    const dy = (clientY - rs.y) / scale
    if (!rs.axis) {
      const dist = Math.hypot(dx, dy)
      if (dist < 2 / scale) return
      rs.axis = Math.abs(dx) >= Math.abs(dy) ? "w" : "h"
    }
    const a = aspect || 1
    let newW = rs.width
    let newH = rs.height
    if (rs.axis === "w") { newW = Math.max(40, rs.width + dx); newH = Math.max(40, newW / a) }
    else                { newH = Math.max(40, rs.height + dy); newW = Math.max(40, newH * a) }
    onChange({ width: newW, height: newH, z: Date.now() })
  }, [aspect, onChange, scale])

  const onWindowMove = useCallback((e: PointerEvent) => { if (resizing.current) doResize(e.clientX, e.clientY) }, [doResize])
  const endResize = useCallback(() => {
    resizing.current = false
    resizeStart.current = null
    window.removeEventListener("pointermove", onWindowMove)
    window.removeEventListener("pointerup", endResize)
  }, [onWindowMove])

  const onResizeDown = (e: React.PointerEvent) => {
    e.stopPropagation(); onFocus()
    resizeStart.current = { x: e.clientX, y: e.clientY, width: img.width, height: img.height, axis: null }
    resizing.current = true
    window.addEventListener("pointermove", onWindowMove)
    window.addEventListener("pointerup", endResize, { once: true })
  }
  const onResizeMove = (e: React.PointerEvent) => { if (resizing.current) doResize(e.clientX, e.clientY) }
  const onResizeUp = () => { if (resizing.current) endResize() }

  // Chat actions
  const openChat = (e: React.MouseEvent) => { e.stopPropagation(); setIsChatOpen(true) }
  const closeChat = () => { setIsChatOpen(false); setNoteSeen(true) }
  const sendMsg = () => {
    const text = draft.trim()
    if (!text) return
    const msg: NoteMsg = { id: crypto.randomUUID(), text, side: "right", ts: Date.now() }
    const updated = [...thread, msg]
    setThread(updated)
    onChange({ noteThread: updated })
    setDraft("")
    setNoteSeen(false)
  }

  // Réactions rapides
  const REACTIONS = [
    { emoji: "👍", label: "OK" },
    { emoji: "👎", label: "Non" },
    { emoji: "✅", label: "Validé" },
    { emoji: "❌", label: "Refus" },
    { emoji: "🤔", label: "À discuter" },
    { emoji: "⚠️", label: "Attention" },
  ]
  const sendReaction = (emoji: string) => {
    const msg: NoteMsg = { id: crypto.randomUUID(), text: emoji, side: "right", ts: Date.now() }
    const updated = [...thread, msg]
    setThread(updated)
    onChange({ noteThread: updated })
    setNoteSeen(false)
  }

  // Position modale (portal) — pas de scale, offsets * scale
  const [modalPos, setModalPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const recalcModalPos = useCallback(() => {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return
    const offsetYWorld = padY + M + (thread.length && !noteSeen ? EXCL : BTN) + GAP
    const offsetXWorld = padX + M
    setModalPos({
      top: rect.top + offsetYWorld * scale,
      left: rect.left + offsetXWorld * scale
    })
  }, [padX, padY, thread.length, noteSeen, scale])

  useLayoutEffect(() => { if (isChatOpen) recalcModalPos() }, [isChatOpen, recalcModalPos, scale])
  useEffect(() => {
    if (!isChatOpen) return
    const h = () => recalcModalPos()
    window.addEventListener("resize", h)
    window.addEventListener("scroll", h, true)
    return () => {
      window.removeEventListener("resize", h)
      window.removeEventListener("scroll", h, true)
    }
  }, [isChatOpen, recalcModalPos])

  // ===== Render =====
  return (
    <div
      ref={wrapRef}
      className="absolute select-none image-item group"
      style={{ left: img.x, top: img.y, width: img.width, height: img.height, zIndex: img.z ?? 1, touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={(e) => { onPointerMove(e); onResizeMove(e) }}
      onPointerUp={onPointerUp}
    >
      <div className="relative w-full h-full">
        <img
          src={img.src}
          alt=""
          draggable={false}
          className="block object-contain w-full h-full select-none"
          style={{ pointerEvents: "none" }}
          onLoad={(e) => {
            const iw = e.currentTarget.naturalWidth  || img.width  || 1
            const ih = e.currentTarget.naturalHeight || img.height || 1
            if (iw && ih) setAspect(iw / ih)
          }}
        />

        {/* coin haut-gauche : "!" (non lu) ou icône note */}
        {(thread.length > 0 && !noteSeen) ? (
          <div
            className="absolute z-20 opacity-100"
            style={{ top: padY + M, left: padX + M, transform: `scale(${uiScale})`, transformOrigin: "top left" }}
          >
            <button
              onClick={openChat}
              onPointerDown={(e) => e.stopPropagation()}
              className="grid rounded-full shadow img-action-btn place-items-center"
              style={{ width: EXCL, height: EXCL, backgroundColor: "#22c55e" }}
              title="Nouveaux messages"
            >
              <span className="text-[11px] font-black text-white">!</span>
            </button>
          </div>
        ) : (
          <div
            className="absolute z-20 transition-opacity opacity-0 group-hover:opacity-100"
            style={{ top: padY + M, left: padX + M, transform: `scale(${uiScale})`, transformOrigin: "top left" }}
            title="Ouvrir la discussion"
          >
            <button
              onClick={openChat}
              onPointerDown={(e) => e.stopPropagation()}
              className="img-action-btn rounded-full bg-white/90 hover:bg-white shadow p-0.5"
              style={BTN_STYLE}
            >
              <FileText className="w-3 h-3 text-blue-600" />
            </button>
          </div>
        )}

        {/* coin haut-droit : supprimer */}
        <div
          className="absolute z-20 transition-opacity opacity-0 group-hover:opacity-100"
          style={{ top: padY + M, right: padX + M, transform: `scale(${uiScale})`, transformOrigin: "top right" }}
          title="Supprimer"
        >
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            onPointerDown={(e) => e.stopPropagation()}
            className="img-action-btn rounded-full bg-white/90 hover:bg-white shadow p-0.5"
            style={BTN_STYLE}
          >
            <Trash2 className="w-3 h-3 text-red-600" />
          </button>
        </div>

        {/* coin bas-droit : resize */}
        <div
          className="absolute z-20 transition-opacity opacity-0 group-hover:opacity-100"
          style={{ bottom: padY + M, right: padX + M, transform: `scale(${uiScale})`, transformOrigin: "bottom right" }}
          title="Redimensionner"
        >
          <button
            className="img-resize rounded-full bg-white/90 hover:bg-white shadow p-0.5 cursor-se-resize"
            style={BTN_STYLE}
            onPointerDown={onResizeDown}
            onPointerMove={onResizeMove}
            onPointerUp={onResizeUp}
          >
            <MoveDiagonal2 className="w-3 h-3 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Modale chat en portal */}
      {isChatOpen && createPortal(
        <div
          className="note-modal"
          style={{ position: "fixed", top: modalPos.top, left: modalPos.left, zIndex: 2147483647, width: MODAL_W }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onPointerMove={(e) => e.stopPropagation()}
        >
          <div className="p-4 bg-white border-2 border-gray-200 shadow-2xl rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-gray-900">Discussion liée à l’image</div>
              <button onClick={closeChat} className="px-2 py-1 text-xs text-gray-600 rounded hover:bg-gray-100">Fermer</button>
            </div>

            <div className="overflow-auto border border-gray-200 rounded-md bg-gray-50" style={{ height: thread.length ? 240 : 140 }}>
              {thread.length === 0 ? (
                <div className="grid h-full px-4 text-sm text-gray-500 place-items-center">
                  Aucun message. Écrivez le premier ci-dessous.
                </div>
              ) : (
                <div className="p-3 space-y-3">
                  {thread.map(m => (
                    <div key={m.id} className={m.side === "left" ? "pr-6" : "pl-6"}>
                      <div className={`flex ${m.side === "left" ? "justify-start" : "justify-end"}`}>
                        <div className="flex items-end gap-2">
                          <div className="grid w-7 h-7 text-[11px] bg-white border border-gray-300 rounded-md place-items-center">🙂</div>
                          <div className="relative">
                            <div className={`max-w-[70vw] sm:max-w-[420px] px-3 py-2 rounded-lg border ${m.side === "left" ? "border-gray-300" : "border-blue-300"} bg-white text-[13px] leading-snug`}>
                              {m.text}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Emojis rapprochés + input + envoyer (sans débordement) */}
            <div className="flex flex-wrap items-center w-full gap-2 mt-3">
              <div className="flex items-center gap-1">
                {REACTIONS.map((r) => (
                  <button
                    key={r.emoji}
                    title={r.label}
                    onClick={() => sendReaction(r.emoji)}
                    className="p-1 text-[18px] leading-none rounded hover:bg-gray-100"
                  >
                    {r.emoji}
                  </button>
                ))}
              </div>

              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg() } }}
                placeholder="Écrire un message…"
                className="flex-1 min-w-[160px] px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={sendMsg}
                className="px-3 py-2 text-sm text-white bg-blue-600 rounded-md shrink-0 hover:bg-blue-700"
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
