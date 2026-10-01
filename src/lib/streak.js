import { addDays, daysBetween } from './dates.js'

export const GOAL = 75

export const TASKS = [
  { key: 'workout_1', label: 'Workout 1', hint: '45 minutes' },
  { key: 'workout_2_outdoor', label: 'Workout 2', hint: '45 minutes, outdoors' },
  { key: 'diet', label: 'Diet', hint: 'No cheat meals, no alcohol' },
  { key: 'water', label: 'Water', hint: 'One gallon' },
  { key: 'reading', label: 'Read', hint: '10 pages, nonfiction' },
  { key: 'photo', label: 'Photo', hint: 'Progress picture' },
]

export function tasksDone(log) {
  if (!log) return 0
  return TASKS.reduce((n, t) => n + (log[t.key] ? 1 : 0), 0)
}

export function isComplete(log) {
  return tasksDone(log) === TASKS.length
}

/**
 * logs: array of daily_logs rows for ONE member
 * startDate / today: YYYY-MM-DD
 */
export function computeStats(logs, startDate, today) {
  const byDate = {}
  for (const l of logs) byDate[l.log_date] = l
  const yesterday = addDays(today, -1)
  const todayLog = byDate[today] || null
  const todayCount = tasksDone(todayLog)
  const todayDone = todayCount === TASKS.length

  if (daysBetween(startDate, today) < 0) {
    return {
      notStarted: true, streak: 0, day: 0, todayCount: 0, todayDone: false,
      total: 0, restarts: 0, finisher: false, todayLog: null,
      status: 'starts', startsIn: daysBetween(today, startDate),
    }
  }

  // Current streak: consecutive complete days ending today (if cleared) or yesterday
  let streak = 0
  let cursor = todayDone ? today : yesterday
  while (daysBetween(startDate, cursor) >= 0 && isComplete(byDate[cursor])) {
    streak++
    cursor = addDays(cursor, -1)
  }

  // Restarts: runs that broke on a fully past day
  let restarts = 0
  let run = 0
  let total = 0
  for (let d = startDate; daysBetween(d, today) >= 0; d = addDays(d, 1)) {
    const done = isComplete(byDate[d])
    if (done) total++
    if (d === today) break
    if (done) run++
    else {
      if (run > 0) restarts++
      run = 0
    }
  }

  const finisher = streak >= GOAL
  const day = Math.min(GOAL, todayDone ? streak : streak + 1)
  const status = finisher ? 'finisher' : todayDone ? 'cleared' : todayCount > 0 ? 'progress' : 'open'

  return { notStarted: false, streak, day, todayCount, todayDone, total, restarts, finisher, todayLog, status }
}

export function rankMembers(members) {
  return [...members].sort((a, b) =>
    (b.stats.notStarted ? -1 : b.stats.streak) - (a.stats.notStarted ? -1 : a.stats.streak) ||
    b.stats.todayCount - a.stats.todayCount ||
    b.stats.total - a.stats.total ||
    a.profile.display_name.localeCompare(b.profile.display_name)
  )
}
