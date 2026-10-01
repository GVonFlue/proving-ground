import { useEffect, useMemo, useState, useCallback } from 'react'
import { supabase } from './supabase.js'
import { chicagoToday, addDays } from './dates.js'
import { computeStats, rankMembers } from './streak.js'

async function fetchAllLogs(since) {
  const rows = []
  const page = 1000
  for (let from = 0; ; from += page) {
    const { data, error } = await supabase
      .from('daily_logs').select('*')
      .gte('log_date', since)
      .order('log_date', { ascending: true })
      .range(from, from + page - 1)
    if (error) throw error
    rows.push(...data)
    if (data.length < page) break
  }
  return rows
}

// Keeps "today" correct if the app stays open past midnight Central
function useToday() {
  const [today, setToday] = useState(chicagoToday())
  useEffect(() => {
    const id = setInterval(() => setToday(chicagoToday()), 30000)
    return () => clearInterval(id)
  }, [])
  return today
}

export function useCrew() {
  const today = useToday()
  const [profiles, setProfiles] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const { data: p, error: pe } = await supabase.from('profiles').select('*')
      if (pe) throw pe
      const earliest = p.reduce((min, x) => (x.start_date < min ? x.start_date : min), today)
      // Look back far enough to cover every member's run (capped at ~1 year)
      const since = earliest < addDays(today, -366) ? addDays(today, -366) : earliest
      const l = await fetchAllLogs(since)
      setProfiles(p); setLogs(l); setError('')
    } catch (e) {
      setError(e.message || 'Could not load the crew.')
    } finally {
      setLoading(false)
    }
  }, [today])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const ch = supabase.channel('crew')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_logs' }, (pl) => {
        if (pl.eventType === 'DELETE') return load()
        const row = pl.new
        setLogs((prev) => {
          const i = prev.findIndex((x) => x.user_id === row.user_id && x.log_date === row.log_date)
          if (i === -1) return [...prev, row]
          const next = prev.slice(); next[i] = row; return next
        })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [load])

  // Local optimistic update for my own row
  const patchLog = useCallback((row) => {
    setLogs((prev) => {
      const i = prev.findIndex((x) => x.user_id === row.user_id && x.log_date === row.log_date)
      if (i === -1) return [...prev, row]
      const next = prev.slice(); next[i] = { ...prev[i], ...row }; return next
    })
  }, [])

  const members = useMemo(() => {
    const byUser = {}
    for (const l of logs) (byUser[l.user_id] ||= []).push(l)
    return rankMembers(profiles.map((profile) => {
      const mine = byUser[profile.id] || []
      return { profile, logs: mine, stats: computeStats(mine, profile.start_date, today) }
    }))
  }, [profiles, logs, today])

  return { today, members, loading, error, reload: load, patchLog }
}
