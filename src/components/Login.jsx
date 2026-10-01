import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function Login() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState({ busy: false, msg: '', bad: false })

  async function submit(e) {
    e.preventDefault()
    setState({ busy: true, msg: '', bad: false })
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) setState({ busy: false, msg: error.message, bad: true })
    else setState({ busy: false, msg: `Check ${email.trim()} for your sign-in link. Open it on this device.`, bad: false })
  }

  return (
    <div className="auth">
      <h1 className="wordmark"><span>PROVING</span><span>GROUND</span></h1>
      <p className="lede">75 days. Every task, every day. Miss one and you start over. The whole crew is watching.</p>
      <form onSubmit={submit}>
        <label className="field">
          <span>Email</span>
          <input type="email" required autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" />
        </label>
        <button className="btn" disabled={state.busy || !email}>{state.busy ? 'Sending link' : 'Email me a sign-in link'}</button>
      </form>
      {state.msg && <p className={`formmsg ${state.bad ? 'bad' : ''}`}>{state.msg}</p>}
      <p className="footer">Powered by <a href="https://getproytech.com" target="_blank" rel="noreferrer">ProyTech</a></p>
    </div>
  )
}
