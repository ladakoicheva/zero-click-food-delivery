import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { QRCodeSVG } from 'qrcode.react'
import {
  auth, beginEnrollment, completeLink, completeSecondFactor, emailStorageKey,
  finishEnrollment, hasTotp, isEmailLink, logout, sendLink,
} from './firebase'

function message(error) {
  switch (error.code) {
    case 'auth/invalid-email': return 'Enter a valid email address.'
    case 'auth/invalid-action-code': return 'The email link is invalid or has expired. Request a new link.'
    case 'auth/invalid-verification-code': return 'The Authenticator code is invalid. Try the current code.'
    case 'auth/too-many-requests': return 'Too many attempts. Try again later.'
    case 'auth/requires-recent-login': return 'Your sign-in has expired. Sign out and request a new email link.'
    case 'auth/unauthorized-domain': return 'This site is not an authorized Firebase domain.'
    default: return error.message || 'Authentication failed. Please try again.'
  }
}

export function Account() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(auth))
  const [link, setLink] = useState(() => isEmailLink(window.location.href) ? window.location.href : '')
  const [open, setOpen] = useState(() => isEmailLink(window.location.href))
  const [email, setEmail] = useState(() => window.localStorage.getItem(emailStorageKey) || '')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [secret, setSecret] = useState(null)
  const [resolver, setResolver] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [enrolled, setEnrolled] = useState(false)

  useEffect(() => {
    if (!auth) return
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setEnrolled(nextUser ? hasTotp(nextUser) : false)
      setLoading(false)
    }, () => {
      setError('Could not restore the sign-in session.')
      setLoading(false)
      setOpen(true)
    })
  }, [])

  async function run(action) {
    setBusy(true)
    setError('')
    try { await action() } catch (failure) { setError(message(failure)) } finally { setBusy(false) }
  }

  function clearLink() {
    window.localStorage.removeItem(emailStorageKey)
    window.history.replaceState(window.history.state, '', window.location.pathname)
    setLink('')
  }

  async function submit(event) {
    event.preventDefault()
    await run(async () => {
      if (resolver) {
        await completeSecondFactor(resolver, code)
        setResolver(null)
        setCode('')
        setOpen(false)
      } else if (secret && user) {
        await finishEnrollment(user, secret, code)
        setEnrolled(hasTotp(user))
        setSecret(null)
        setCode('')
        setOpen(false)
      } else if (link) {
        const nextResolver = await completeLink(email.trim(), link)
        clearLink()
        if (nextResolver) setResolver(nextResolver)
      } else {
        await sendLink(email.trim())
        setSent(true)
      }
    })
  }

  async function signOut() {
    await run(async () => {
      await logout()
      setSecret(null)
      setResolver(null)
      setCode('')
      setSent(false)
      setOpen(false)
    })
  }

  const signedIn = user && enrolled && !link && !resolver
  return <div className="relative">
    <button type="button" onClick={() => setOpen(!open)} className="rounded-full bg-white px-4 py-2 text-sm shadow-sm" aria-expanded={open}>
      {signedIn ? user.email : 'Sign in'}
    </button>
    {open && <div className="absolute right-0 z-30 mt-2 w-80 max-w-[90vw] rounded-2xl bg-white p-4 shadow-xl">
      {!auth ? <p role="alert" className="text-sm">Firebase sign-in is not configured.</p>
        : loading ? <p className="text-sm">Checking sign-in…</p>
          : signedIn ? <div>
            <p className="break-all text-sm">Signed in as {user.email}</p>
            <button type="button" disabled={busy} onClick={signOut} className="mt-3 rounded-lg bg-[#20251f] px-4 py-2 text-sm text-white">Sign out</button>
          </div> : user && !link && !resolver && !secret ? <div className="space-y-3">
            <h2 className="font-semibold">Set up Google Authenticator</h2>
            <p className="text-sm">Your email is verified. Set up Authenticator to finish sign-in.</p>
            <button type="button" disabled={busy} onClick={() => run(async () => setSecret(await beginEnrollment(user)))} className="w-full rounded-lg bg-[#20251f] px-4 py-2 text-sm text-white">Set up Authenticator</button>
            <button type="button" disabled={busy} onClick={signOut} className="text-sm underline">Sign out</button>
          </div> : <form onSubmit={submit} className="space-y-3">
            <h2 className="font-semibold">{secret ? 'Set up Google Authenticator' : resolver ? 'Enter Authenticator code' : 'Sign in'}</h2>
            {secret && <>
              <p className="text-sm">Scan this QR code in Google Authenticator, or enter the key manually.</p>
              <QRCodeSVG value={secret.generateQrCodeUrl(user.email, 'Spoon')} size={180} />
              <p className="break-all text-sm">Key: {secret.secretKey}</p>
            </>}
            {secret || resolver ? <label className="block text-sm">Authenticator code
              <input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" value={code} onChange={(event) => setCode(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 p-2" />
            </label> : <>
              <label className="block text-sm">{link ? 'Confirm the email used to request the link' : 'Email'}
                <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 p-2" />
              </label>
              {sent && <p role="status" className="text-sm">Check your email and open the sign-in link.</p>}
            </>}
            <button type="submit" disabled={busy} className="w-full rounded-lg bg-[#20251f] px-4 py-2 text-sm text-white">
              {busy ? 'Please wait…' : secret || resolver ? 'Verify code' : link ? 'Continue' : sent ? 'Send another link' : 'Send sign-in link'}
            </button>
            {link && <button type="button" disabled={busy} onClick={() => { clearLink(); setSent(false); setError('') }} className="text-sm underline">Request a new link</button>}
            {secret && <button type="button" disabled={busy} onClick={() => { setSecret(null); setCode(''); setError('') }} className="text-sm underline">Start setup again</button>}
          </form>}
      {error && <p role="alert" className="mt-3 break-words text-sm text-red-700">{error}</p>}
    </div>}
  </div>
}
