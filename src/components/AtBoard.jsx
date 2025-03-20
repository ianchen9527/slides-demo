import React, { useCallback, useEffect, useState } from "react"
import { Excalidraw } from "@excalidraw/excalidraw"

function AtBoard({ note, collaborators, onChange, onMouseMove }) {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null)

  // 更新畫面上的筆記
  useEffect(() => {
    if (!note) return
    if (!excalidrawAPI) return
    excalidrawAPI.updateScene({ elements: note })
  }, [excalidrawAPI, note])

  // 更新畫面上的協作者
  useEffect(() => {
    if (!collaborators) return
    if (!excalidrawAPI) return
    excalidrawAPI.updateScene({
      collaborators: new Map(Object.entries(collaborators)),
    })
  }, [collaborators, excalidrawAPI])

  // 處理滑鼠移動事件
  const onPointerUpdate = useCallback(
    ({ pointer, button }) => {
      if (!excalidrawAPI) return
      // 傳遞滑鼠移動事件到外部
      onMouseMove({ pointer, button })
      // 如果滑鼠按鍵不是按下，就不需要更新筆記
      // 如果是就外傳變更的筆記到外部
      if (button !== "down") return
      const elements = excalidrawAPI.getSceneElementsIncludingDeleted()
      onChange(elements)
    },
    [excalidrawAPI, onChange, onMouseMove]
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
        }}
        onPointerUpdate={onPointerUpdate}
      />
    </div>
  )
}

export default AtBoard
