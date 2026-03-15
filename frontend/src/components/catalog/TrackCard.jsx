import { Play, Clock } from 'lucide-react';

function formatDuration(seconds) {
  if (!seconds || !isFinite(seconds)) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TrackCard({ track, personnel, onClick, onPlay, viewMode }) {
  const personnelNames = (personnel || []).slice(0, 3).map((p) => p.name);
  const personnelSummary = personnelNames.join(', ');

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onClick?.(track)}
        className="group flex items-center gap-4 px-4 py-3 bg-[var(--color-surface)] hover:bg-[var(--color-surface-light)] border border-white/5 hover:border-white/10 rounded-lg cursor-pointer transition-all"
      >
        {/* Play button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay?.(track);
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-accent)] text-white opacity-0 group-hover:opacity-100 transition-opacity shrink-0 cursor-pointer"
          aria-label={`Play ${track.title}`}
        >
          <Play size={14} className="ml-0.5" />
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--color-text)] truncate">
            {track.title}
          </p>
        </div>

        {/* Album */}
        <div className="hidden sm:block flex-1 min-w-0">
          <p className="text-sm text-[var(--color-text-muted)] truncate">
            {track.album || '--'}
          </p>
        </div>

        {/* Personnel */}
        <div className="hidden md:block flex-1 min-w-0">
          <p className="text-sm text-[var(--color-text-muted)] truncate">
            {personnelSummary || '--'}
          </p>
        </div>

        {/* Recorded date */}
        <div className="hidden lg:block w-28 shrink-0">
          <p className="text-sm text-[var(--color-text-muted)]">
            {track.recorded_date || '--'}
          </p>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-1 text-sm text-[var(--color-text-muted)] w-16 shrink-0 justify-end">
          <Clock size={12} />
          {formatDuration(track.duration)}
        </div>
      </div>
    );
  }

  // Grid mode
  return (
    <div
      onClick={() => onClick?.(track)}
      className="group relative bg-[var(--color-surface)] hover:bg-[var(--color-surface-light)] border border-white/5 hover:border-white/10 rounded-xl p-4 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20"
    >
      {/* Play button overlay */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPlay?.(track);
        }}
        className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full bg-[var(--color-accent)] text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg cursor-pointer"
        aria-label={`Play ${track.title}`}
      >
        <Play size={18} className="ml-0.5" />
      </button>

      {/* Title */}
      <h3 className="text-base font-semibold text-[var(--color-text)] mb-1 pr-10 truncate">
        {track.title}
      </h3>

      {/* Album */}
      <p className="text-sm text-[var(--color-text-muted)] mb-3 truncate">
        {track.album || 'Unknown Album'}
      </p>

      {/* Metadata row */}
      <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] mb-3">
        {track.recorded_date && (
          <span>{track.recorded_date}</span>
        )}
        <span className="flex items-center gap-1">
          <Clock size={12} />
          {formatDuration(track.duration)}
        </span>
      </div>

      {/* Personnel */}
      {personnelSummary && (
        <p className="text-xs text-[var(--color-text-muted)] truncate">
          {personnelSummary}
          {(personnel || []).length > 3 && ` +${personnel.length - 3}`}
        </p>
      )}
    </div>
  );
}
