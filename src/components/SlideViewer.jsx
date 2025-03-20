import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { getDoc, doc } from "firebase/firestore"
import { ref, set, onValue } from "firebase/database"
import { db, rtdb } from "../firebase"
import AtBoard from "./AtBoard"

const SlideViewer = () => {
  const [slideData, setSlideData] = useState(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [note, setNote] = useState([])
  const [initializing, setInitializing] = useState(true)
  const [randomUserId, setRandomUserId] = useState(null)
  const [collaborators, setCollaborators] = useState({})
  const { id: slideId } = useParams()

  // 讀取 Firestore 的投影片資料
  useEffect(() => {
    const fetchSlideData = async () => {
      const docRef = doc(db, "slides", slideId)
      const docSnap = await getDoc(docRef)
      if (!docSnap.exists()) {
        console.error("❌ 找不到投影片資料")
        return
      }

      const slideInfo = docSnap.data()
      setSlideData(slideInfo)

      if (slideInfo.pages && slideInfo.pages.length > 0) {
        setCurrentPage(0)
      } else {
        console.warn("投影片沒有內容")
      }
      setInitializing(false)
      setRandomUserId(Math.random().toString(36).substring(7))
    }
    fetchSlideData()
  }, [slideId])

  // 訂閱 Firebase Realtime Database 來同步協作者
  useEffect(() => {
    if (!slideId) return
    const collaboratorsRef = ref(rtdb, `slides/${slideId}/collaborators`)
    const unsubscribe = onValue(collaboratorsRef, (snapshot) => {
      if (!snapshot.exists()) return
      const collaborators = snapshot.val()
      const collaboratorsWithoutSelf = Object.fromEntries(
        Object.entries(collaborators).filter(([key]) => key !== randomUserId)
      )
      setCollaborators(collaboratorsWithoutSelf)
    })
    return () => unsubscribe()
  }, [slideId, randomUserId])

  // 更新協作者的畫筆位置
  const onMouseMove = ({ pointer, button }) => {
    const collaboratorsRef = ref(
      rtdb,
      `slides/${slideId}/collaborators/${randomUserId}`
    )
    set(collaboratorsRef, {
      pointer: { ...pointer },
      button,
      username: randomUserId,
    })
  }

  // 🔥 訂閱 Firebase Realtime Database 來同步翻頁
  useEffect(() => {
    if (!slideId) return
    const pageRef = ref(rtdb, `slides/${slideId}/currentPage`)
    const unsubscribe = onValue(pageRef, (snapshot) => {
      if (snapshot.exists()) {
        setCurrentPage(snapshot.val())
      }
    })

    return () => unsubscribe()
  }, [slideId])

  // 🔥 訂閱 Firebase Realtime Database 來同步白板內容
  useEffect(() => {
    if (!slideId) return
    const notesRef = ref(rtdb, `slides/${slideId}/notes/${currentPage}`)
    const unsubscribe = onValue(notesRef, (snapshot) => {
      if (!snapshot.exists()) return
      if (snapshot.val() === note) return
      const remoteNote = snapshot.val()
      if (remoteNote.sender === randomUserId) return
      setNote(JSON.parse(remoteNote.elements))
    })
    return () => unsubscribe()
  }, [slideId, currentPage, note, randomUserId])

  // 🔥 優化筆記更新機制
  const handleWhiteboardChange = async (elements) => {
    const noteRef = ref(rtdb, `slides/${slideId}/notes/${currentPage}`)
    await set(noteRef, {
      elements: JSON.stringify(elements),
      sender: randomUserId,
    })
  }

  // 處理翻頁邏輯
  const handleNextPage = () => {
    if (!slideData || !slideData.pages) return
    if (currentPage < slideData.pages.length - 1) {
      const nextPage = currentPage + 1
      setCurrentPage(nextPage)

      // 🔥 同步翻頁至 Firebase
      const pageRef = ref(rtdb, `slides/${slideId}/currentPage`)
      set(pageRef, nextPage)
    }
  }

  const handlePrevPage = () => {
    if (!slideData || !slideData.pages) return
    if (currentPage > 0) {
      const prevPage = currentPage - 1
      setCurrentPage(prevPage)

      // 🔥 同步翻頁至 Firebase
      const pageRef = ref(rtdb, `slides/${slideId}/currentPage`)
      set(pageRef, prevPage)
    }
  }

  if (
    !slideData ||
    !slideData.pages ||
    !slideData.pages[currentPage] ||
    initializing
  ) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <div
        style={{
          position: "relative",
          width: "100vw",
          height: "100vh",
          backgroundColor: "gray",
        }}
      >
        <div
          style={{
            display: "block",
            position: "absolute",
            width: "960px",
            height: "640px",
          }}
        >
          <img
            src={slideData.pages[currentPage].content}
            alt="投影片"
            style={{
              width: "960px",
              height: "640px",
              position: "absolute",
              zIndex: 0,
            }}
          />
          <AtBoard
            note={note}
            collaborators={collaborators}
            onMouseMove={onMouseMove}
            onChange={(elements) =>
              handleWhiteboardChange(elements, currentPage)
            }
          />
        </div>
        <div
          style={{
            position: "absolute",
            width: "960px",
            top: "650px",
            left: "0px",
          }}
        >
          <button
            style={{ position: "absolute", top: "0px", left: "0px" }}
            onClick={handlePrevPage}
            disabled={currentPage === 0}
          >
            上一頁
          </button>
          <button
            style={{ position: "absolute", top: "0px", right: "0px" }}
            onClick={handleNextPage}
            disabled={currentPage === slideData.pages.length - 1}
          >
            下一頁
          </button>
        </div>
      </div>
    </div>
  )
}

export default SlideViewer
