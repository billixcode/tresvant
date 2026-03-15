import { Disc, Clock } from 'lucide-react';

function formatDuration(secs) {
  if (!secs && secs !== 0) return '--:--';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatTotalDuration(secs) {
  if (!secs) return '0:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AlbumGrid({ albums, onAlbumClick }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Disc size={24} className="text-[var(--color-accent)]" />
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Albums</h1>
      </div>

      {albums.length === 0 ? (
        <p className="text-[var(--color-text-muted)] text-center py-12">No albums found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {albums.map((album) => (
            <button
              key={album.name}
              onClick={() => onAlbumClick(album.name)}
              className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[var(--color-surface)] p-4 text-left transition hover:bg-[var(--color-surface-light)] hover:border-[var(--color-accent)]/30 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Disc size={18} className="text-[var(--color-accent)]" />
                <span className="text-lg font-semibold text-[var(--color-text)] truncate">
                  {album.name}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                <span>
                  {album.trackCount} {album.trackCount === 1 ? 'track' : 'tracks'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {formatTotalDuration(album.totalDuration)}
                </span>
              </div>

              {album.dateRange && (
                <span className="text-xs text-[var(--color-text-muted)]">{album.dateRange}</span>
              )}

              {album.personnel.length > 0 && (
                <p className="text-xs text-[var(--color-text-muted)] truncate">
                  {album.personnel.join(', ')}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
