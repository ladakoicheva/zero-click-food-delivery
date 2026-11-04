import { useState } from 'react'
import { findSuggestions } from '../../shared/api/client'

export function useOrderPrompt() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submitPrompt(event) {
    event.preventDefault()
    if (!query.trim()) {
      setError('Tell us what you’re craving and we’ll find something for you.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const data = await findSuggestions(query.trim())
      setSuggestions(data.items)
      if (data.items.length === 0) setError('No exact matches yet. Try describing what you’re craving another way.')
    } catch (requestError) {
      setError(requestError.message || 'Could not connect to the server.')
    } finally {
      setLoading(false)
    }
  }

  return { query, setQuery, suggestions, loading, error, submitPrompt }
}
