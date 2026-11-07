import test from 'node:test'
import assert from 'node:assert/strict'
import { createAuthFlows } from '../src/features/auth/flows.js'

test('email link resolves an MFA challenge but propagates other failures', async () => {
  const challenge = { code: 'auth/multi-factor-auth-required' }
  const resolver = { hints: [] }
  let failure
  const sdk = {
    signInWithEmailLink: async (auth, email, url) => {
      assert.deepEqual([auth, email, url], ['auth', 'user@example.com', 'link'])
      if (failure) throw failure
    },
    getMultiFactorResolver: (auth, error) => {
      assert.equal(auth, 'auth')
      assert.equal(error, challenge)
      return resolver
    },
  }
  const flows = createAuthFlows(sdk, 'auth')
  assert.equal(await flows.completeLink('user@example.com', 'link'), null)
  failure = challenge
  assert.equal(await flows.completeLink('user@example.com', 'link'), resolver)
  failure = new Error('invalid link')
  await assert.rejects(flows.completeLink('user@example.com', 'link'), /invalid link/)
})

test('enrollment and sign-in use the Firebase TOTP factor and propagate errors', async () => {
  const user = {}
  const secret = {}
  const events = []
  const sdk = {
    multiFactor: (value) => {
      assert.equal(value, user)
      return {
        getSession: async () => 'session',
        enroll: async (assertion, name) => events.push([assertion, name]),
        enrolledFactors: [{ factorId: 'totp' }],
      }
    },
    TotpMultiFactorGenerator: {
      FACTOR_ID: 'totp',
      generateSecret: async (session) => { assert.equal(session, 'session'); return secret },
      assertionForEnrollment: (value, code) => { assert.equal(value, secret); return `enroll:${code}` },
      assertionForSignIn: (uid, code) => `signin:${uid}:${code}`,
    },
  }
  const flows = createAuthFlows(sdk, {})
  assert.equal(await flows.beginEnrollment(user), secret)
  await flows.finishEnrollment(user, secret, '123456')
  assert.deepEqual(events, [['enroll:123456', 'Google Authenticator']])
  assert.equal(flows.hasTotp(user), true)
  const resolver = { hints: [{ factorId: 'phone' }, { factorId: 'totp', uid: 'factor-id' }], resolveSignIn: async (assertion) => events.push(assertion) }
  await flows.completeSecondFactor(resolver, '654321')
  assert.equal(events[1], 'signin:factor-id:654321')
  await assert.rejects(flows.completeSecondFactor({ hints: [] }, '654321'), /No supported/)
  resolver.resolveSignIn = async () => { throw new Error('invalid code') }
  await assert.rejects(flows.completeSecondFactor(resolver, '000000'), /invalid code/)
})
