import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectItem, submitOrder as submitOrderThunk } from '../entities/order/orderSlice'
import { updateProfile } from '../entities/user/userSlice'
import { useCart } from '../app/context/useCart'
import { CartIcon } from '../features/cart/CartIcon'
import { CartPage } from '../features/cart/CartPage'
import { CheckoutModal } from '../features/order-by-prompt/CheckoutModal'
import { FoodGrid } from '../features/order-by-prompt/FoodGrid'
import { OrderSummary } from '../features/order-by-prompt/OrderSummary'
import { PromptHero } from '../features/order-by-prompt/PromptHero'
import { useOrderPrompt } from '../features/order-by-prompt/useOrderPrompt'
import { useStartupMenu } from '../features/order-by-prompt/useStartupMenu'
import { OrderStatus } from '../features/order-status/OrderStatus'
import { useOrderTracking } from '../features/order-status/useOrderTracking'
import { NearbyRestaurants } from '../features/nearby-restaurants/NearbyRestaurants'
import { Account } from '../features/auth/Account'
import '../App.css'

export function HomePage() {
  const dispatch = useDispatch()
  const prompt = useOrderPrompt()
  const selectedItem = useSelector((state) => state.order.selectedItem)
  const order = useSelector((state) => state.order.current)
  const placing = useSelector((state) => state.order.status === 'placing')
  const orderError = useSelector((state) => state.order.error)
  const form = useSelector((state) => state.user)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const { items: cartItems, addItem, removeItem } = useCart()
  const trackingError = useOrderTracking(order)
  const startupMenu = useStartupMenu()

  const items = prompt.status === 'idle' ? startupMenu.items : prompt.suggestions

  function addToCart(item) {
    dispatch(selectItem(item))
    addItem(item)
  }

  async function submitOrder(event) {
    event.preventDefault()
    const result = await dispatch(submitOrderThunk({ itemId: selectedItem.id, customerName: form.customerName.trim(), address: form.address.trim(), paymentMethod: form.paymentMethod }))
    if (submitOrderThunk.fulfilled.match(result)) {
      setCheckoutOpen(false)
      setCartOpen(false)
      removeItem(selectedItem.id)
      dispatch(selectItem(null))
    }
  }

  const page = cartOpen ? (
    <CartPage
      items={cartItems}
      onBack={() => setCartOpen(false)}
      onCheckout={() => {
        setCartOpen(false)
        setCheckoutOpen(true)
      }}
      onRemove={(id) => {
        removeItem(id)
        if (selectedItem?.id === id) dispatch(selectItem(null))
      }}
      onSelect={(item) => dispatch(selectItem(item))}
      selectedItem={cartItems.find((item) => item.id === selectedItem?.id)}
    />
  ) : (
    <main className="mx-auto w-full max-w-7xl px-5 pb-20 sm:px-8">
      <PromptHero query={prompt.query} loading={prompt.loading} onQueryChange={prompt.setQuery} onSubmit={prompt.submitPrompt} />
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <FoodGrid error={prompt.error} items={items} selectedItem={selectedItem} onSelect={addToCart} />
        <aside className="lg:sticky lg:top-6">
          {order ? <OrderStatus order={order} trackingError={trackingError} /> : <OrderSummary item={selectedItem} onCheckout={() => setCheckoutOpen(true)} />}
        </aside>
      </div>
      <NearbyRestaurants />
      <footer className="mt-16 border-t border-[#e5e7e1] pt-5 text-center text-xs text-[#92978f]">spoon · Food delivery demo · Checkout and courier tracking are simulated</footer>
    </main>
  )

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-[#20251f]">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <a className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight" href="/" aria-label="Spoon, home">
          <span className="brand-mark">S</span>spoon
        </a>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-[#626960] shadow-sm sm:flex">
            <span aria-hidden="true">⌖</span><span>Kyiv</span><span className="text-[#a2a69f]">·</span><span>Delivery 25–40 min</span>
          </div>
          <Account />
          <button aria-label={`Open shopping cart${cartItems.length ? `, ${cartItems.length} item${cartItems.length === 1 ? '' : 's'}` : ''}`} className="relative grid h-11 w-11 place-items-center rounded-full border border-[#d9e1d5] bg-white text-lg text-[#456b49] shadow-sm hover:bg-[#eef2eb]" onClick={() => setCartOpen(true)} type="button">
            <CartIcon className="h-6 w-6" />{cartItems.length > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#456b49] px-1 text-[10px] font-bold text-white">{cartItems.length}</span>}
          </button>
        </div>
      </header>
      {page}
      {checkoutOpen && selectedItem && <CheckoutModal error={orderError} form={form} item={selectedItem} placing={placing} setForm={(nextForm) => dispatch(updateProfile(nextForm))} onClose={() => setCheckoutOpen(false)} onSubmit={submitOrder} />}
    </div>
  )
}
