import { useState } from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import { Menu, X, Music, LogOut, ExternalLink } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePlayer } from '../hooks/usePlayer';
import PlayerBar from '../components/player/PlayerBar';
import SlideshowOverlay from '../components/player/SlideshowOverlay';

const sidebarLinks = [
  { to: '/admin/tracks', label: 'Tracks' },
  { to: '/admin/upload', label: 'Upload' },
  { to: '/admin/photos', label: 'Photos' },
  { to: '/admin/people', label: 'People' },
  { to: '/admin/invite', label: 'Invite' },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut } = useAuth();
  const { showSlideshow } = usePlayer();

  return (
    <div
      className="min-h-screen flex"
      style={{
        '--color-brand': '#1a1a2e',
        '--color-surface': '#16213e',
        '--color-surface-light': '#0f3460',
        '--color-accent': '#e94560',
        '--color-text': '#eaeaea',
        '--color-text-muted': '#a0a0b0',
      }}
    >
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-[var(--color-brand)] border-b border-[var(--color-surface-light)] flex items-center justify-between h-14 px-4">
        <NavLink to="/admin" className="flex items-center gap-2 text-lg font-bold text-[var(--color-accent)]">
          <Music className="w-5 h-5" />
          Admin
        </NavLink>
        <div className="flex items-center gap-2">
          <Link to="/" className="p-2 rounded-md text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-surface)] transition-colors">
            <ExternalLink className="w-5 h-5" />
          </Link>
          <button
            type="button"
            className="p-2 rounded-md text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-surface)] transition-colors"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-40 h-screen w-60
          bg-[var(--color-surface)] text-[var(--color-text)]
          flex flex-col border-r border-[var(--color-surface-light)]
          transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Sidebar header */}
        <div className="flex items-center gap-2 px-5 h-14 border-b border-[var(--color-surface-light)]">
          <Music className="w-5 h-5 text-[var(--color-accent)]" />
          <span className="text-lg font-bold text-[var(--color-accent)]">Admin</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {sidebarLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--color-surface-light)] text-white'
                    : 'text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-surface-light)]'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* View site + Logout */}
        <div className="shrink-0 px-3 py-4 pb-24 border-t border-[var(--color-surface-light)] space-y-1">
          <Link
            to="/"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-surface-light)] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View Site
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-accent)] transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-0">
        <main className="has-player flex-1 bg-[var(--color-brand)] text-[var(--color-text)] pt-14 md:pt-0 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      {/* Slideshow overlay */}
      {showSlideshow && <SlideshowOverlay />}

      {/* Persistent player bar */}
      <PlayerBar />
    </div>
  );
}
