import Navbar from './components/Navbar.jsx'
import { ToastProvider } from './components/Toaster.jsx'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Scanner from './pages/Scanner.jsx'
import Search from './pages/Search.jsx'
import UserDetail from './pages/UserDetail.jsx'
import NotFound from './pages/NotFound.jsx'
import Enroll from './pages/Enroll.jsx'
import Security from './pages/Security.jsx'
import Fingerprints from './pages/Fingerprints.jsx'

function App() {
  return (
    <ToastProvider>
      <div className="drawer">
        <input id="app-drawer" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content">
          <label
            htmlFor="app-drawer"
            className="btn btn-primary btn-circle fixed top-4 left-4 z-30 shadow"
            aria-label="Open menu"
            title="Open menu"
          >
            ☰
          </label>
          <main className="mx-auto max-w-6xl px-4 py-6">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/scanner" element={<Scanner />} />
              <Route path="/search" element={<Search />} />
              <Route path="/users/:id" element={<UserDetail />} />
              <Route path="/fingerprints" element={<Fingerprints />} />
              <Route path="/enroll" element={<Enroll />} />
              <Route path="/security" element={<Security />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <footer className="border-t border-base-300 bg-base-100">
          </footer>
        </div>
        <div className="drawer-side z-40">
          <label htmlFor="app-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
          <aside className="w-72 bg-base-100 border-r border-base-300 min-h-full">
            <Navbar />
          </aside>
        </div>
      </div>
    </ToastProvider>
  )
}

export default App
