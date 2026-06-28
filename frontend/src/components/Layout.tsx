import { Link, useLocation, useNavigate } from 'react-router-dom'
import { clearSession, getSession } from '../api/auth'

const adminLinks = [
  { to: '/admin/sites',        label: 'ობიექტები' },
  { to: '/admin/contractors',  label: 'კონტრაქტორები' },
  { to: '/admin/equipment',    label: 'ტექნიკა' },
  { to: '/admin/work-types',   label: 'სამუშაოები' },
  { to: '/admin/trips',        label: 'რეისები' },
  { to: '/admin/logs',         label: 'ჩანაწერები' },
  { to: '/admin/reports',      label: 'ტაბელი' },
]

const siteLinks = [
  { to: '/kiosk',              label: 'კიოსკი' },
  { to: '/admin/contractors',  label: 'კონტრაქტორები' },
  { to: '/admin/equipment',    label: 'ტექნიკა' },
  { to: '/admin/work-types',   label: 'სამუშაოები' },
  { to: '/admin/trips',        label: 'რეისები' },
  { to: '/admin/logs',         label: 'ჩანაწერები' },
  { to: '/admin/reports',      label: 'ტაბელი' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const session = getSession()

  const handleLogout = () => {
    clearSession()
    navigate('/')
  }

  const links = session?.isAdmin ? adminLinks : siteLinks

  return (
    <div className="min-h-screen bg-bg">
      <nav className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-gray-200/60 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3 flex-wrap">
          <Link to="/" className="text-[#007AFF] font-bold text-lg mr-2 shrink-0">
            ტექნიკის ტაბელი
          </Link>
          <div className="flex gap-1 flex-wrap flex-1">
            {links.map(l => (
              <Link key={l.to} to={l.to}
                className={pathname.startsWith(l.to) ? 'nav-item-active' : 'nav-item'}>
                {l.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-sm font-semibold ${session?.isAdmin ? 'text-[#FF9F0A]' : 'text-[#007AFF]'}`}>
              {session?.isAdmin ? 'ადმინი' : session?.siteName}
            </span>
            <button onClick={handleLogout}
              className="px-3 py-1.5 rounded-[10px] border border-gray-300 text-sm text-gray-600 hover:bg-gray-100 transition-colors">
              გასვლა
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
