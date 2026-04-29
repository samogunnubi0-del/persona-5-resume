import { useEffect, useState } from 'react'

const BASE_LEVEL = 10
const REPO_MULTIPLIER = 2

/**
 * Dossier panel: fetches public GitHub profile, derives a mock RPG level from public repos.
 * @param {{ githubUsername?: string }} props — replace with your username
 */
export function GitHubDossier({ githubUsername = 'placeholder-username' }) {
  const [data, setData] = useState(null)
  const [err, setErr] = useState(false)

  useEffect(() => {
    if (!githubUsername || githubUsername === 'placeholder-username') {
      return
    }
    let cancel = false
    fetch(`https://api.github.com/users/${encodeURIComponent(githubUsername)}`, {
      headers: { Accept: 'application/vnd.github+json' }
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('fetch failed'))))
      .then((j) => {
        if (!cancel) setData(j)
      })
      .catch(() => {
        if (!cancel) setErr(true)
      })
    return () => {
      cancel = true
    }
  }, [githubUsername])

  const publicRepos = data?.public_repos ?? 0
  const level = BASE_LEVEL + publicRepos * REPO_MULTIPLIER
  // EXP bar: map repo count to 0–100 (caps at 100); adds mock “commit” weighting via followers
  const expPercent = Math.min(
    100,
    publicRepos * 4 + (data ? Math.min(20, (data.followers || 0) * 0.4) : 0)
  )

  if (err) {
    return (
      <div className="dossier-block kh-p5-textbox">
        <h3>Developer Dossier (GitHub)</h3>
        <p>
          Could not load public stats. Set <code>githubUsername</code> in App.
        </p>
      </div>
    )
  }

  if (!data && githubUsername === 'placeholder-username') {
    return (
      <div className="dossier-block kh-p5-textbox">
        <h3>Developer Dossier (GitHub)</h3>
        <p>
          Mission: Synchronize profile data. Link your GitHub username in <code>App.jsx</code> to reveal Proficiency LVL and Field EXP.
        </p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="dossier-block kh-p5-textbox">
        <h3>Developer Dossier (GitHub)</h3>
        <p>Syncing public dossier…</p>
      </div>
    )
  }

  return (
    <div className="dossier-block kh-p5-textbox">
      <h3>Developer Dossier (GitHub)</h3>
      <p>
        <strong>Coding Proficiency:</strong> LVL {level}
        <span className="dossier-sub">
          (base {BASE_LEVEL} + {publicRepos} public repos x {REPO_MULTIPLIER})
        </span>
      </p>
      <p className="dossier-line">
        <span className="dossier-label">@{data.login}</span> · {publicRepos} public repos
      </p>
      <p className="dossier-exp-title">Field EXP (profile signal)</p>
      <div
        className="exp-bar-outer"
        role="img"
        aria-label={`Experience ${Math.round(expPercent)} percent`}
      >
        <div
          className="exp-bar-inner"
          style={{ width: `${expPercent}%`, transition: 'width 1.1s ease-out' }}
        />
      </div>
    </div>
  )
}
