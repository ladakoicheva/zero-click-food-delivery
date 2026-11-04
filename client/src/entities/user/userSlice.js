import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  customerName: '',
  address: '',
  paymentMethod: 'on_delivery',
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateProfile: (state, action) => {
      Object.assign(state, action.payload)
    },
    setPaymentMethod: (state, action) => {
      state.paymentMethod = action.payload
    },
  },
})

export const { updateProfile, setPaymentMethod } = userSlice.actions
export default userSlice.reducer
