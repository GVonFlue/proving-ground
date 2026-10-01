import { describe, it, expect } from 'vitest'
import { computeStats, rankMembers } from './streak.js'
import { addDays } from './dates.js'

const full = (d) => ({ log_date: d, workout_1: true, workout_2_outdoor: true, diet: true, water: true, reading: true, photo: true })
const part = (d, n) => {
  const keys = ['workout_1', 'workout_2_outdoor', 'diet', 'water', 'reading', 'photo']
  const l = { log_date: d }
  keys.forEach((k, i) => (l[k] = i < n))
  return l
}
const T = '2026-10-10'

describe('computeStats', () => {
  it('first day, nothing done', () => {
    const s = computeStats([], T, T)
    expect(s.day).toBe(1); expect(s.streak).toBe(0); expect(s.status).toBe('open')
  })
  it('first day cleared', () => {
    const s = computeStats([full(T)], T, T)
    expect(s.day).toBe(1); expect(s.streak).toBe(1); expect(s.status).toBe('cleared')
  })
  it('three clean days then today in progress', () => {
    const start = addDays(T, -3)
    const logs = [full(start), full(addDays(T, -2)), full(addDays(T, -1)), part(T, 2)]
    const s = computeStats(logs, start, T)
    expect(s.streak).toBe(3); expect(s.day).toBe(4); expect(s.todayCount).toBe(2); expect(s.status).toBe('progress')
  })
  it('missed yesterday resets to day 1 and counts a restart', () => {
    const start = addDays(T, -3)
    const logs = [full(start), full(addDays(T, -2)), part(addDays(T, -1), 5)]
    const s = computeStats(logs, start, T)
    expect(s.streak).toBe(0); expect(s.day).toBe(1); expect(s.restarts).toBe(1); expect(s.total).toBe(2)
  })
  it('finisher at 75', () => {
    const start = addDays(T, -74)
    const logs = Array.from({ length: 75 }, (_, i) => full(addDays(start, i)))
    const s = computeStats(logs, start, T)
    expect(s.streak).toBe(75); expect(s.day).toBe(75); expect(s.finisher).toBe(true)
  })
  it('future start date', () => {
    const s = computeStats([], addDays(T, 2), T)
    expect(s.notStarted).toBe(true); expect(s.startsIn).toBe(2)
  })
})

describe('rankMembers', () => {
  it('ranks by streak, then today progress', () => {
    const m = (name, streak, todayCount) => ({ profile: { display_name: name }, stats: { streak, todayCount, total: streak, notStarted: false } })
    const r = rankMembers([m('A', 2, 6), m('B', 5, 0), m('C', 2, 3)])
    expect(r.map((x) => x.profile.display_name)).toEqual(['B', 'A', 'C'])
  })
})
