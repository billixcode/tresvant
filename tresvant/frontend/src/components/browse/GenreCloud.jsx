import { Tag, Play } from 'lucide-react';

function formatDuration(secs) {
  if (!secs && secs !== 0) return '--:--';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function GenreCloud({
  genreCounts,
  selectedGenre,
  onGenreSelect,
  filteredTracks,
  playTrack,
  currentTrack,
}) {
  // Calculate font size range based on frequency
  const counts = Object.values(genreCounts);
  const maxCount = Math.max(...counts, 1);
  const minCount = Math.min(...counts, 1);

  function getSize(count) {
    if (maxCount === minCount) return 1;
    const ratio = (count - minCount) / (maxCount - minCount);
    return 0.75 + ratio * 1.5; // 0.75rem to 2.25rem
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Tag size={24} className="text-[var(--color-accent)]" />
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Genres</h1>
      </div>

      {/* Tag cloud */}
      <div className="flex flex-wrap items-center gap-3 mb-8 p-6 rounded-xl border border-white/10 bg-[var(--color-surface)]">
        {Object.entries(genreCounts).length === 0 ? (
          <p className="text-[var(--color-text-muted)]">No genres found.</p>
        ) : (
          Object.entries(genreCounts)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([genre, count]) => {
              const isActive = selectedGenre === genre;
              return (
                <button
                  key={genre}
                  onClick={() => onGenreSelect(isActive ? null : genre)}
                  className={`rounded-full px-3 py-1 transition cursor-pointer ${
                    isActive
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'bg-[var(--color-surface-light)] text-[var(--color-text)] hover:bg-[var(--color-accent)]/20'
                  }`}
                  style={{ fontSize: `${getSize(count)}rem` }}
                >
                  {genre}
                  <span className="ml-1 text-[0.65em] opacity-60">{count}</span>
                </button>
              );
            })
        )}
      </div>

      {/* Filtered track grid */}
      {selectedGenre && (
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">
            {selectedGenre}{' '}
            <span className="text-sm font-normal text-[var(--color-text-muted)]">
              ({filteredTracks.length} {filteredTracks.length === 1 ? 'track' : 'tracks'})
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredTracks.map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <button
                  key={track.id}
                  onClick={() => playTrack(track, filteredTracks)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition cursor-pointer ${
                    isCurrent
                      ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]'
                      : 'bg-[var(--color-surface)] hover:bg-[var(--color-surface-light)] text-[var(--color-text)]'
                  }`}
                >
                  <Play size={14} className="shrink-0 opacity-60" />
                  <span className="flex-1 truncate text-sm font-medium">
                    {track.title || 'Untitled'}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)] shrink-0">
                    {formatDuration(track.duration_secs)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
