import { useEffect } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { DevPanel } from './components/DevPanel'
import { Header } from './components/Header'
import CreatePage from './pages/CreatePage'
import FeedPage from './pages/FeedPage'
import MyPage from './pages/MyPage'
import RequestPage from './pages/RequestPage'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])
  return null
}

export default function App() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <ScrollToTop />
      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-5 sm:px-6 sm:pt-6">
        <Routes>
          <Route path="/" element={<FeedPage />} />
          <Route path="/request/:id" element={<RequestPage />} />
          <Route path="/new" element={<CreatePage />} />
          <Route path="/my" element={<MyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="no-print border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-[11.5px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>Демо-прототип «Кошелёк, подожди» · без сервера, данные в вашем браузере</span>
          <div className="flex items-center gap-4">
            <Link to="/?dev=1" className="link underline-offset-2 hover:underline">
              демо-панель
            </Link>
            <span className="text-muted/60">v0.2</span>
          </div>
        </div>
      </footer>

      <DevPanel />
    </div>
  )
}
