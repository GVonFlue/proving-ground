import { useEffect, useState } from 'react'
import { LayoutList, MessageSquare, User } from 'lucide-react'
import { supabase, configured } from './lib/supabase.js'
import { useCrew } from './lib/useCrew.js'
import { useChat } from './lib/useChat.js'
import { prettyDate } from './lib/dates.js'
import Login from './components/Login.jsx'
import Onboarding from './components/Onboarding.jsx'
import YourDay from './components/YourDay.jsx'
import Board from './components/Board.jsx'
import MemberDetail from './components/MemberDetail.jsx'
import Chat from './components/Chat.jsx'
import Me from './components/Me.jsx'

function Shell({ children }) {
  return (<><div className="frame" aria-hidden="true" /><main className="app">{children}</main></>)
}

export default function App() {
  const [session, setSession] = useState(undefined)
  const [hasProfile, setHasProfile] = useState(undefined)

  useEffect(() => {
    if (!configured) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const uid = session?.user?.id
  useEffect(() => {
    if (!uid) { setHasProfile(undefined); return }
    supabase.from('profiles').select('id').eq('id', uid).maybeSingle()
      .then(({ data }) => setHasProfile(Boolean(data)))
  }, [uid])

  if (!configured) {
    return <Shell><div className="error">Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Add them in Vercel, then redeploy.</div></Shell>
  }
  if (session === undefined || (session && hasProfile === undefined)) return <Shell><p className="sub">Loading</p></Shell>
  if (!session) return <Shell><Login /></Shell>
  if (!hasProfile) return <Shell><Onboarding onJoined={() => setHasProfile(true)} /></Shell>
  return <Main session={session} />
}

function Main({ session }) {
  const meId = session.user.id
  const [tab, setTab] = useState('board')
  const [openId, setOpenId] = useState(null)
  const crew = useCrew()
  const chat = useChat(tab === 'chat')
  const me = crew.members.find((m) => m.profile.id === meId)
  const open = crew.members.find((m) => m.profile.id === openId)

  useEffect(() => { window.scrollTo(0, tab === 'chat' ? document.body.scrollHeight : 0) }, [tab])

  return (
    <Shell>
      <header className="top">
        <div>
          <h1 className="wordmark"><span>PROVING</span><span>GROUND</span></h1>
          <div className="sub">{prettyDate(crew.today)}. Every task, every day.</div>
        </div>
      </header>

      {crew.error && <div className="error" style={{ marginBottom: 20 }}>{crew.error} <button className="btn ghost" style={{ marginTop: 10 }} onClick={crew.reload}>Try again</button></div>}

      {tab === 'board' && (crew.loading ? <p className="sub">Loading the board</p> : (
        <>
          {me && <YourDay me={me} today={crew.today} patchLog={crew.patchLog} />}
          <Board members={crew.members} meId={meId} onOpen={setOpenId} />
          <p className="footer">Built for the 75 Hard challenge. Powered by <a href="https://getproytech.com" target="_blank" rel="noreferrer">ProyTech</a>.</p>
        </>
      ))}
      {tab === 'chat' && <Chat chat={chat} profiles={crew.members.map((m) => m.profile)} meId={meId} />}
      {tab === 'me' && me && <Me profile={me.profile} email={session.user.email} />}

      {open && <MemberDetail member={open} today={crew.today} onClose={() => setOpenId(null)} />}

      <nav className="tabs" aria-label="Sections">
        <button aria-current={tab === 'board' ? 'page' : undefined} onClick={() => setTab('board')}><LayoutList size={18} />Board</button>
        <button aria-current={tab === 'chat' ? 'page' : undefined} onClick={() => setTab('chat')}>
          <MessageSquare size={18} />Chat
          {tab !== 'chat' && chat.unread > 0 && <span className="pip">{chat.unread > 9 ? '9+' : chat.unread}</span>}
        </button>
        <button aria-current={tab === 'me' ? 'page' : undefined} onClick={() => setTab('me')}><User size={18} />Me</button>
      </nav>
    </Shell>
  )
}
