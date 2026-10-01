import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { addDays } from '../lib/dates.js'
import { TASKS, GOAL } from '../lib/streak.js'

export default function YourDay({ me, today, patchLog }) {
  const [which, setWhich] = useState('today')
  const date = which === 'today' ? today : addDays(today, -1)
  const log = me.logs.find((l) => l.log_date === date) || {}
  const [note, setNote] = useState(log.note || '')
  const [noteState, setNoteState] = useState('')
  const [err, setErr] = useState('')
  const timer = useRef()

  useEffect(() => { setNote(log.note || ''); setNoteState('') }, [date, me.profile.id]) // eslint-disable-line

  if (me.stats.notStarted) {
    return (
      <section className="yourday">
        <div className="yourday-head"><h2>Your day 1 starts in {me.stats.startsIn} {me.stats.startsIn === 1 ? 'day' : 'days'}</h2></div>
        <p className="formmsg">Change your start date under Me if you want to start today.</p>
      </section>
    )
  }

  async function save(fields) {
    const row = { user_id: me.profile.id, log_date: date, ...fields }
    patchLog(row)
    const { error } = await supabase.from('daily_logs').upsert(row, { onConflict: 'user_id,log_date' })
    if (error) setErr(`Didn't save: ${error.message}`)
    else setErr('')
  }

  function toggle(key) {
    if (navigator.vibrate) navigator.vibrate(12)
    save({ [key]: !log[key] })
  }

  function onNote(e) {
    const v = e.target.value
    setNote(v); setNoteState('Typing')
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      await save({ note: v.trim() || null })
      setNoteState('Saved')
    }, 700)
  }

  const label = which === 'today'
    ? (me.stats.finisher ? 'Finished. All 75.' : `Day ${me.stats.day} of ${GOAL}`)
    : 'Yesterday'

  return (
    <section className="yourday" aria-label="Your check-in">
      <div className="yourday-head">
        <h2>{label}</h2>
        <div className="daytoggle" role="group" aria-label="Which day">
          <button aria-pressed={which === 'yesterday'} onClick={() => setWhich('yesterday')}>Yesterday</button>
          <button aria-pressed={which === 'today'} onClick={() => setWhich('today')}>Today</button>
        </div>
      </div>
      <div className="tasks">
        {TASKS.map((t) => {
          const done = Boolean(log[t.key])
          return (
            <button key={t.key} className={`task ${done ? 'done' : ''}`} aria-pressed={done} onClick={() => toggle(t.key)}>
              <span className="check">{done && <Check size={15} strokeWidth={3} />}</span>
              <strong>{t.label}</strong>
              <small>{t.hint}</small>
            </button>
          )
        })}
      </div>
      <textarea className="note" rows={1} maxLength={280} value={note} onChange={onNote}
        placeholder={which === 'today' ? "One line on today. The crew sees it." : 'Note for yesterday'} aria-label="Daily note" />
      <div className="notestate" aria-live="polite">{err || noteState}</div>
    </section>
  )
}
