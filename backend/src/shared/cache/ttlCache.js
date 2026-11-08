export class TtlCache {
  constructor(ttlMs, now = () => Date.now()) {
    if (!Number.isFinite(ttlMs) || ttlMs <= 0) throw new Error('TTL must be a positive number.')
    this.ttlMs = ttlMs
    this.now = now
    this.entries = new Map()
  }

  get(key) {
    const entry = this.entries.get(key)
    if (!entry) return undefined
    if (entry.expiresAt <= this.now()) {
      this.entries.delete(key)
      return undefined
    }
    return entry.value
  }

  set(key, value) {
    this.entries.set(key, { value, expiresAt: this.now() + this.ttlMs })
    return value
  }

  clear() {
    this.entries.clear()
  }
}
