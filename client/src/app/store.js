import { configureStore } from '@reduxjs/toolkit'
import orderReducer from '../entities/order/orderSlice'
import promptReducer from '../features/order-by-prompt/promptSlice'
import userReducer from '../entities/user/userSlice'

export const store = configureStore({
  reducer: {
    order: orderReducer,
    prompt: promptReducer,
    user: userReducer,
  },
})
