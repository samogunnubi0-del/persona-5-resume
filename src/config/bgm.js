/**
 * Set your exact BGM without code changes:
 *
 * 1) Open the YouTube video you want in a browser.
 * 2) Copy the 11-character id from the URL: youtube.com/watch?v=XXXXXXXXXXX
 * 3) Create a file named `.env` in the project root (same folder as package.json) with:
 *    VITE_BGM_YOUTUBE_ID=XXXXXXXXXXX
 *    VITE_BGM_LABEL=Whatever you want shown in the UI
 * 4) Restart `npm run dev` (Vite reads env at startup).
 *
 * I can’t ship Atlus/P5 audio files in this repo; streaming a video you choose is the reliable way.
 */
const rawId = import.meta.env.VITE_BGM_YOUTUBE_ID
const trimmed = typeof rawId === 'string' ? rawId.trim() : ''
const valid = /^[a-zA-Z0-9_-]{11}$/.test(trimmed)

const labelRaw = import.meta.env.VITE_BGM_LABEL
// Default: user’s chosen BGM (override with VITE_BGM_YOUTUBE_ID in .env)
const DEFAULT_BGM = '8pBEqSfXJ2Q'

const displayName =
  (typeof labelRaw === 'string' && labelRaw.trim()) || (valid ? 'Beneath the Mask' : 'Beneath the Mask')

export const P5_BGM = {
  youtubeVideoId: valid ? trimmed : DEFAULT_BGM,
  displayName
}
