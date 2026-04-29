import { P5_BGM } from './config/bgm.js'

const MAX_YT_VOLUME = 18
const FADE_YT_STEP = 1
const MAX_LOCAL_VOLUME = 0.35
const FADE_LOCAL_STEP = 0.02
const FADE_MS = 100

let lastScene = null

/**
 * BGM: YouTube (your chosen video id from .env) with quiet local emergency fallback.
 */
export function initOverlayUI(sceneController) {
  lastScene = sceneController
  const playBtn = document.getElementById('play-btn')
  if (playBtn && playBtn.dataset.p5Bgm === '1') {
    return
  }
  const playIcon = document.getElementById('play-icon')
  const trackLabel = document.getElementById('track-label')
  const themeFlipBtn = document.getElementById('theme-flip')
  const audioNotification = document.getElementById('audio-notification')
  const audioUnlockOverlay = document.getElementById('audio-unlock-overlay')
  const audioUnlockBtn = document.getElementById('audio-unlock-btn')
  const cursor = document.getElementById('custom-cursor')
  const carousel = document.getElementById('worlds-carousel')
  const prevBtn = document.getElementById('world-prev')
  const nextBtn = document.getElementById('world-next')
  const worldCards = [...document.querySelectorAll('.world-card')]
  const fallbackAudio = document.getElementById('bgm-audio')
  const keyholeTransition = document.getElementById('keyhole-transition')

  let player
  let musicReady = false
  let fallbackReady = false
  let activeWorld = 0
  let notifTimeout
  let fadeTimer
  let audioUnlocked = false
  let audioCtx
  let pendingStart = false
  let playerCreated = false
  let useLocalFallback = false
  try {
    if (localStorage.getItem('p5-audio-ok') === '1' && audioUnlockOverlay) {
      audioUnlocked = true
      audioUnlockOverlay.classList.add('hidden')
      audioUnlockOverlay.setAttribute('aria-hidden', 'true')
      audioUnlockOverlay.style.cssText =
        'display:none!important;visibility:hidden!important;pointer-events:none!important;z-index:0;'
    }
  } catch {
    // Private mode / no localStorage
  }

  if (trackLabel) {
    trackLabel.textContent = `Ready: ${P5_BGM.displayName} (set .env to change) — use ▶`
  }

  if (fallbackAudio) {
    fallbackAudio.addEventListener('canplaythrough', () => {
      fallbackReady = true
    })
    fallbackAudio.addEventListener('error', () => {
      fallbackReady = false
    })
  }

  function clearFade() {
    if (fadeTimer) {
      clearInterval(fadeTimer)
      fadeTimer = undefined
    }
  }

  function silenceLocal() {
    if (!fallbackAudio) return
    try {
      fallbackAudio.pause()
      fallbackAudio.volume = 0
    } catch {
      // Ignore.
    }
  }

  function silenceYoutube() {
    if (!player) return
    try {
      player.pauseVideo()
      player.setVolume(0)
    } catch {
      // Ignore.
    }
  }

  function isYoutubePlaying() {
    if (!player || !window.YT) return false
    try {
      return player.getPlayerState() === window.YT.PlayerState.PLAYING
    } catch {
      return false
    }
  }

  function isLocalPlaying() {
    return !!(fallbackAudio && !fallbackAudio.paused)
  }

  function isBgmPlaying() {
    return isYoutubePlaying() || isLocalPlaying()
  }

  function setPausedUi() {
    if (playIcon) {
      playIcon.textContent = '▶'
    }
    if (playBtn) {
      playBtn.classList.remove('is-playing')
    }
    if (trackLabel) {
      trackLabel.textContent = 'BGM paused'
    }
  }

  function pauseAll() {
    clearFade()
    silenceLocal()
    silenceYoutube()
    setPausedUi()
  }

  const createPlayer = () => {
    if (playerCreated || !window.YT || !window.YT.Player) return
    const mount = document.getElementById('player')
    if (!mount) {
      if (trackLabel) {
        trackLabel.textContent = 'Missing #player — check index.html'
      }
      return
    }
    const vid = P5_BGM.youtubeVideoId
    let yt = null
    try {
      yt = new window.YT.Player('player', {
        height: '1',
        width: '1',
        videoId: vid,
          playerVars: {
            playsinline: 1,
            enablejsapi: 1,
            autoplay: 0,
            controls: 0,
            rel: 0,
            loop: 1,
            playlist: vid,
            origin: window.location.origin
          },
        events: {
          onReady: (event) => {
            musicReady = true
            useLocalFallback = false
            try {
              event.target.mute()
              event.target.setVolume(0)
              event.target.setPlaybackRate(1)
            } catch {
              // Ignore.
            }
            if (trackLabel) {
              trackLabel.textContent = `${P5_BGM.displayName} — use ▶`
            }
            if (pendingStart && audioUnlocked) {
              pendingStart = false
              playMusicWithFade()
            }
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              if (playIcon) {
                playIcon.textContent = '❚❚'
              }
              if (playBtn) {
                playBtn.classList.add('is-playing')
              }
              if (trackLabel) {
                trackLabel.textContent = `Now playing: ${P5_BGM.displayName}`
              }
              try {
                event.target.unMute()
              } catch {
                // Ignore.
              }
            } else if (
              event.data === window.YT.PlayerState.PAUSED ||
              event.data === window.YT.PlayerState.ENDED
            ) {
              if (playIcon) {
                playIcon.textContent = '▶'
              }
              if (playBtn) {
                playBtn.classList.remove('is-playing')
              }
              if (trackLabel && !isBgmPlaying()) {
                trackLabel.textContent = 'BGM paused'
              }
            }
          },
          onError: () => {
            useLocalFallback = true
            if (trackLabel) {
              trackLabel.textContent = 'Using high-quality local audio'
            }
          }
        }
      })
    } catch (err) {
      console.error('[p5] YouTube IFrame init failed (UI still works):', err)
      if (trackLabel) {
        trackLabel.textContent = 'YouTube failed to load — use local /public/ MP3 or check network'
      }
      return
    }
    player = yt
    playerCreated = true
  }

  function startLocalLooped() {
    if (!fallbackAudio || !fallbackReady) return
    silenceYoutube()
    clearFade()
    fallbackAudio.loop = true
    fallbackAudio.playbackRate = 1
    fallbackAudio.volume = 0
    const playAttempt = fallbackAudio.play()
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(() => {
        if (trackLabel) {
          trackLabel.textContent = 'Could not start local audio.'
        }
      })
    }
    if (playIcon) {
      playIcon.textContent = '❚❚'
    }
    if (playBtn) {
      playBtn.classList.add('is-playing')
    }
    if (trackLabel) {
      trackLabel.textContent = 'Local Audio Active'
    }
    fadeTimer = setInterval(() => {
      const next = Math.min(MAX_LOCAL_VOLUME, (fallbackAudio.volume || 0) + FADE_LOCAL_STEP)
      fallbackAudio.volume = next
      if (next >= MAX_LOCAL_VOLUME) {
        clearInterval(fadeTimer)
        fadeTimer = undefined
      }
    }, FADE_MS)
  }

  function startYouTubeFaded() {
    if (!player || !musicReady) return
    silenceLocal()
    try {
      player.setPlaybackRate(1)
    } catch {
      // Ignore.
    }
    clearFade()
    try {
      player.unMute()
      player.setVolume(0)
      player.playVideo()
      // Mobile unMute double-tap
      setTimeout(() => {
        try { player.unMute(); } catch(e){}
      }, 50)
    } catch (e) {
      console.warn('[p5] startYouTubeFaded error:', e)
    }
    fadeTimer = setInterval(() => {
      let current = 0
      try {
        current = player.getVolume()
      } catch {
        current = 0
      }
      if (current >= MAX_YT_VOLUME) {
        clearInterval(fadeTimer)
        fadeTimer = undefined
      } else {
        try {
          player.setVolume(Math.min(MAX_YT_VOLUME, current + FADE_YT_STEP))
        } catch {
          clearInterval(fadeTimer)
          fadeTimer = undefined
        }
      }
    }, FADE_MS)
  }

  function isMobile() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  }

  function playMusicWithFade() {
    if (isBgmPlaying()) {
      return
    }

    // ON IPHONE/MOBILE: YouTube is too unreliable. Use the local MP3.
    if (isMobile()) {
      startLocalLooped()
      if (trackLabel) {
        trackLabel.textContent = `Now playing: ${P5_BGM.displayName}`
      }
      if (playIcon) {
        playIcon.textContent = '❚❚'
      }
      if (playBtn) {
        playBtn.classList.add('is-playing')
      }
      if (audioNotification) {
        audioNotification.classList.add('active')
      }
      if (notifTimeout) clearTimeout(notifTimeout)
      notifTimeout = setTimeout(() => {
        if (audioNotification) audioNotification.classList.remove('active')
      }, 5000)
      return
    }

    if (musicReady && player) {
      startYouTubeFaded()
      if (trackLabel) {
        trackLabel.textContent = `Now playing: ${P5_BGM.displayName}`
      }
      if (playIcon) {
        playIcon.textContent = '❚❚'
      }
      if (playBtn) {
        playBtn.classList.add('is-playing')
      }
      if (audioNotification) {
        audioNotification.classList.add('active')
      }
      if (notifTimeout) {
        clearTimeout(notifTimeout)
      }
      notifTimeout = setTimeout(() => {
        if (audioNotification) {
          audioNotification.classList.remove('active')
        }
      }, 5000)
      return
    }

    if (!playerCreated) {
      createPlayer()
    }
    if (!musicReady) {
      pendingStart = true
      if (trackLabel) {
        trackLabel.textContent = 'Loading BGM (YouTube)…'
      }
    }
  }

  function unlockAudio() {
    if (audioUnlocked) return
    audioUnlocked = true

    // WE MUST START AUDIO IMMEDIATELY WITHIN THE CLICK EVENT
    // ON MOBILE, IF WE WAIT FOR ASYNC LOADS, THE BROWSER BLOCKS IT
    if (!playerCreated) {
      createPlayer()
    }
    
    // Prime the player immediately
    if (player && typeof player.playVideo === 'function') {
      try {
        player.unMute()
        player.setVolume(0)
        player.playVideo()
      } catch (e) {
        console.warn('[p5] Immediate mobile play attempt:', e)
      }
    }

    if (audioUnlockOverlay) {
      audioUnlockOverlay.classList.add('hidden')
      audioUnlockOverlay.style.display = 'none'
    }
    if (trackLabel) {
      trackLabel.textContent = 'Audio ready — use ▶ for BGM'
    }
    
    // If it's still not ready, we use the pendingStart flag for later
    if (!musicReady) {
      pendingStart = true
    } else {
      playMusicWithFade()
    }
  }

  function toggleMusic() {
    if (!audioUnlocked) {
      if (trackLabel) {
        trackLabel.textContent = 'Click “Initialize Audio” first'
      }
      return
    }
    if (isBgmPlaying()) {
      pauseAll()
      return
    }
    if (!playerCreated) {
      createPlayer()
    }
    if (!musicReady && !fallbackReady) {
      pendingStart = true
      if (trackLabel) {
        trackLabel.textContent = 'Loading BGM (YouTube)…'
      }
      if (window.YT && window.YT.Player) {
        createPlayer()
      }
      return
    }
    playMusicWithFade()
  }

  if (audioUnlockOverlay) {
    audioUnlockOverlay.addEventListener('click', () => {
      unlockAudio()
    })
    audioUnlockOverlay.addEventListener('touchstart', () => {
      unlockAudio()
    }, { passive: true })
  } else if (audioUnlockBtn) {
    audioUnlockBtn.addEventListener('click', () => {
      unlockAudio()
    })
  }
  if (playBtn) {
    playBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      toggleMusic()
    })
    playBtn.addEventListener('touchstart', (e) => {
      e.stopPropagation()
      toggleMusic()
    }, { passive: true })
  }

  const onShiftBgm = (e) => {
    if (e.key !== 'Shift' || e.repeat) return
    if (!audioUnlocked) return
    toggleMusic()
  }
  window.addEventListener('keydown', onShiftBgm)

  if (themeFlipBtn) {
    themeFlipBtn.onclick = () => {
      document.documentElement.classList.toggle('high-contrast')
      const enabled = document.documentElement.classList.contains('high-contrast')
      themeFlipBtn.textContent = enabled ? 'Classic Style' : 'Style Shift'
    }
  }

  const cards = document.querySelectorAll('.exp-card')
  cards.forEach((card, index) => {
    card.style.transform = `rotate(${(index % 2 === 0 ? -1 : 1) * (Math.random() * 1.2)}deg)`
  })

  function updateWorldActive() {
    if (!worldCards.length || !carousel) return
    worldCards.forEach((card, index) => card.classList.toggle('active', index === activeWorld))
    const xShift = Math.max(0, activeWorld - 1) * (worldCards[0].offsetWidth + 16)
    carousel.scrollTo({ left: xShift, behavior: 'smooth' })
  }
  updateWorldActive()

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      activeWorld = (activeWorld + 1) % worldCards.length
      updateWorldActive()
    })
  }
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      activeWorld = (activeWorld - 1 + worldCards.length) % worldCards.length
      updateWorldActive()
    })
  }

  worldCards.forEach((card, index) => {
    card.addEventListener('mouseenter', () => {
      if (lastScene) lastScene.setHoverGlitch(true)
      card.classList.add('glitching')
    })
    card.addEventListener('mouseleave', () => {
      if (lastScene) lastScene.setHoverGlitch(false)
      card.classList.remove('glitching')
    })
    card.addEventListener('click', () => {
      if (keyholeTransition) {
        keyholeTransition.classList.add('active')
        setTimeout(() => keyholeTransition.classList.remove('active'), 560)
      }
      if (lastScene) {
        lastScene.triggerKeyholeTransition()
        lastScene.triggerShatter(1.2)
      }
      activeWorld = index
      updateWorldActive()
      card.animate(
        [
          { transform: 'scale(1) rotate(0deg)', filter: 'brightness(1)' },
          { transform: 'scale(1.1) rotate(-2deg)', filter: 'brightness(1.6) saturate(1.4)' },
          { transform: 'scale(1.01) rotate(0deg)', filter: 'brightness(1)' }
        ],
        { duration: 330, easing: 'ease-out' }
      )
      if (!card.classList.contains('unlocked')) {
        card.classList.add('unlocking')
        setTimeout(() => {
          card.classList.remove('unlocking')
          card.classList.add('unlocked')
        }, 430)
      }
    })
  })

  const playTink = () => {
    try {
      if (!audioCtx) audioCtx = new window.AudioContext()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(1600, audioCtx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.16)
      gain.gain.setValueAtTime(0.0001, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.03, audioCtx.currentTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.19)
      osc.connect(gain).connect(audioCtx.destination)
      osc.start()
      osc.stop(audioCtx.currentTime + 0.2)
    } catch {
      // Ignore.
    }
  }

  document.querySelectorAll('a, button').forEach((node) => node.addEventListener('mouseenter', playTink))
  if (cursor) {
    document.querySelectorAll('a, button, .world-card').forEach((node) => {
      node.addEventListener('mouseenter', () => cursor.classList.add('dagger'))
      node.addEventListener('mouseleave', () => cursor.classList.remove('dagger'))
    })
  }

  const prevYtiFrameReady = window.onYouTubeIframeAPIReady
  window.onYouTubeIframeAPIReady = () => {
    try {
      if (typeof prevYtiFrameReady === 'function') {
        prevYtiFrameReady()
      }
      createPlayer()
    } catch (e) {
      console.error('[p5] onYouTubeIframeAPIReady', e)
    }
  }
  try {
    if (window.YT && window.YT.Player) {
      createPlayer()
    }
  } catch (e) {
    console.error('[p5] YT createPlayer (after UI wire)', e)
  }

  if (playBtn) {
    playBtn.dataset.p5Bgm = '1'
  }
}
