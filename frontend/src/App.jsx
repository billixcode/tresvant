import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import PublicLayout from './layouts/PublicLayout'
import AdminLayout from './layouts/AdminLayout'
import Catalog from './pages/Catalog'
import Timeline from './pages/browse/Timeline'
import Players from './pages/browse/Players'
import PlayerProfile from './pages/browse/PlayerProfile'
import Instruments from './pages/browse/Instruments'
import Albums from './pages/browse/Albums'
import AlbumDetail from './pages/browse/AlbumDetail'
import Genres from './pages/browse/Genres'
import Login from './pages/Login'
import AcceptInvite from './pages/AcceptInvite'
import BulkUpload from './pages/admin/BulkUpload'
import TrackList from './pages/admin/TrackList'
import TrackEditor from './pages/admin/TrackEditor'
import Photos from './pages/admin/Photos'
import People from './pages/admin/People'
import Invite from './pages/admin/Invite'

function AdminRoute({ children }) {
  const { session, isAdmin, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen text-[var(--color-text-muted)]">Loading...</div>
  if (!session || !isAdmin) return <Navigate to="/admin/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Catalog />} />
        <Route path="/browse/timeline" element={<Timeline />} />
        <Route path="/browse/players" element={<Players />} />
        <Route path="/browse/players/:id" element={<PlayerProfile />} />
        <Route path="/browse/instruments" element={<Instruments />} />
        <Route path="/browse/albums" element={<Albums />} />
        <Route path="/browse/albums/:id" element={<AlbumDetail />} />
        <Route path="/browse/genres" element={<Genres />} />
      </Route>

      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin/accept-invite" element={<AcceptInvite />} />

      <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route path="/admin" element={<Navigate to="/admin/tracks" replace />} />
        <Route path="/admin/upload" element={<BulkUpload />} />
        <Route path="/admin/tracks" element={<TrackList />} />
        <Route path="/admin/tracks/:id" element={<TrackEditor />} />
        <Route path="/admin/photos" element={<Photos />} />
        <Route path="/admin/people" element={<People />} />
        <Route path="/admin/invite" element={<Invite />} />
      </Route>
    </Routes>
  )
}
