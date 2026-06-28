import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { getSession } from './api/auth'

import SiteGate    from './pages/SiteGate'
import Kiosk       from './pages/Kiosk'
import ChooseMode  from './pages/ChooseMode'
import Confirm     from './pages/Confirm'
import TripConfirm from './pages/TripConfirm'
import Layout      from './components/Layout'

import Sites       from './pages/admin/Sites'
import Contractors from './pages/admin/Contractors'
import EquipmentPage from './pages/admin/Equipment'
import WorkTypes   from './pages/admin/WorkTypes'
import Trips       from './pages/admin/Trips'
import Reports     from './pages/admin/Reports'
import Logs        from './pages/admin/Logs'

function RequireSession({ children }: { children: React.ReactNode }) {
  const session = getSession()
  if (!session) return <Navigate to="/" replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const session = getSession()
  if (!session) return <Navigate to="/" replace />
  if (!session.isAdmin) return <Navigate to="/kiosk" replace />
  return <>{children}</>
}

function Root() {
  const session = getSession()
  if (!session) return <SiteGate />
  if (session.isAdmin) return <Navigate to="/admin/sites" replace />
  return <Navigate to="/kiosk" replace />
}

export default function App() {
  return (
    <BrowserRouter basename="/teqnika">
      <Routes>
        <Route path="/" element={<Root />} />
        <Route path="/kiosk" element={<RequireSession><Layout><Kiosk /></Layout></RequireSession>} />
        <Route path="/kiosk/choose" element={<RequireSession><Layout><ChooseMode /></Layout></RequireSession>} />
        <Route path="/kiosk/confirm" element={<RequireSession><Layout><Confirm /></Layout></RequireSession>} />
        <Route path="/kiosk/trip" element={<RequireSession><Layout><TripConfirm /></Layout></RequireSession>} />
        <Route path="/admin" element={<RequireSession><Layout><Navigate to="/admin/sites" /></Layout></RequireSession>} />
        <Route path="/admin/sites"       element={<RequireAdmin><Layout><Sites /></Layout></RequireAdmin>} />
        <Route path="/admin/contractors" element={<RequireSession><Layout><Contractors /></Layout></RequireSession>} />
        <Route path="/admin/equipment"   element={<RequireSession><Layout><EquipmentPage /></Layout></RequireSession>} />
        <Route path="/admin/work-types"  element={<RequireSession><Layout><WorkTypes /></Layout></RequireSession>} />
        <Route path="/admin/trips"       element={<RequireSession><Layout><Trips /></Layout></RequireSession>} />
        <Route path="/admin/reports"     element={<RequireSession><Layout><Reports /></Layout></RequireSession>} />
        <Route path="/admin/logs"        element={<RequireSession><Layout><Logs /></Layout></RequireSession>} />
      </Routes>
    </BrowserRouter>
  )
}
