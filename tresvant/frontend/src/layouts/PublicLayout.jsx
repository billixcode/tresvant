import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, Music } from 'lucide-react';
import { usePlayer } from '../hooks/usePlayer';
import { supabase, getPublicUrl } from '../lib/supabase';
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
  const [bgPhoto, setBgPhoto] = useState(null);
  const [bgCaption, setBgCaption] = useState('');
  const [showCaption, setShowCaption] = useState(false);
  const [typedText, setTypedText] = useState('');
  const { showSlideshow } = usePlayer();
  const location = useLocation();
  const photosRef = useRef(null);

  useEffect(() => {
    async function pickPhoto() {
      if (!photosRef.current) {
        const { data } = await supabase
          .from('photos')
          .select('storage_path, caption')
          .eq('featured', true)
        photosRef.current = data || []
      }
      const photos = photosRef.current
      if (photos.length) {
        const pick = photos[Math.floor(Math.random() * photos.length)]
        setBgPhoto(getPublicUrl('photos', pick.storage_path))
        const fallback = pick.storage_path.split('/').pop().replace(/^[a-f0-9-]+_/, '').replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ')
        setBgCaption(pick.caption || fallback)
        setShowCaption(false)
        setTypedText('')
      }
    }
    pickPhoto()
  }, [location.pathname])

  useEffect(() => {
    if (!showCaption || !bgCaption) return
    const fullText = `"${bgCaption}"\n— Tresvant`
    let i = 0
    setTypedText('')
    const interval = setInterval(() => {
      i++
      setTypedText(fullText.slice(0, i))
      if (i >= fullText.length) clearInterval(interval)
    }, 35)
    return () => clearInterval(interval)
  }, [showCaption, bgCaption])

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

      {/* Background photo */}
      {bgPhoto && (
        <div
          className="fixed inset-0 -z-10 bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: `url(${bgPhoto})` }}
        >
          <div className={`absolute inset-0 transition-all duration-700 ${
            showCaption
              ? 'bg-[var(--color-brand)]/40 backdrop-blur-none'
              : 'bg-[var(--color-brand)]/85 backdrop-blur-sm'
          }`} />
        </div>
      )}

      {/* About this photo */}
      {bgPhoto && (
        <div className="fixed bottom-20 sm:bottom-28 right-3 sm:right-4 z-30 text-right">
          {showCaption ? (
            <div className="max-w-[280px] sm:max-w-xs rounded-lg bg-black/60 backdrop-blur-md px-4 py-3">
              <p className="text-sm italic text-white/90 whitespace-pre-line">{typedText}<span className="animate-pulse">|</span></p>
              <button
                onClick={() => setShowCaption(false)}
                className="mt-2 text-xs text-white/50 hover:text-white/80 transition-colors"
              >
                close
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCaption(true)}
              className="rounded-full bg-black/40 backdrop-blur-md px-3 py-1.5 text-xs text-white/70 hover:text-white hover:bg-black/60 transition-colors"
            >
              about this photo
            </button>
          )}
        </div>
      )}

      {/* Page content */}
      <main className="has-player flex-1 text-[var(--color-text)]">
        <Outlet />
      </main>

      {/* Slideshow overlay */}
      {showSlideshow && <SlideshowOverlay />}

      {/* Persistent player bar */}
      <PlayerBar />
    </div>
  );
}
