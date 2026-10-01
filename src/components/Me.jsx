import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function Me({ profile, email }) {
  const [f, setF] = useState({
    display_name: profile.display_name, business: profile.business || '',
    avatar_url: profile.avatar_url || '', start_date: profile.start_date,
  })
  const [msg, setMsg] = useState({ text: '', bad: false })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function save(e) {
    e.preventDefault()
    const { error } = await supabase.from('profiles').update({
      display_name: f.display_name.trim(),
      business: f.business.trim() || null,
      avatar_url: f.avatar_url.trim() || null,
      start_date: f.start_date,
    }).eq('id', profile.id)
    setMsg(error ? { text: error.message, bad: true } : { text: 'Saved.', bad: false })
  }

  return (
    <section className="me" aria-label="Your profile">
      <div className="section-title"><h2>Me</h2><span>{email}</span></div>
      <form onSubmit={save}>
        <label className="field"><span>Your name</span><input required maxLength={40} value={f.display_name} onChange={set('display_name')} /></label>
        <label className="field"><span>Business</span><input maxLength={60} value={f.business} onChange={set('business')} /></label>
        <label className="field"><span>Photo URL</span><input type="url" value={f.avatar_url} onChange={set('avatar_url')} placeholder="https://..." /></label>
        <label className="field"><span>Day 1 of your challenge</span><input type="date" required value={f.start_date} onChange={set('start_date')} /></label>
        <button className="btn">Save changes</button>
      </form>
      {msg.text && <p className={`formmsg ${msg.bad ? 'bad' : ''}`}>{msg.text}</p>}
      <button className="btn ghost" style={{ marginTop: 20 }} onClick={() => supabase.auth.signOut()}>Sign out</button>
      <p className="formmsg">Tip: on iPhone, tap Share, then Add to Home Screen, to open Proving Ground like an app.</p>
    </section>
  )
}
