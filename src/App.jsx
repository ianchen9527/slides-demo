import { Routes, Route, Link } from "react-router-dom"
import SlideViewer from "./components/SlideViewer"

function App() {
  return (
    <div>
      <h1>Slide Demo</h1>
      <ul>
        <li>
          <Link to="/at-slides/1">Slide 1</Link>
        </li>
        <li>
          <Link to="/at-slides/2">Slide 2</Link>
        </li>
      </ul>
    </div>
  )
}

export default App
