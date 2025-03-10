import React from "react"
import { Routes, Route } from "react-router-dom"
import SlideViewer from "./components/SlideViewer"

function App() {
  return (
    <Routes>
      <Route path="/at-slides/:id" element={<SlideViewer />} />
    </Routes>
  )
}

export default App
