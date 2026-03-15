import { useEffect } from 'react';
import { X, Play, Music } from 'lucide-react';

function formatDuration(seconds) {
  if (!seconds || !isFinite(seconds)) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TrackDetailDrawer({ track, personnel, onClose, onPlay }) {
  // Lock body scroll when open
  useEffect(() => {
    if (track) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [track]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 ${
          track ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-[var(--color-surface)] border-l border-white/10 shadow-2xl transition-transform duration-300 ease-out ${
          track ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {track && (
          <div className="flex flex-col h-full overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                <Music size={18} />
                <span className="text-sm font-medium">Track Details</span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-[var(--color-text-muted)] hover:text-white transition-colors cursor-pointer"
                aria-label="Close drawer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-5 space-y-6">
              {/* Title & Play */}
              <div>
                <h2 className="text-xl font-bold text-[var(--color-text)] mb-3">
                  {track.title}
                </h2>
                <button
                  onClick={() => onPlay?.(track)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/80 text-white text-sm font-medium transition-colors cursor-pointer"
                >
                  <Play size={16} className="ml-0.5" />
                  Play Track
                </button>
              </div>

              {/* Metadata */}
              <div className="space-y-3">
                <MetadataRow label="Album" value={track.album} />
                <MetadataRow label="Duration" value={formatDuration(track.duration)} />
                <MetadataRow label="Recorded" value={track.recorded_date} />
                <MetadataRow label="Released" value={track.released_date} />
                <MetadataRow label="Key" value={track.key} />
                <MetadataRow label="BPM" value={track.bpm} />

                {/* Genre tags */}
                {track.genre && (
                  <div>
                    <dt className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">
                      Genre
                    </dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {(Array.isArray(track.genre) ? track.genre : [track.genre]).map(
                        (g) => (
                          <span
                            key={g}
                            className="px-2.5 py-1 rounded-full bg-[var(--color-surface-light)] text-xs text-[var(--color-text)]"
                          >
                            {g}
                          </span>
                        )
                      )}
                    </dd>
                  </div>
                )}

                {/* Notes */}
                {track.notes && (
                  <div>
                    <dt className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">
                      Notes
                    </dt>
                    <dd className="text-sm text-[var(--color-text)] leading-relaxed whitespace-pre-wrap">
                      {track.notes}
                    </dd>
                  </div>
                )}
              </div>

              {/* Personnel */}
              {personnel && personnel.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-3">
                    Personnel
                  </h3>
                  <div className="space-y-2">
                    {personnel.map((p, i) => (
                      <div
                        key={p.person_id || i}
                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--color-brand)]/50"
                      >
                        <span className="text-sm text-[var(--color-text)] font-medium">
                          {p.name}
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {[p.instrument, p.role].filter(Boolean).join(' \u00b7 ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function MetadataRow({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-0.5">
        {label}
      </dt>
      <dd className="text-sm text-[var(--color-text)]">{value}</dd>
    </div>
  );
}
