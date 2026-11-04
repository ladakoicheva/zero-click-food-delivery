import { useEffect, useState } from 'react'
import { getOrder } from '../../shared/api/client'

export function useOrderTracking(order, setOrder) {
  const [trackingError, setTrackingError] = useState('')

  useEffect(() => {
    if (!order?.trackingNumber) return undefined
    const refreshOrder = async () => {
      try {
        const data = await getOrder(order.trackingNumber)
        setOrder(data.order)
        setTrackingError('')
      } catch {
        setTrackingError('Could not refresh the status. Showing the latest available update.')
      }
    }
    const intervalId = window.setInterval(refreshOrder, 5000)
    return () => window.clearInterval(intervalId)
  }, [order?.trackingNumber, setOrder])

  return trackingError
}
