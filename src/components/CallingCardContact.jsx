import { useRef, useState } from 'react'
import { gsap } from 'gsap'

export function CallingCardContact() {
  const formRef = useRef(null)
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)

  const handleSend = (e) => {
    e.preventDefault()
    if (!formRef.current || sending) return
    setSending(true)
    const el = formRef.current
    const tl = gsap.timeline({
      onComplete: () => {
        setSubmitted(true)
        setSending(false)
        gsap.set(el, { clearProps: 'all' })
      }
    })
    tl.to(el, {
      scale: 0.2,
      rotationZ: 24,
      rotationY: 68,
      x: '200vw',
      duration: 0.9,
      ease: 'power4.in'
    })
  }

  if (submitted) {
    return (
      <div className="calling-card sent-flash kh-p5-textbox" role="status">
        <p className="calling-card-ty">Request registered. The Thieves are en route…</p>
      </div>
    )
  }

  return (
    <form
      id="contact-calling-card"
      ref={formRef}
      className="calling-card"
      onSubmit={handleSend}
    >
      <h2 className="calling-card-title">Your Next Target: Contact</h2>
      <p className="calling-card-warn">Fill in the strip — no turning back after Send.</p>
      <label className="torn-label">
        <span className="torn-caps">Alias</span>
        <input className="torn-input" name="name" type="text" required autoComplete="name" />
      </label>
      <label className="torn-label">
        <span className="torn-caps">Secure Line (email)</span>
        <input className="torn-input" name="email" type="email" required autoComplete="email" />
      </label>
      <label className="torn-label">
        <span className="torn-caps">Intel</span>
        <textarea className="torn-input torn-textarea" name="message" rows={3} required />
      </label>
      <button type="submit" className="p5-btn command calling-send" disabled={sending}>
        {sending ? 'Sealing…' : 'Send'}
      </button>
    </form>
  )
}
