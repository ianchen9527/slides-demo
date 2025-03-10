import React, { useEffect, useState, useCallback } from "react"
import { Excalidraw } from "@excalidraw/excalidraw"
import { debounce } from "lodash"

function AtBoard({ initialData, onChange }) {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null)
  const [prevElements, setPrevElements] = useState([])

  useEffect(() => {
    if (excalidrawAPI && initialData) {
      excalidrawAPI.updateScene({ elements: initialData })
      setPrevElements(initialData)
    }
  }, [excalidrawAPI, initialData])

  // 🔥 過濾不必要的屬性，僅保留關鍵資訊
  const filterElements = (elements) => {
    return elements.map(({ id, type, x, y, width, height, strokeColor }) => ({
      id,
      type,
      x,
      y,
      width,
      height,
      strokeColor,
    }))
  }

  // ✅ Debounce 優化 & 避免重複上傳
  const handleDebouncedChange = useCallback(
    debounce((elements) => {
      const filteredElements = filterElements(elements)
      const filteredPrevElements = filterElements(prevElements)

      if (
        JSON.stringify(filteredElements) !==
        JSON.stringify(filteredPrevElements)
      ) {
        setPrevElements(filteredElements)
        onChange(elements)
      }
    }, 500), // 1 秒內無變動才上傳
    [prevElements, onChange]
  )

  return (
    <div
      style={{
        width: "960px",
        height: "640px",
        position: "absolute",
        top: 0,
        left: 0,
      }}
    >
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        initialData={{
          appState: { viewBackgroundColor: "transparent" },
          elements: initialData || [],
        }}
        onChange={handleDebouncedChange} // 使用 debounce 處理變更
      />
    </div>
  )
}

export default AtBoard
