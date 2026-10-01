import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { chicagoToday } from '../lib/dates.js'

export default function Onboarding({ onJoined }) {
  const [f, setF] = useState({ name: '', business: '', avatar: '', start: chicagoToday(), code: '' })
  const [state, setState] = useState({ busy: false, msg: '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setState({ busy: true, msg: '' })
    const { error } = await supabase.rpc('join_crew', {
      code: f.code, p_display_name: f.name, p_business: f.business, p_avatar_url: f.avatar, p_start_date: f.start,
    })
    if (error) setState({ busy: false, msg: error.message })
    else onJoined()
  }

  return (
    <div className="auth">
      <h1 className="wordmark"><span>JOIN THE</span><span>CREW</span></h1>
      <p className="lede">Set up your card. Everyone on the board sees your name, your business, and your day count.</p>
      <form onSubmit={submit}>
        <label className="field"><span>Your name</span>
          <input required maxLength={40} value={f.name} onChange={set('name')} placeholder="Garrett" /></label>
        <label className="field"><span>Business</span>
          <input maxLength={60} value={f.business} onChange={set('business')} placeholder="ProyTech" /></label>
        <label className="field"><span>Photo URL (optional)</span>
          <input type="url" value={f.avatar} onChange={set('avatar')} placeholder="https://..." /></label>
        <label className="field"><span>Day 1 of your challenge</span>
          <input type="date" required value={f.start} onChange={set('start')} /></label>
        <label className="field"><span>Invite code</span>
          <input required autoCapitalize="characters" value={f.code} onChange={set('code')} placeholder="From the group text" /></label>
        <button className="btn" disabled={state.busy}>{state.busy ? 'Joining' : 'Join the crew'}</button>
      </form>
      {state.msg && <p className="formmsg bad">{state.msg}</p>}
      <button className="btn ghost" style={{ marginTop: 12 }} onClick={() => supabase.auth.signOut()}>Use a different email</button>
    </div>
  )
}
