import { useEffect, useState } from 'react'
import './App.css'

const QUICK_PROMPTS = ['Something spicy', 'A meat-free dinner', 'Pasta, please']
const STATUS_STEPS = [
  { key: 'placed', label: 'Order received', detail: 'The restaurant has received your order' },
  { key: 'cooking', label: 'Preparing', detail: 'The kitchen is preparing your meal' },
  { key: 'on_the_way', label: 'Courier on the way', detail: 'Your courier has picked up the order' },
  { key: 'delivered', label: 'Delivered', detail: 'Enjoy your meal!' },
]

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
}

function App() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [address, setAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('on_delivery')
  const [placingOrder, setPlacingOrder] = useState(false)
  const [order, setOrder] = useState(null)
  const [orderError, setOrderError] = useState('')
  const [trackingError, setTrackingError] = useState('')

  async function findFood(event) {
    event.preventDefault()
    if (!query.trim()) {
      setError('Tell us what you’re craving and we’ll find something for you.')
      return
    }

    setLoading(true)
    setError('')
    setSelectedItem(null)
    try {
      const response = await fetch(`/api/suggestions?q=${encodeURIComponent(query.trim())}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not find any dishes.')
      setSuggestions(data.items)
      if (data.items.length === 0) setError('No exact matches yet. Try describing what you’re craving another way.')
    } catch (requestError) {
      setError(requestError.message || 'Could not connect to the server.')
    } finally {
      setLoading(false)
    }
  }

  async function placeOrder(event) {
    event.preventDefault()
    if (!selectedItem) return

    setPlacingOrder(true)
    setOrderError('')
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: selectedItem.id,
          customerName: customerName.trim(),
          address: address.trim(),
          paymentMethod,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not place your order.')
      setOrder(data.order)
      setCheckoutOpen(false)
    } catch (requestError) {
      setOrderError(requestError.message || 'Could not place your order.')
    } finally {
      setPlacingOrder(false)
    }
  }

  useEffect(() => {
    if (!order?.trackingNumber) return undefined

    const refreshOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(order.trackingNumber)}`)
        if (!response.ok) throw new Error('Could not refresh order status.')
        const data = await response.json()
        setOrder(data.order)
        setTrackingError('')
      } catch {
        setTrackingError('Could not refresh the status. Showing the latest available update.')
      }
    }

    const intervalId = window.setInterval(refreshOrder, 5000)
    return () => window.clearInterval(intervalId)
  }, [order?.trackingNumber])

  const currentStep = STATUS_STEPS.findIndex((step) => step.key === order?.status)
  const orderHeading = {
    placed: 'Order received',
    cooking: 'Preparing your order',
    on_the_way: 'On the way',
    delivered: 'Delivered',
  }[order?.status] || 'Your order'
  const defaultItems = [
    { id: 'mushroom-pasta', name: 'Wild Mushroom Pasta', restaurant: 'The Cozy Table', description: 'Pappardelle, creamy sauce, aged parmesan', price: 14.9, rating: '4.9', time: '25–35 min', image: 'photo-1473093295043-cdd812d0e601', tag: 'Weekly favorite' },
    { id: 'green-bowl', name: 'Green Avocado Bowl', restaurant: 'Greenery', description: 'Avocado, quinoa, seasonal vegetables', price: 12.5, rating: '4.8', time: '20–30 min', image: 'photo-1512621776951-a57141f2eefd', tag: 'Light pick' },
    { id: 'salmon-rice', name: 'Salmon, Rice & Greens', restaurant: 'Sea Within', description: 'Oven-baked salmon with jasmine rice', price: 18.9, rating: '4.9', time: '30–40 min', image: 'photo-1467003909585-2f8a72700288', tag: 'Chef’s pick' },
    { id: 'tomato-soup', name: 'Tomato Basil Soup', restaurant: 'The Cozy Table', description: 'Tomatoes, cream, and crispy ciabatta', price: 9.5, rating: '4.7', time: '20–30 min', image: 'photo-1547592180-85f173990554', tag: 'Comfort classic' },
  ]

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-[#20251f]">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <a className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight" href="/" aria-label="Spoon, home">
          <span className="brand-mark">S</span>
          spoon
        </a>
        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-[#626960] shadow-sm">
          <span aria-hidden="true">⌖</span>
          <span>Moscow</span>
          <span className="hidden text-[#a2a69f] sm:inline">·</span>
          <span className="hidden sm:inline">Delivery 25–40 min</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-5 pb-20 sm:px-8">
        <section className="hero-panel relative mt-3 overflow-hidden rounded-[2rem] px-6 py-10 sm:px-12 sm:py-14">
          <div className="relative z-10 max-w-2xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#476c49]">Great food starts with a craving</p>
            <h1 className="font-display text-4xl font-semibold leading-[1.07] tracking-tight text-[#233126] sm:text-6xl">
              What sounds
              <br />
              <span className="serif-italic text-[#557958]">good today?</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[#596257] sm:text-lg">
              Tell us what you’re in the mood for. We’ll find the perfect bite.
            </p>
            <form className="mt-8 flex max-w-xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-[0_12px_40px_rgba(52,68,49,0.12)] sm:flex-row" onSubmit={findFood}>
              <label className="flex min-w-0 flex-1 items-center gap-3 px-3">
                <span aria-hidden="true" className="text-xl text-[#7d8d79]">✳</span>
                <input
                  aria-label="What would you like to eat?"
                  className="w-full border-0 bg-transparent py-3 text-base text-[#20251f] outline-none placeholder:text-[#9b9f98]"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Try a creamy mushroom pasta"
                  value={query}
                />
              </label>
              <button className="primary-button min-h-12 rounded-xl px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#38593c] disabled:cursor-wait disabled:opacity-70" disabled={loading} type="submit">
                {loading ? 'Finding…' : 'Find my food'}
                {!loading && <span className="ml-2" aria-hidden="true">↗</span>}
              </button>
            </form>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#737b71]">
              <span className="mr-1">Try:</span>
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  className="rounded-full border border-[#d9dfd6] bg-white/70 px-3 py-1.5 transition hover:border-[#8da38a] hover:bg-white"
                  key={prompt}
                  onClick={() => setQuery(prompt)}
                  type="button"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="hero-orbit" />
            <div className="hero-plate"><span className="plate-food">🥗</span></div>
            <span className="art-leaf leaf-one">✦</span>
            <span className="art-leaf leaf-two">✿</span>
            <span className="art-spark">✳</span>
          </div>
        </section>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section aria-live="polite">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="section-kicker">Picked for you</p>
                <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  {suggestions.length ? 'Here’s what we found' : 'Tasty ideas nearby'}
                </h2>
              </div>
              <span className="text-sm text-[#7b8178]">
                {suggestions.length ? `${suggestions.length} options` : 'A little chef inspiration'}
              </span>
            </div>

            {error && <p className="mb-4 rounded-xl bg-[#fff1ed] px-4 py-3 text-sm text-[#a04532]" role="alert">{error}</p>}
            {!suggestions.length && (
              <div className="mb-5 rounded-2xl border border-[#e7e8e2] bg-white px-5 py-4 text-sm leading-6 text-[#72796f]">
                Choose a dish you like, or tell us what you’re craving above — like “a filling chicken lunch.”
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {(suggestions.length ? suggestions : defaultItems).map((item) => (
                <article className={`food-card overflow-hidden rounded-2xl bg-white transition ${selectedItem?.id === item.id ? 'food-card-selected' : ''}`} key={item.id}>
                  <div className="food-photo-wrap">
                    <img alt="" className="food-photo" loading="lazy" src={`https://images.unsplash.com/${item.image}?auto=format&fit=crop&w=800&q=80`} />
                    <span className="food-tag">{item.tag}</span>
                    <span className="rating-badge">★ {item.rating}</span>
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-medium text-[#7d8378]">{item.restaurant} <span className="mx-1">·</span> {item.time}</p>
                    <h3 className="mt-1 font-display text-lg font-semibold leading-snug">{item.name}</h3>
                    <p className="mt-1 min-h-10 text-sm leading-5 text-[#777e74]">{item.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="font-semibold">{formatPrice(item.price)}</span>
                      <button
                        aria-pressed={selectedItem?.id === item.id}
                        className={`select-button rounded-full px-4 py-2 text-sm font-semibold transition ${selectedItem?.id === item.id ? 'bg-[#385c3e] text-white' : 'bg-[#eef2eb] text-[#456749] hover:bg-[#dfe8dc]'}`}
                        onClick={() => setSelectedItem(item)}
                        type="button"
                      >
                        {selectedItem?.id === item.id ? 'Selected ✓' : 'Choose'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="lg:sticky lg:top-6">
            {order ? (
              <section className="rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgba(41,54,39,0.06)] sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="section-kicker">Your order</p><h2 className="mt-1 font-display text-2xl font-semibold">{orderHeading}</h2></div>
                  <span className="status-live"><span /> Demo tracker</span>
                </div>
                <div className="mt-5 rounded-xl bg-[#f4f6f1] p-4">
                  <p className="text-xs text-[#7c8377]">Tracking number</p>
                  <p className="mt-1 font-mono text-lg font-bold tracking-wide">{order.trackingNumber}</p>
                </div>
                <p className="mt-4 font-medium">{order.item.name}</p>
                <p className="mt-1 text-sm text-[#777e74]">Delivering to: {order.address}</p>
                <div className="mt-6 space-y-0">
                  {STATUS_STEPS.map((step, index) => {
                    const complete = index <= currentStep
                    return (
                      <div className="status-step" key={step.key}>
                        <div className={`status-dot ${complete ? 'status-dot-complete' : ''}`}>{complete ? '✓' : ''}</div>
                        <div className="pb-5">
                          <p className={`text-sm font-semibold ${complete ? 'text-[#365a3b]' : 'text-[#a4aaa1]'}`}>{step.label}</p>
                          {index === currentStep && <p className="mt-1 text-xs leading-5 text-[#838a80]">{step.detail}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {order.status === 'on_the_way' && (
                  <div className="courier-card mt-1 flex items-center gap-3 rounded-xl p-3">
                    <div className="courier-avatar">🛵</div>
                    <div className="flex-1"><p className="text-sm font-semibold">Alex · your courier</p><p className="text-xs text-[#7d8378]">Demo ride · status updates automatically</p></div>
                    <span className="text-sm font-semibold">4.9 ★</span>
                  </div>
                )}
                <p className="mt-4 border-t border-[#eceee9] pt-4 text-center text-xs leading-5 text-[#888e85]">
                  Courier updates are simulated and don’t reflect a real delivery.
                </p>
                {trackingError && <p className="mt-3 text-center text-xs text-[#a04532]" role="status">{trackingError}</p>}
              </section>
            ) : (
              <section className="rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgba(41,54,39,0.06)] sm:p-6">
                <p className="section-kicker">Your pick</p>
                <h2 className="mt-1 font-display text-2xl font-semibold">The lunch plan</h2>
                {selectedItem ? (
                  <>
                    <div className="mt-5 flex items-start justify-between gap-3 border-b border-[#eceee9] pb-4">
                      <div><p className="font-semibold leading-5">{selectedItem.name}</p><p className="mt-1 text-xs text-[#858b82]">{selectedItem.restaurant}</p></div>
                      <span className="whitespace-nowrap text-sm font-semibold">{formatPrice(selectedItem.price)}</span>
                    </div>
                    <div className="flex justify-between py-4 text-sm text-[#777e74]"><span>Delivery</span><span className="font-medium text-[#456749]">Free</span></div>
                    <div className="flex justify-between border-t border-[#eceee9] pt-4 font-semibold"><span>Total</span><span>{formatPrice(selectedItem.price)}</span></div>
                    <button className="primary-button mt-5 w-full rounded-xl px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#38593c]" onClick={() => setCheckoutOpen(true)} type="button">
                      Continue to checkout <span className="ml-2" aria-hidden="true">→</span>
                    </button>
                    <p className="mt-3 text-center text-xs leading-5 text-[#888e85]">Demo checkout won’t charge you</p>
                  </>
                ) : (
                  <div className="empty-order mt-5 rounded-xl px-5 py-7 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl">🥣</div>
                    <p className="font-medium">Your order will show up here</p>
                    <p className="mt-1 text-sm leading-5 text-[#81877d]">Choose a dish to see your total and head to checkout.</p>
                  </div>
                )}
                <div className="mt-5 flex items-center gap-3 rounded-xl bg-[#f4f6f1] p-3.5">
                  <span className="text-xl">🚲</span>
                  <div><p className="text-sm font-semibold">Fresh and on its way</p><p className="text-xs text-[#7f867c]">Order tracking included</p></div>
                </div>
              </section>
            )}
          </aside>
        </div>
        <footer className="mt-16 border-t border-[#e5e7e1] pt-5 text-center text-xs text-[#92978f]">
          spoon · Food delivery demo · Checkout and courier tracking are simulated
        </footer>
      </main>

      {checkoutOpen && selectedItem && (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setCheckoutOpen(false)
        }}>
          <section aria-labelledby="checkout-title" aria-modal="true" className="checkout-modal" role="dialog">
            <button aria-label="Close" className="modal-close" onClick={() => setCheckoutOpen(false)} type="button">×</button>
            <p className="section-kicker">Just one more step</p>
            <h2 className="mt-1 font-display text-3xl font-semibold" id="checkout-title">Where should we deliver?</h2>
            <p className="mt-2 text-sm text-[#777e74]">{selectedItem.name} · {formatPrice(selectedItem.price)}</p>
            <form className="mt-6 space-y-4" onSubmit={placeOrder}>
              <label className="form-field"><span>Your name</span><input autoComplete="name" minLength="2" onChange={(event) => setCustomerName(event.target.value)} placeholder="How should we address you?" required value={customerName} /></label>
              <label className="form-field"><span>Delivery address</span><input autoComplete="street-address" minLength="5" onChange={(event) => setAddress(event.target.value)} placeholder="Street, building, apartment" required value={address} /></label>
              <fieldset>
                <legend className="mb-2 text-sm font-semibold">Payment method</legend>
                <label className={`payment-option ${paymentMethod === 'on_delivery' ? 'payment-option-active' : ''}`}>
                  <input checked={paymentMethod === 'on_delivery'} name="payment" onChange={() => setPaymentMethod('on_delivery')} type="radio" />
                  <span><strong>Pay on delivery</strong><small>Pay your courier · demo only</small></span><span className="ml-auto">💵</span>
                </label>
                <label className={`payment-option mt-2 ${paymentMethod === 'demo_card' ? 'payment-option-active' : ''}`}>
                  <input checked={paymentMethod === 'demo_card'} name="payment" onChange={() => setPaymentMethod('demo_card')} type="radio" />
                  <span><strong>Demo card payment</strong><small>Simulation only · no charge</small></span><span className="ml-auto">💳</span>
                </label>
                <p className="mt-2 text-xs leading-5 text-[#858b82]">Don’t enter card details: real payments aren’t enabled.</p>
              </fieldset>
              {orderError && <p className="rounded-lg bg-[#fff1ed] px-3 py-2 text-sm text-[#a04532]" role="alert">{orderError}</p>}
              <button className="primary-button w-full rounded-xl px-5 py-3.5 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-70" disabled={placingOrder} type="submit">
                {placingOrder ? 'Placing order…' : `Place order · ${formatPrice(selectedItem.price)}`}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
