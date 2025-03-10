import React, { useCallback, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { getDoc, doc, setDoc } from "firebase/firestore"
import { ref, set, onValue } from "firebase/database"
import { db, rtdb } from "../firebase"
import AtBoard from "./AtBoard"

const SlideViewer = () => {
  const [slideData, setSlideData] = useState(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [notes, setNotes] = useState([])
  const [initializing, setInitializing] = useState(true)
  const { id: slideId } = useParams()

  const fetchNotes = useCallback(async (slideInfo) => {
    const noteRefs = slideInfo.pages.map((page) => page.note)
    const notes = await Promise.all(
      noteRefs.map(async (noteRef) => {
        const noteSnap = await getDoc(noteRef)
        return noteSnap.data()
      })
    )

    const notesJson = notes.map((note) => {
      if (!note || !note.elements) return []
      try {
        return JSON.parse(note.elements)
      } catch (error) {
        console.error("❌ 解析 JSON 錯誤:", error)
        return []
      }
    })

    setNotes(notesJson)
    console.log("✅ 載入的 Notes:", notesJson)
  }, [])

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
      await fetchNotes(slideInfo)
      setInitializing(false)
    }
    fetchSlideData()
  }, [slideId, fetchNotes])

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
    console.log("DEBUG", currentPage, notes[currentPage])

    if (!slideId) return
    const notesRef = ref(rtdb, `slides/${slideId}/notes/${currentPage}`)

    const unsubscribe = onValue(notesRef, (snapshot) => {
      if (snapshot.exists()) {
        const newNotes = [...notes]
        newNotes[currentPage] = JSON.parse(snapshot.val())
        setNotes(newNotes)
      }
    })

    return () => unsubscribe()
  }, [slideId, currentPage])

  // 🔥 優化筆記更新機制
  const handleWhiteboardChange = async (elements, pageIndex) => {
    if (!slideData || !slideData.pages[pageIndex]?.note) {
      console.error("❌ 找不到 note Reference，無法儲存筆記")
      return
    }

    const elementsJSON = JSON.stringify(elements)
    if (elementsJSON === JSON.stringify(notes[pageIndex])) return
    const notesRef = ref(rtdb, `slides/${slideId}/notes/${currentPage}`)

    const noteRef = slideData.pages[pageIndex].note

    try {
      await set(notesRef, elementsJSON)
      await setDoc(noteRef, { elements: elementsJSON }, { merge: true })
      const newNotes = [...notes]
      newNotes[pageIndex] = elements
      setNotes(newNotes)
      console.log("✅ 筆記已儲存到 `notes` Collection", noteRef)
    } catch (error) {
      console.error("🔥 Firebase setDoc 錯誤:", error)
    }
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

  useEffect(() => {
    console.log("NOTES!", notes)
  }, [notes])

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
            initialData={notes[currentPage]}
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
