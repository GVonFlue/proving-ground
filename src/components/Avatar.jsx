export default function Avatar({ profile, size = '' }) {
  const name = profile?.display_name || '?'
  const initials = name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className={`avatar ${size}`} aria-hidden="true">
      {profile?.avatar_url ? <img src={profile.avatar_url} alt="" onError={(e) => (e.currentTarget.style.display = 'none')} /> : initials}
    </div>
  )
}
