import { useMemo, useState } from "react"
import {
  MousePointer2, Diamond, ArrowRight,
  Minus, Type, Image, Monitor, Smartphone,
  Square, RectangleHorizontal, ChevronUp, Menu,
  Table2, Star
} from "lucide-react"

type ToolId =
  | "select"
  | "desktop" | "mobile" | "diamond" | "arrow" | "line"
  | "text" | "image" | "button" | "input" | "card" | "nav" | "icon"

export default function BottomToolbar({
  active,
  onPick,
}: {
  active: ToolId
  onPick: (tool: ToolId, variant?: string) => void
}) {
  const [showButtonMenu, setShowButtonMenu] = useState(false)
  const [showNavMenu, setShowNavMenu] = useState(false)

  const groups = useMemo(
    () => [
      [{ id: "select", icon: MousePointer2, label: "Select" }],
      [
        { id: "desktop", icon: Monitor, label: "Desktop Frame (1440x900)" },
        { id: "mobile", icon: Smartphone, label: "Mobile Frame (375x667)" },
      ],
      [
        { id: "nav", icon: Menu, label: "Navigation", hasMenu: true },
        { id: "button", icon: RectangleHorizontal, label: "Button", hasMenu: true },
        { id: "input", icon: Square, label: "Input Field" },
        { id: "card", icon: Table2, label: "Card" }, // ← plus de menu ici
      ],
      [
        { id: "diamond", icon: Diamond, label: "Diamond" },
        { id: "arrow", icon: ArrowRight, label: "Arrow" },
        { id: "line", icon: Minus, label: "Line" },
      ],
      [
        { id: "text", icon: Type, label: "Text" },
        { id: "image", icon: Image, label: "Image" },
        { id: "icon", icon: Star, label: "Icon" },
      ],
    ],
    []
  )

  const handleToolClick = (id: string, hasMenu?: boolean) => {
    if (id === "button" && hasMenu) {
      setShowButtonMenu((o) => !o)
      setShowNavMenu(false)
      return
    }
    if (id === "nav" && hasMenu) {
      setShowNavMenu((o) => !o)
      setShowButtonMenu(false)
      return
    }
    onPick(id as ToolId)
    setShowButtonMenu(false)
    setShowNavMenu(false)
  }

  const handleVariant = (tool: ToolId, variant: string) => {
    onPick(tool, variant)
    setShowButtonMenu(false)
    setShowNavMenu(false)
  }

  return (
    <div className="fixed z-50 -translate-x-1/2 bottom-4 left-1/2">
      <div className="flex items-center gap-2 px-2 py-1 shadow-xl rounded-2xl bg-white/85 backdrop-blur">
        {groups.map((grp, gi) => (
          <div key={gi} className="relative flex items-center">
            {grp.map(({ id, icon: Icon, label, hasMenu }) => {
              const isActive = active === (id as ToolId)
              return (
                <div key={id} className="relative">
                  <button
                    onClick={() => handleToolClick(id, hasMenu)}
                    title={label}
                    className={`mx-0.5 h-9 w-9 grid place-items-center rounded-lg text-gray-700 hover:bg-gray-100 relative ${
                      isActive ? "bg-violet-200" : ""
                    }`}
                  >
                    <Icon size={18} />
                    {hasMenu && (
                      <ChevronUp size={22} className="absolute transform -translate-x-1/2 bottom-5 left-1/2" />
                    )}
                  </button>

                  {/* Menu NAV */}
                  {id === "nav" && showNavMenu && (
                    <div className="absolute z-50 mb-2 bg-white border rounded-lg shadow-lg bottom-full min-w-32">
                      <button onClick={() => handleVariant("nav", "horizontal")} className="block w-full px-3 py-2 text-sm text-left rounded-t-lg hover:bg-gray-100">Horizontal</button>
                      <button onClick={() => handleVariant("nav", "vertical")}   className="block w-full px-3 py-2 text-sm text-left hover:bg-gray-100">Vertical</button>
                      <button onClick={() => handleVariant("nav", "tabs")}       className="block w-full px-3 py-2 text-sm text-left hover:bg-gray-100">Tabs</button>
                      <button onClick={() => handleVariant("nav", "breadcrumb")} className="block w-full px-3 py-2 text-sm text-left rounded-b-lg hover:bg-gray-100">Breadcrumb</button>
                    </div>
                  )}

                  {/* Menu BUTTON */}
                  {id === "button" && showButtonMenu && (
                    <div className="absolute z-50 mb-2 bg-white border rounded-lg shadow-lg bottom-full min-w-32">
                      <button onClick={() => handleVariant("button", "primary")}   className="block w-full px-3 py-2 text-sm text-left text-white bg-blue-500 rounded-t-lg hover:bg-gray-100">Button</button>
                      <button onClick={() => handleVariant("button", "secondary")} className="block w-full px-3 py-2 text-sm text-left text-blue-500 border-2 border-blue-500 hover:bg-gray-100">Button</button>
                      <button onClick={() => handleVariant("button", "outline")}   className="block w-full px-3 py-2 text-sm text-left text-gray-400 border-2 border-gray-400 hover:bg-gray-100">Button</button>
                      <button onClick={() => handleVariant("button", "danger")}    className="block w-full px-3 py-2 text-sm text-left text-white bg-red-500 hover:bg-gray-100">Button</button>
                      <button onClick={() => handleVariant("button", "success")}   className="block w-full px-3 py-2 text-sm text-left text-white bg-green-500 rounded-b-lg hover:bg-gray-100">Button</button>
                    </div>
                  )}
                </div>
              )
            })}
            {gi < groups.length - 1 && <div className="w-px h-6 mx-1 bg-gray-300" />}
          </div>
        ))}
      </div>
    </div>
  )
}
