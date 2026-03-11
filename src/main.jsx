import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AIDevQuiz from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AIDevQuiz />
  </StrictMode>
)
