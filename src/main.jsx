import React from "react"
import ReactDOM from "react-dom/client"
import { HashRouter, Routes, Route } from "react-router-dom"
import App from "./App"
import SlideViewer from "./components/SlideViewer"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      {" "}
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/at-slides/:id" element={<SlideViewer />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
)
