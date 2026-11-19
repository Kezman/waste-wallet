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

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-5 sm:px-6 sm:pt-6">
        <Routes>
          <Route path="/" element={<FeedPage />} />
          <Route path="/request/:id" element={<RequestPage />} />
          <Route path="/new" element={<CreatePage />} />
          <Route path="/my" element={<MyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="no-print mt-4 border-t border-rule/80">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-1.5 px-4 py-5 text-[11px] text-ink-soft sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>
            Демо-прототип «Кошелёк, подожди» · без сервера, данные в вашем браузере
          </span>
          <div className="flex items-center gap-3">
            <Link to="/?dev=1" className="link-underline">
              демо-панель
            </Link>
            <span className="text-ink-soft/50">v0.1</span>
          </div>
        </div>
      </footer>

      <DevPanel />
    </div>
  )
}
