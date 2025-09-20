import { createContext, useCallback, useContext, useState } from 'react'

const ToastCtx = createContext({ push: (msg, type='info') => {} })

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const push = useCallback((message, type = 'info', timeout = 3000) => {
    const id = Math.random().toString(36).slice(2)
    setItems((arr) => [...arr, { id, message, type }])
    setTimeout(() => {
      setItems((arr) => arr.filter((x) => x.id !== id))
    }, timeout)
  }, [])
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="toast toast-end z-50">
        {items.map((t) => (
          <div key={t.id} className={`alert alert-${t.type}`}>
            <span className="text-sm">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  return useContext(ToastCtx)
}

