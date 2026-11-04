import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { findSuggestions } from '../../shared/api/client'

export const searchSuggestions = createAsyncThunk('prompt/search', findSuggestions)

const initialState = {
  query: '',
  suggestions: [],
  status: 'idle',
  error: '',
}

const promptSlice = createSlice({
  name: 'prompt',
  initialState,
  reducers: {
    setQuery: (state, action) => {
      state.query = action.payload
    },
    setPromptError: (state, action) => {
      state.error = action.payload
    },
    clearPromptError: (state) => {
      state.error = ''
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchSuggestions.pending, (state) => {
        state.status = 'loading'
        state.error = ''
      })
      .addCase(searchSuggestions.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.suggestions = action.payload.items
        if (action.payload.items.length === 0) {
          state.error = 'No exact matches yet. Try describing what you’re craving another way.'
        }
      })
      .addCase(searchSuggestions.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message || 'Could not connect to the server.'
      })
  },
})

export const { setQuery, setPromptError, clearPromptError } = promptSlice.actions
export default promptSlice.reducer
