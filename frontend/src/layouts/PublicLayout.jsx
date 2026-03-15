import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Menu, X, Music } from 'lucide-react';
import { usePlayer } from '../hooks/usePlayer';
import PlayerBar from '../components/player/PlayerBar';
import SlideshowOverlay from '../components/player/SlideshowOverlay';

const navLinks = [
  { to: '/', label: 'Songs' },
  { to: '/browse/timeline', label: 'Timeline' },
  { to: '/browse/players', label: 'Players' },
  { to: '/browse/instruments', label: 'Instruments' },
  { to: '/browse/albums', label: 'Albums' },
  { to: '/browse/genres', label: 'Genres' },
];

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { showSlideshow } = usePlayer();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        '--color-brand': '#1a1a2e',
        '--color-surface': '#16213e',
        '--color-surface-light': '#0f3460',
        '--color-accent': '#e94560',
        '--color-text': '#eaeaea',
        '--color-text-muted': '#a0a0b0',
      }}
    >
      {/* Navigation */}
      <nav className="bg-[var(--color-brand)] text-[var(--color-text)] shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Brand */}
            <Link
              to="/"
              className="flex items-center gap-2 text-xl font-bold tracking-wide text-[var(--color-accent)] shrink-0"
            >
              <Music className="w-5 h-5" />
              Tresvant
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[var(--color-surface-light)] text-white'
                        : 'text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-surface)]'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </div>

            {/* Admin link (desktop) */}
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `hidden md:inline-flex px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-surface)]'
                }`
              }
            >
              Admin
            </NavLink>

            {/* Mobile hamburger */}
            <button
              type="button"
              className="md:hidden p-2 rounded-md text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-surface)] transition-colors"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-[var(--color-surface)] border-t border-[var(--color-surface-light)]">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setMenuOpen(false)}
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
              <NavLink
                to="/admin"
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-surface-light)]'
                  }`
                }
              >
                Admin
              </NavLink>
            </div>
          </div>
        )}
      </nav>

      {/* Page content */}
      <main className="has-player flex-1 bg-[var(--color-brand)] text-[var(--color-text)] pb-24">
        <Outlet />
      </main>

      {/* Slideshow overlay */}
      {showSlideshow && <SlideshowOverlay />}

      {/* Persistent player bar */}
      <PlayerBar />
    </div>
  );
}
