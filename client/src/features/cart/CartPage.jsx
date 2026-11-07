import { CartIcon } from './CartIcon'

export function CartPage({ items, selectedItem, onBack, onRemove, onSelect, onCheckout }) {
  const total = items.reduce((sum, item) => sum + Number(item.price || 0), 0)

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-20 sm:px-8">
      <button className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#d9e1d5] bg-white px-4 py-2.5 text-sm font-semibold text-[#456b49] shadow-sm hover:bg-[#eef2eb]" onClick={onBack} type="button">
        <span aria-hidden="true">←</span> Back to menu
      </button>
      <div className="mx-auto max-w-3xl">
        <p className="section-kicker">Your selection</p>
        <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight">Shopping cart</h1>
        {!items.length ? (
          <div className="mt-8 rounded-3xl border border-[#e5e9e1] bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#eef2eb] text-[#456b49]"><CartIcon className="h-8 w-8" /></div>
            <h2 className="mt-5 font-display text-2xl font-semibold">Your cart is waiting</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#777e74]">Pick something delicious from the menu and it will appear here.</p>
            <button className="primary-button mt-6 rounded-xl px-5 py-3 text-sm font-semibold text-white hover:bg-[#38593c]" onClick={onBack} type="button">Explore the menu</button>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {items.map((item) => (
              <article className={`flex items-center justify-between gap-4 rounded-2xl border bg-white p-4 shadow-sm transition ${selectedItem?.id === item.id ? 'border-[#789576] ring-2 ring-[#e5eee2]' : 'border-[#e5e9e1]'}`} key={item.id}>
                <div>
                  <button className="text-left" onClick={() => onSelect(item)} type="button">
                    <p className="text-xs text-[#7d8378]">{item.restaurant}</p>
                    <h2 className="mt-1 font-display text-lg font-semibold">{item.name}</h2>
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <strong>${Number(item.price).toFixed(2)}</strong>
                  <button aria-label={`Remove ${item.name}`} className="rounded-full px-2 py-1 text-xl text-[#899187] hover:bg-[#fff1ed] hover:text-[#a04532]" onClick={() => onRemove(item.id)} type="button">×</button>
                </div>
              </article>
            ))}
            <div className="flex items-center justify-between rounded-2xl bg-[#e9eee2] p-5 text-lg font-semibold">
              <span>Total</span><span>${total.toFixed(2)}</span>
            </div>
            <button className="primary-button w-full rounded-xl px-5 py-3.5 text-sm font-semibold text-white hover:bg-[#38593c] disabled:cursor-not-allowed disabled:opacity-50" disabled={!selectedItem} onClick={onCheckout} type="button">
              {selectedItem ? `Checkout ${selectedItem.name}` : 'Select an item to checkout'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
