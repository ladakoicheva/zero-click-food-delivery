import { useDispatch, useSelector } from 'react-redux'
import { searchSuggestions, setPromptError, setQuery } from './promptSlice'

const DEMO_LOCATION = { lat: 50.4501, lng: 30.5234 }

export function useOrderPrompt() {
  const dispatch = useDispatch()
  const { query, suggestions, status, error } = useSelector((state) => state.prompt)

  function submitPrompt(event) {
    event.preventDefault()
    if (!query.trim()) {
      dispatch(setPromptError('Tell us what you’re craving and we’ll find something for you.'))
      return
    }

    dispatch(searchSuggestions({ query: query.trim(), ...DEMO_LOCATION }))
  }

  function updateQuery(value) {
    dispatch(setQuery(value))
  }

  return { query, setQuery: updateQuery, suggestions, status, loading: status === 'loading', error, submitPrompt }
}
