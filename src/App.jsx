import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createSceneController } from './scene'
import { noopSceneController } from './sceneNoop.js'
import { initOverlayUI } from './overlayUI'
import { DiveMenuProvider, DiveCommandLink } from './context/DiveMenuContext'
import { KeyholeIcon } from './components/KeyholeIcon'
import { KingdomCrownIcon } from './components/KingdomCrownIcon'
import { CallingCardContact } from './components/CallingCardContact'
import { GitHubDossier } from './components/GitHubDossier'

const HERO_RANSOM = 'SAMUEL OGUNNUBI'
const GITHUB_USER = 'placeholder-username'

function populateRansom(id, text) {
  const container = document.getElementById(id)
  if (!container) return
  container.innerHTML = ''
  text.split('').forEach((char) => {
    if (char === ' ') {
      const space = document.createElement('div')
      space.style.width = '40px'
      container.appendChild(space)
      return
    }
    const letter = document.createElement('div')
    letter.className = 'ransom-letter'
    letter.textContent = char
    const rot = `${Math.random() * 16 - 8}deg`
    letter.style.setProperty('--rot', rot)
    container.appendChild(letter)
  })
}

export default function App() {
  const sceneRef = useRef(null)
  const audioRef = useRef(null)
  /** True by default: do not block the page on GSAP/WebGL; index.html also force-dismisses #p5-loader. */
  const [introComplete, setIntroComplete] = useState(true)
  const [sceneReady, setSceneReady] = useState(false)
  const mainRef = useRef(null)
  const [cardOpen, setCardOpen] = useState(false)
  const [isShattering, setIsShattering] = useState(false)

  useLayoutEffect(() => {
    const canvas = document.getElementById('bg-canvas')
    if (!canvas) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let sc = null
    try {
      sc = createSceneController(canvas, { reducedMotion: reduced })
      sceneRef.current = sc
      setSceneReady(true)
    } catch {
      setSceneReady(false)
    }
    // Must always run: click handlers, BGM, cards — if WebGL failed, use a no-op scene.
    initOverlayUI(sc ?? noopSceneController)

    // SAFETY: Force-dismiss the loader after a short delay if it's still there
    const loaderTimer = setTimeout(() => {
      const loader = document.getElementById('p5-loader')
      if (loader) {
        loader.classList.add('hidden')
        loader.style.display = 'none'
      }
    }, 2000)

    return () => {
      clearTimeout(loaderTimer)
      if (sc) {
        sc.dispose()
      }
      sceneRef.current = null
      setSceneReady(false)
    }
  }, [])

  useEffect(() => {
    const a = audioRef.current
    if (a) {
      a.volume = 0.1
    }
  }, [])

  useEffect(() => {
    if (!introComplete) {
      return
    }
    populateRansom('hero-ransom', HERO_RANSOM)
  }, [introComplete])

  useEffect(() => {
    if (!introComplete) return
    if (!sceneReady || !sceneRef.current) return
    const sc = sceneRef.current
    const onMove = (e) => {
      sc.setMouse(e.clientX, e.clientY)
      const cursor = document.getElementById('custom-cursor')
      if (cursor) {
        cursor.style.left = `${e.clientX - 10}px`
        cursor.style.top = `${e.clientY - 10}px`
      }
    }
    const onScroll = () => {
      const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight)
      sc.setScrollProgress(window.scrollY / maxScroll)
    }
    onScroll()
    window.addEventListener('mousemove', onMove)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', sc.onResize)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('scroll', onScroll)
    }
  }, [introComplete, sceneReady])

  const triggerCallingCard = () => {
    if (isShattering) return
    setIsShattering(true)
    
    // Trigger 3D shatter
    if (sceneRef.current) {
      sceneRef.current.triggerShatter(3.5)
      sceneRef.current.triggerKeyholeTransition()
    }

    // After animation, show modal
    setTimeout(() => {
      setCardOpen(true)
      setIsShattering(false)
    }, 600)
  }

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const awakening = document.getElementById('awakening-strike')
    if (!awakening) return
    const t1 = window.setTimeout(() => awakening.classList.add('active'), 580)
    const t2 = window.setTimeout(() => awakening.classList.remove('active'), 1120)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [])

  return (
    <DiveMenuProvider>
      <main id="app" className="app-main-root" ref={mainRef}>
        <section className="p5-section hero" id="top">
          <div className="stained-ring" />
          <div className="keyblade-decor keyblade-left" aria-hidden="true">✦╪✦</div>
          <div className="keyblade-decor keyblade-right" aria-hidden="true">✦╪✦</div>
          <div className="hero-crown-row">
            <KingdomCrownIcon className="alert-crown" />
            <p className="alert-chip">Student Access // Granted</p>
          </div>
          <div className="ransom-container" id="hero-ransom" />
          <p className="hero-subtitle">11th Grade Student & Aspiring Developer</p>
          <p className="hero-summary">
            Hey! I'm an 11th grader who loves building cool apps and websites. 
            I'm always learning new things and trying to make my projects 
            look awesome. This is my digital resume.
          </p>
          <div className="hero-actions">
            <DiveCommandLink className="p5-btn command" href="#about">Learn More</DiveCommandLink>
          </div>
          <div className="contact-row">
            <span>[Location Syncing...]</span>
            <span>[Contact Secure]</span>
            <span>[Email Encrypted]</span>
          </div>
        </section>

        <section className="p5-section kh-p5-textbox" id="about">
          <h2 className="section-title">About Me</h2>
          <div className="split-panel">
            <article className="portrait-panel kh-p5-textbox">
              <div className="portrait-plate">
                <h3 className="portrait-name">Samuel // Student Developer</h3>
                <p>
                  Builder in training. Refining cybersecurity discipline, leadership, and systems
                  thinking through high-impact initiatives.
                </p>
              </div>
            </article>
            <article className="status-panel kh-p5-textbox">
              <h3>RPG Status Screen</h3>
              <ul>
                <li><strong>Program:</strong> [Data Encrypted]</li>
                <li><strong>Status:</strong> Initializing...</li>
                <li><strong>Drive Form:</strong> [Locked]</li>
                <li><strong>Current Quest:</strong> Leveling up skills...</li>
              </ul>
            </article>
          </div>
          <GitHubDossier githubUsername={GITHUB_USER} />
        </section>

        <section className="p5-section kh-p5-textbox" id="projects">
          <h2 className="section-title">Worlds / Palaces</h2>
          <div className="worlds-wrap">
            <button className="carousel-btn" id="world-prev" type="button" aria-label="Previous project">◀</button>
            <div className="worlds-carousel" id="worlds-carousel">
              <article className="world-card kh-p5-textbox active" data-world="impact-sync">
                <div className="lock-state">
                  <div className="kh-keyhole-wrap">
                    <KeyholeIcon />
                  </div>
                  <div className="mini-keyblade">✦╪</div>
                </div>
                <div className="world-details">
                  <span className="tag">Target World</span>
                  <h3>Impact Sync</h3>
                  <p className="meta">Student SSL tracking mobile platform</p>
                  <p>Keyhole-framed project with secure data workflows and progress analytics.</p>
                  <p><strong>Equipped Magic/Tech:</strong> Firebase, Supabase, React Native</p>
                  <div className="world-links">
                    <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
                    <a href="https://github.com" target="_blank" rel="noreferrer">Live Demo</a>
                  </div>
                </div>
              </article>
              <article className="world-card kh-p5-textbox" data-world="security-labs">
                <div className="lock-state">
                  <div className="kh-keyhole-wrap">
                    <KeyholeIcon />
                  </div>
                  <div className="mini-keyblade">✦╪</div>
                </div>
                <div className="world-details">
                  <span className="tag">Palace Mission</span>
                  <h3>Security Lab Protocols</h3>
                  <p className="meta">Virtualized cyber defense environment</p>
                  <p>Network scans, exploit simulation, and layered defense hardening workflows.</p>
                  <p><strong>Equipped Magic/Tech:</strong> Kali, Wireshark, Linux</p>
                  <div className="world-links">
                    <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
                  </div>
                </div>
              </article>
              <article className="world-card kh-p5-textbox" data-world="cad-engineering">
                <div className="lock-state">
                  <div className="kh-keyhole-wrap">
                    <KeyholeIcon />
                  </div>
                  <div className="mini-keyblade">✦╪</div>
                </div>
                <div className="world-details">
                  <span className="tag">World Archive</span>
                  <h3>CAD Engineering Research</h3>
                  <p className="meta">PLTW mechanical design analysis</p>
                  <p>Precision modeling and discrepancy correction for reliable mechanical systems.</p>
                  <p><strong>Equipped Magic/Tech:</strong> Autodesk, SolidWorks</p>
                  <div className="world-links">
                    <a href="https://github.com" target="_blank" rel="noreferrer">Portfolio</a>
                  </div>
                </div>
              </article>
            </div>
            <button className="carousel-btn" id="world-next" type="button" aria-label="Next project">▶</button>
          </div>
        </section>

        <section className="p5-section kh-p5-textbox" id="resume">
          <h2 className="section-title">My Experience</h2>
          <article className="exp-card kh-p5-textbox">
            <span className="tag">NOTHING HERE YET</span>
            <h3>Working on my history...</h3>
            <p className="meta">Scanning for past experiences</p>
            <ul>
              <li>Data sync in progress. Check back after next palace infiltration.</li>
            </ul>
          </article>
        </section>

        <section className="p5-section kh-p5-textbox" id="education">
          <h2 className="section-title">Education</h2>
          <article className="exp-card kh-p5-textbox">
            <span className="tag">EDUCATION SYNC</span>
            <h3>World Archive Locked</h3>
            <p className="meta">Education data pending...</p>
            <p>Relevant knowledge modules will be displayed here soon.</p>
          </article>
        </section>

        <section className="p5-section kh-p5-textbox" id="skills">
          <h2 className="section-title">My Projects</h2>
          <div className="armory-grid">
            <article className="armory-card kh-p5-textbox">
              <h3>Coding Languages</h3>
              <ul>
                <li>Python</li>
                <li>Java</li>
                <li>SQL Foundations</li>
              </ul>
            </article>
            <article className="armory-card kh-p5-textbox">
              <h3>My Tools</h3>
              <ul>
                <li>Supabase</li>
                <li>Firebase</li>
                <li>CAD Toolchain</li>
              </ul>
            </article>
            <article className="armory-card unlock kh-p5-textbox">
              <h3>Certifications</h3>
              <ul>
                <li>[Analyzing Certifications...]</li>
              </ul>
            </article>
          </div>
          <div className="skills-grid">
            <div className="ransom-letter" style={{ ['--rot']: '-4deg' }}>Python</div>
            <div className="ransom-letter" style={{ ['--rot']: '5deg' }}>Java</div>
            <div className="ransom-letter" style={{ ['--rot']: '-8deg' }}>CAD</div>
            <div className="ransom-letter" style={{ ['--rot']: '6deg' }}>Network Security</div>
            <div className="ransom-letter" style={{ ['--rot']: '-3deg' }}>Structural Analysis</div>
            <div className="ransom-letter" style={{ ['--rot']: '7deg' }}>Leadership</div>
          </div>
          <div className="meta-block">
            <p><strong>Certifications:</strong> [Data Pending...]</p>
            <p><strong>Activities:</strong> [Quest List Syncing...]</p>
          </div>
        </section>

        <section className="p5-section final-card kh-p5-textbox" id="mission">
          <h2 className="section-title">My Goal</h2>
          <article className="exp-card kh-p5-textbox">
            <p>
              I want to learn as much as I can about technology and security. I'm a hard worker
              and I'm ready to help out on any team.
            </p>
          </article>
        </section>

        <section className="p5-section kh-p5-textbox" id="contact">
          <h2 className="section-title">Connect</h2>
          <CallingCardContact />
        </section>

        {/* TAKE YOUR HEART TRIGGER */}
        <button 
          className={`calling-card-trigger ${isShattering ? 'shattering' : ''}`}
          onClick={triggerCallingCard}
          aria-label="Send Calling Card"
        >
          <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
        </button>

        {/* CALLING CARD MODAL */}
        <div className={`calling-card-modal ${cardOpen ? 'active' : ''}`}>
          <div className="calling-card-overlay" onClick={() => setCardOpen(false)} />
          <div className="calling-card-content">
            <h2 className="calling-card-title">Calling Card</h2>
            <div className="calling-card-msg">
              <p>TARGET ACQUIRED: THE FUTURE.</p>
              <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>
                I'm coming for that internship! My skills are maxed out and my heart is set on building the next big thing.
              </p>
              <p style={{ marginTop: '1rem', fontStyle: 'italic', fontSize: '0.9rem' }}>
                — Samuel, The Student Developer
              </p>
            </div>
            <button className="calling-card-close" onClick={() => setCardOpen(false)}>MISSION COMPLETE</button>
          </div>
        </div>
      </main>

      <nav id="battle-nav" aria-label="Top quick navigation (command)">
        <a href="#top">HOME</a>
        <DiveCommandLink href="#about">ABOUT</DiveCommandLink>
        <a href="#projects">PROJECTS</a>
        <DiveCommandLink href="#resume">RESUME</DiveCommandLink>
        <a href="#skills">ARMORY</a>
      </nav>

      <nav id="battle-nav-mobile">
        <DiveCommandLink href="#resume">EXP</DiveCommandLink>
        <a href="#education">EDU</a>
        <a href="#skills">SKILLS</a>
      </nav>

      <aside id="p5-audio">
        <KingdomCrownIcon className="audio-crown" />
        <button className="music-toggle" id="play-btn" type="button" aria-label="Toggle background music">
          <span id="play-icon">▶</span>
        </button>
        <p id="track-label">BGM (YouTube) — use ▶</p>
        <button id="theme-flip" type="button" aria-label="Toggle high contrast mode">Style Shift</button>
      </aside>
      <audio
        id="bgm-audio"
        ref={audioRef}
        preload="auto"
        loop
        src="/beneath-the-mask-instrumental.mp3"
      />
      <div className="audio-notification" id="audio-notification" aria-live="polite">
        <div className="track-info">
          <span className="p5-text">NOW PLAYING</span>
          <span className="kh-text">Beneath the Mask</span>
        </div>
        <div className="cd-container">
          <svg className="vinyl-cd" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="45" fill="#222" stroke="#444" strokeWidth="2" />
            <circle cx="50" cy="50" r="15" fill="#E60012" />
            <circle cx="50" cy="50" r="5" fill="#111" />
          </svg>
        </div>
      </div>
    </DiveMenuProvider>
  )
}
