import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react'
import { ReactSketchCanvas, ReactSketchCanvasRef } from 'react-sketch-canvas'

type Tool = 'pencil' | 'eraser'

export type DrawingLayerRef = {
  setTool: (tool: Tool) => void
  setColor: (color: string) => void
  setWidth: (width: number) => void
  undo: () => void
  clear: () => void
}

type Props = { 
  active: boolean 
  tool: Tool
  color: string
  width: number
  transform: {
    x: number
    y: number
    scale: number
  }
  worldSize: {
    width: number
    height: number
  }
}

const DrawingLayer = forwardRef<DrawingLayerRef, Props>(({ 
  active, 
  tool, 
  color, 
  width, 
  transform,
  worldSize 
}, ref) => {
  const canvasRef = useRef<ReactSketchCanvasRef>(null)

  // Synchroniser les props avec le canvas
  useEffect(() => {
    if (canvasRef.current) {
      if (tool === 'eraser') {
        canvasRef.current.eraseMode(true)
      } else {
        canvasRef.current.eraseMode(false)
      }
    }
  }, [tool])

  useImperativeHandle(ref, () => ({
    setTool: (newTool: Tool) => {
      if (canvasRef.current) {
        canvasRef.current.eraseMode(newTool === 'eraser')
      }
    },
    setColor: () => {
      if (canvasRef.current) {
        canvasRef.current.eraseMode(false)
      }
    },
    setWidth: () => {
      // La largeur est gérée par les props
    },
    undo: () => canvasRef.current?.undo(),
    clear: () => canvasRef.current?.clearCanvas(),
  }), [])

  // Calculer les dimensions du canvas selon la transformation
  const canvasWidth = worldSize.width * transform.scale
  const canvasHeight = worldSize.height * transform.scale

  return (
    <div
      className="absolute inset-0 z-30 overflow-hidden pointer-events-none"
    >
      <div
        style={{
          position: 'absolute',
          left: transform.x,
          top: transform.y,
          width: canvasWidth,
          height: canvasHeight,
          transformOrigin: 'top left',
          pointerEvents: active ? 'auto' : 'none',
          cursor: active ? (tool === 'eraser' ? 'grab' : 'crosshair') : 'default'
        }}
      >
        <ReactSketchCanvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          strokeColor={color}
          strokeWidth={width * transform.scale}
          eraserWidth={width * transform.scale * 3}
          canvasColor="transparent"
          withTimestamp={true}
          allowOnlyPointerType="all"
          style={{ 
            width: '100%', 
            height: '100%',
            border: 'none',
            outline: 'none'
          }}
        />
      </div>
    </div>
  )
})

DrawingLayer.displayName = 'DrawingLayer'

export default DrawingLayer