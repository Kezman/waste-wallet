import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { initTheme } from './lib/theme'
import './styles.css'

// На GitHub Pages приложение живёт в подпапке /<repo>/, локально — в корне.
// Vite подставляет правильное значение через base, роутеру нужно то же самое без хвостового слэша.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

// Тема применяется до первого рендера, чтобы не было вспышки светлой версии.
initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
