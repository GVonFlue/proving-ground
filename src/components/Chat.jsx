import { useEffect, useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import Avatar from './Avatar.jsx'
import { timeLabel } from '../lib/dates.js'

export default function Chat({ chat, profiles, meId }) {
  const [text, setText] = useState('')
  const [err, setErr] = useState('')
  const end = useRef()
  const byId = Object.fromEntries(profiles.map((p) => [p.id, p]))

  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [chat.messages.length])

  async function send(e) {
    e?.preventDefault()
    const body = text
    if (!body.trim()) return
    setText('')
    try { await chat.send(meId, body); setErr('') }
    catch (x) { setText(body); setErr(`Didn't send: ${x.message}`) }
  }

  return (
    <section className="chat" aria-label="Crew chat">
      <div className="section-title"><h2>Crew chat</h2><span>Everyone on the board</span></div>
      <div className="msgs">
        {!chat.messages.length && <div className="empty">Nothing here yet. Say something to the crew.</div>}
        {chat.messages.map((m) => {
          const p = byId[m.user_id]
          if (m.kind === 'system') {
            return <div key={m.id} className={`sysmsg ${m.body.includes('joined') ? 'join' : ''}`}>{m.body}</div>
          }
          const mine = m.user_id === meId
          return (
            <div key={m.id} className={`msg ${mine ? 'mine' : ''}`}>
              <Avatar profile={p} size="sm" />
              <div>
                <div className="meta">
                  <b>{p?.display_name || 'Member'}</b>
                  <time>{timeLabel(m.created_at)}</time>
                  {mine && <button className="del" onClick={() => chat.remove(m.id)}>Delete</button>}
                </div>
                <p>{m.body}</p>
              </div>
            </div>
          )
        })}
        {err && <div className="formmsg bad">{err}</div>}
        <div ref={end} />
      </div>
      <form className="composer" onSubmit={send}>
        <textarea rows={1} maxLength={1000} value={text} placeholder="Message the crew" aria-label="Message"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && window.matchMedia('(hover: hover)').matches) send(e) }} />
        <button type="submit" disabled={!text.trim()} aria-label="Send"><ArrowUp size={20} /></button>
      </form>
    </section>
  )
}
