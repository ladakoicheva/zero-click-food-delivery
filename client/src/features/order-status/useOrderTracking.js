import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { refreshOrder } from '../../entities/order/orderSlice'

export function useOrderTracking(order) {
  const dispatch = useDispatch()
  const trackingError = useSelector((state) => state.order.trackingError)

  useEffect(() => {
    if (!order?.trackingNumber) return undefined
    const intervalId = window.setInterval(() => {
      dispatch(refreshOrder(order.trackingNumber))
    }, 5000)
    return () => window.clearInterval(intervalId)
  }, [dispatch, order?.trackingNumber])

  return trackingError
}
