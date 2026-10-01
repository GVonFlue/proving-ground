import Avatar from './Avatar.jsx'
import { GOAL, TASKS } from '../lib/streak.js'

const STATUS = {
  cleared: 'Cleared today',
  finisher: 'Finished 75',
  progress: 'In progress',
  open: 'Not started today',
}

function Ticks({ stats }) {
  const filled = Math.min(GOAL, stats.streak)
  const nowIndex = stats.todayDone ? filled - 1 : filled
  return (
    <div className="ticks" aria-hidden="true">
      {Array.from({ length: GOAL }, (_, i) => {
        const cls = [i < filled ? 'on' : '', i === nowIndex && !stats.finisher ? 'now' : ''].join(' ')
        return <i key={i} className={cls} />
      })}
    </div>
  )
}

export default function Board({ members, meId, onOpen }) {
  if (!members.length) return <div className="empty">No one on the board yet. Text the invite code to the crew.</div>
  const cleared = members.filter((m) => m.stats.todayDone).length
  const leaderStreak = members[0]?.stats.streak || 0

  return (
    <section aria-label="Crew board">
      <div className="section-title">
        <h2>The board</h2>
        <span>{cleared} of {members.length} cleared today</span>
      </div>
      {members.map((m, i) => {
        const s = m.stats
        const leader = i === 0 && leaderStreak > 0
        const note = s.todayLog?.note
        return (
          <button key={m.profile.id} className={`row ${leader ? 'leader' : ''}`} onClick={() => onOpen(m.profile.id)}
            aria-label={`${m.profile.display_name}, day ${s.day}`}>
            <span className="rank">{i + 1}</span>
            <Avatar profile={m.profile} />
            <div className="who">
              <div className="name">{m.profile.display_name}{m.profile.id === meId ? ' (you)' : ''}</div>
              {m.profile.business && <div className="biz">{m.profile.business}</div>}
            </div>
            <div className="bigday">
              {s.notStarted ? <><b>0</b><i>starts soon</i></> : <><b>{s.day}</b><i>of {GOAL}</i></>}
            </div>
            {!s.notStarted && <Ticks stats={s} />}
            {!s.notStarted && (
              <div className="today">
                <div className="dots">{TASKS.map((t) => <i key={t.key} className={s.todayLog?.[t.key] ? 'on' : ''} />)}</div>
                <span className={`badge ${s.status}`}>{STATUS[s.status]}</span>
              </div>
            )}
            {note && <p className="lastnote">"{note}"</p>}
          </button>
        )
      })}
    </section>
  )
}
