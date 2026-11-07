import { useCallback, useMemo, useState } from 'react'
import { CartContext } from './CartContext.js'

export function CartProvider({ children }) {
  const [items, setItems] = useState([])

  const addItem = useCallback((item) => {
    setItems((current) => current.some((cartItem) => cartItem.id === item.id) ? current : [...current, item])
  }, [])
  const removeItem = useCallback((id) => {
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])
  const value = useMemo(() => ({ items, addItem, removeItem }), [items, addItem, removeItem])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
