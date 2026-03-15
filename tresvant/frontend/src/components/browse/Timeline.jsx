import { useState } from 'react';
import { ChevronDown, ChevronRight, Play, Calendar } from 'lucide-react';

function formatDuration(secs) {
  if (!secs && secs !== 0) return '--:--';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function TrackRow({ track, allTracks, playTrack, currentTrack, isPlaying }) {
  const isCurrent = currentTrack?.id === track.id;

  return (
    <button
      onClick={() => playTrack(track, allTracks)}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition cursor-pointer ${
        isCurrent
          ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]'
          : 'hover:bg-[var(--color-surface-light)] text-[var(--color-text)]'
      }`}
    >
      <Play size={14} className="shrink-0 opacity-60" />
      <span className="flex-1 truncate text-sm font-medium">{track.title || 'Untitled'}</span>
      {track.recorded_date && (
        <span className="text-xs text-[var(--color-text-muted)] shrink-0">
          {track.recorded_date}
        </span>
      )}
      <span className="text-xs text-[var(--color-text-muted)] shrink-0 w-12 text-right">
        {formatDuration(track.duration_secs)}
      </span>
    </button>
  );
}

function YearSection({ year, tracks, allTracks, playTrack, currentTrack, isPlaying }) {
  const [open, setOpen] = useState(true);
  const isCompact = tracks.length <= 3;

  return (
    <div className="rounded-xl border border-white/10 bg-[var(--color-surface)] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--color-surface-light)] transition"
      >
        {open ? (
          <ChevronDown size={18} className="text-[var(--color-accent)]" />
        ) : (
          <ChevronRight size={18} className="text-[var(--color-accent)]" />
        )}
        <Calendar size={16} className="text-[var(--color-text-muted)]" />
        <span className="text-lg font-semibold text-[var(--color-text)]">{year}</span>
        <span className="text-sm text-[var(--color-text-muted)]">
          {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
        </span>
      </button>

      {open && (
        <div className={`px-2 pb-2 ${isCompact ? 'flex flex-wrap gap-1' : 'space-y-0.5'}`}>
          {tracks.map((track) => (
            <div key={track.id} className={isCompact ? 'flex-1 min-w-[200px]' : ''}>
              <TrackRow
                track={track}
                allTracks={allTracks}
                playTrack={playTrack}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TimelineComponent({ yearGroups, allTracks, playTrack, currentTrack, isPlaying }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <Calendar size={24} className="text-[var(--color-accent)]" />
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Timeline</h1>
      </div>

      {yearGroups.length === 0 ? (
        <p className="text-[var(--color-text-muted)] text-center py-12">No tracks found.</p>
      ) : (
        yearGroups.map(({ year, tracks }) => (
          <YearSection
            key={year}
            year={year}
            tracks={tracks}
            allTracks={allTracks}
            playTrack={playTrack}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
          />
        ))
      )}
    </div>
  );
}
