export function createAuthFlows(sdk, auth) {
  return {
    async completeLink(email, url) {
      try {
        await sdk.signInWithEmailLink(auth, email, url)
        return null
      } catch (error) {
        if (error.code === 'auth/multi-factor-auth-required') return sdk.getMultiFactorResolver(auth, error)
        throw error
      }
    },
    async beginEnrollment(user) {
      const session = await sdk.multiFactor(user).getSession()
      return sdk.TotpMultiFactorGenerator.generateSecret(session)
    },
    async finishEnrollment(user, secret, code) {
      const assertion = sdk.TotpMultiFactorGenerator.assertionForEnrollment(secret, code)
      await sdk.multiFactor(user).enroll(assertion, 'Google Authenticator')
    },
    async completeSecondFactor(resolver, code) {
      const factor = resolver.hints.find((hint) => hint.factorId === sdk.TotpMultiFactorGenerator.FACTOR_ID)
      if (!factor) throw new Error('No supported Authenticator factor is enrolled.')
      const assertion = sdk.TotpMultiFactorGenerator.assertionForSignIn(factor.uid, code)
      await resolver.resolveSignIn(assertion)
    },
    hasTotp(user) {
      return sdk.multiFactor(user).enrolledFactors.some((factor) => factor.factorId === sdk.TotpMultiFactorGenerator.FACTOR_ID)
    },
  }
}
