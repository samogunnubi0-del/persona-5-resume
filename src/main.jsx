import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './style.css'

const root = document.getElementById('root')
if (root) {
  // No StrictMode: double-mount was resetting `introComplete` and fighting the
  // #p5-loader in index.html, making the “Persona Shift Loading” screen feel stuck.
  createRoot(root).render(<App />)
}
