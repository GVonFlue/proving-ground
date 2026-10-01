import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase.js'

export function useChat(active) {
  const [messages, setMessages] = useState([])
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let alive = true
    supabase.from('chat_messages').select('*')
      .order('created_at', { ascending: false }).limit(200)
      .then(({ data }) => { if (alive && data) setMessages(data.reverse()) })
    const ch = supabase.channel('chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (pl) => {
        setMessages((prev) => prev.some((m) => m.id === pl.new.id) ? prev : [...prev, pl.new])
        setUnread((u) => u + 1)
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_messages' }, (pl) => {
        setMessages((prev) => prev.filter((m) => m.id !== pl.old.id))
      })
      .subscribe()
    return () => { alive = false; supabase.removeChannel(ch) }
  }, [])

  useEffect(() => { if (active) setUnread(0) }, [active, messages.length])

  const send = useCallback(async (userId, body) => {
    const text = body.trim()
    if (!text) return
    const { data, error } = await supabase.from('chat_messages')
      .insert({ user_id: userId, body: text }).select().single()
    if (error) throw error
    setMessages((prev) => prev.some((m) => m.id === data.id) ? prev : [...prev, data])
  }, [])

  const remove = useCallback(async (id) => {
    setMessages((prev) => prev.filter((m) => m.id !== id))
    await supabase.from('chat_messages').delete().eq('id', id)
  }, [])

  return { messages, unread, send, remove }
}
