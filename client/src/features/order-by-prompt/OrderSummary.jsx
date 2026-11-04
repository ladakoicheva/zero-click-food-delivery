import { formatPrice } from '../../shared/lib/formatPrice'

export function OrderSummary({ item, onCheckout }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgba(41,54,39,0.06)] sm:p-6">
      <p className="section-kicker">Your pick</p>
      <h2 className="mt-1 font-display text-2xl font-semibold">The lunch plan</h2>
      {item ? (
        <>
          <div className="mt-5 flex items-start justify-between gap-3 border-b border-[#eceee9] pb-4">
            <div><p className="font-semibold leading-5">{item.name}</p><p className="mt-1 text-xs text-[#858b82]">{item.restaurant}</p></div>
            <span className="whitespace-nowrap text-sm font-semibold">{formatPrice(item.price)}</span>
          </div>
          <div className="flex justify-between py-4 text-sm text-[#777e74]"><span>Delivery</span><span className="font-medium text-[#456749]">Free</span></div>
          <div className="flex justify-between border-t border-[#eceee9] pt-4 font-semibold"><span>Total</span><span>{formatPrice(item.price)}</span></div>
          <button className="primary-button mt-5 w-full rounded-xl px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#38593c]" onClick={onCheckout} type="button">Continue to checkout <span className="ml-2" aria-hidden="true">→</span></button>
          <p className="mt-3 text-center text-xs leading-5 text-[#888e85]">Demo checkout won’t charge you</p>
        </>
      ) : (
        <div className="empty-order mt-5 rounded-xl px-5 py-7 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl">🥣</div>
          <p className="font-medium">Your order will show up here</p>
          <p className="mt-1 text-sm leading-5 text-[#81877d]">Choose a dish to see your total and head to checkout.</p>
        </div>
      )}
      <div className="mt-5 flex items-center gap-3 rounded-xl bg-[#f4f6f1] p-3.5"><span className="text-xl">🚲</span><div><p className="text-sm font-semibold">Fresh and on its way</p><p className="text-xs text-[#7f867c]">Order tracking included</p></div></div>
    </section>
  )
}
