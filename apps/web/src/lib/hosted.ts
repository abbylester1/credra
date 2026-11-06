/**
 * True on the hosted demo (Vercel), where the CRE CLI is not installed and the same eligibility rules run inside the app.
 * Set NEXT_PUBLIC_HOSTED_DEMO=1 there. Used only to keep the wording honest: the hosted site never claims a CRE run.
 */
export const HOSTED_DEMO = process.env.NEXT_PUBLIC_HOSTED_DEMO === '1'

export const VERIFY_ENGINE_NOTE = 'Hosted demo: the same eligibility rules as the Chainlink CRE workflow run inside the app, because the CRE CLI is not installed on this host. The real CRE workflow simulation runs locally and is shown in the demo video and the repository.'
