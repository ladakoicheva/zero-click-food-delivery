import { useState } from 'react'
import { createOrder } from '../shared/api/client'
import { defaultMenuItems } from '../entities/restaurant/model'
import { CheckoutModal } from '../features/order-by-prompt/CheckoutModal'
import { FoodGrid } from '../features/order-by-prompt/FoodGrid'
import { OrderSummary } from '../features/order-by-prompt/OrderSummary'
import { PromptHero } from '../features/order-by-prompt/PromptHero'
import { useOrderPrompt } from '../features/order-by-prompt/useOrderPrompt'
import { OrderStatus } from '../features/order-status/OrderStatus'
import { useOrderTracking } from '../features/order-status/useOrderTracking'
import '../App.css'

export function HomePage() {
  const prompt = useOrderPrompt()
  const [selectedItem, setSelectedItem] = useState(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [form, setForm] = useState({ customerName: '', address: '', paymentMethod: 'on_delivery' })
  const [placing, setPlacing] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [order, setOrder] = useState(null)
  const trackingError = useOrderTracking(order, setOrder)
  const items = prompt.suggestions.length ? prompt.suggestions : defaultMenuItems

  async function submitOrder(event) {
    event.preventDefault()
    setPlacing(true)
    setOrderError('')
    try {
      const data = await createOrder({ itemId: selectedItem.id, customerName: form.customerName.trim(), address: form.address.trim(), paymentMethod: form.paymentMethod })
      setOrder(data.order)
      setCheckoutOpen(false)
    } catch (error) {
      setOrderError(error.message || 'Could not place your order.')
    } finally {
      setPlacing(false)
    }
  }

  return <div className="min-h-screen bg-[#f7f6f2] text-[#20251f]"><header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8"><a className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight" href="/" aria-label="Spoon, home"><span className="brand-mark">S</span>spoon</a><div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-[#626960] shadow-sm"><span aria-hidden="true">⌖</span><span>Moscow</span><span className="hidden text-[#a2a69f] sm:inline">·</span><span className="hidden sm:inline">Delivery 25–40 min</span></div></header><main className="mx-auto w-full max-w-7xl px-5 pb-20 sm:px-8"><PromptHero query={prompt.query} loading={prompt.loading} onQueryChange={prompt.setQuery} onSubmit={prompt.submitPrompt} /><div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]"><FoodGrid error={prompt.error} items={items} selectedItem={selectedItem} onSelect={setSelectedItem} /><aside className="lg:sticky lg:top-6">{order ? <OrderStatus order={order} trackingError={trackingError} /> : <OrderSummary item={selectedItem} onCheckout={() => setCheckoutOpen(true)} />}</aside></div><footer className="mt-16 border-t border-[#e5e7e1] pt-5 text-center text-xs text-[#92978f]">spoon · Food delivery demo · Checkout and courier tracking are simulated</footer></main>{checkoutOpen && selectedItem && <CheckoutModal error={orderError} form={form} item={selectedItem} placing={placing} setForm={setForm} onClose={() => setCheckoutOpen(false)} onSubmit={submitOrder} />}</div>
}
