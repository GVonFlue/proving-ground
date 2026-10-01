import { useEffect } from 'react'
import { X } from 'lucide-react'
import Avatar from './Avatar.jsx'
import { GOAL, isComplete } from '../lib/streak.js'
import { addDays, daysBetween, prettyDate } from '../lib/dates.js'

export default function MemberDetail({ member, today, onClose }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])

  const { profile, logs, stats } = member
  const byDate = Object.fromEntries(logs.map((l) => [l.log_date, l]))
  const elapsed = daysBetween(profile.start_date, today) + 1
  const cells = Math.min(Math.max(GOAL, Math.ceil(elapsed / 15) * 15), 375)
  const notes = logs.filter((l) => l.note).sort((a, b) => (a.log_date < b.log_date ? 1 : -1)).slice(0, 10)

  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={profile.display_name} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <Avatar profile={profile} size="lg" />
          <div>
            <h2>{profile.display_name}</h2>
            {profile.business && <div className="biz" style={{ color: 'var(--soft)' }}>{profile.business}</div>}
          </div>
          <button className="close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="stats">
          <div><b>{stats.notStarted ? 0 : stats.day}</b><span>Current day</span></div>
          <div><b>{stats.total}</b><span>Days cleared</span></div>
          <div><b>{stats.restarts}</b><span>Restarts</span></div>
        </div>
        <div className="grid75" aria-label="Every day since start">
          {Array.from({ length: cells }, (_, i) => {
            const d = addDays(profile.start_date, i)
            const rel = daysBetween(d, today)
            const done = isComplete(byDate[d])
            const cls = rel < 0 ? 'future' : done ? 'done' : rel === 0 ? '' : 'missed'
            return <i key={d} className={`${cls} ${rel === 0 ? 'is-today' : ''}`} title={`${prettyDate(d)}${done ? ', cleared' : ''}`} />
          })}
        </div>
        <div className="legend">
          <span><i style={{ background: 'var(--blue-soft)' }} />Cleared</span>
          <span><i style={{ boxShadow: 'inset 0 0 0 1px var(--line)' }} />Missed</span>
          <span><i style={{ boxShadow: 'inset 0 0 0 2px var(--orange)' }} />Today</span>
        </div>
        <div className="notes">
          <h3>Notes</h3>
          {notes.length ? notes.map((n) => (
            <p key={n.log_date}><time>{prettyDate(n.log_date)}</time>{n.note}</p>
          )) : <p style={{ color: 'var(--soft)' }}>No notes yet.</p>}
        </div>
      </div>
    </div>
  )
}
