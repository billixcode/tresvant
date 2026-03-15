import { useState } from 'react';
import { Music, Play, ChevronDown, ChevronRight } from 'lucide-react';

function formatDuration(secs) {
  if (!secs && secs !== 0) return '--:--';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function InstrumentRow({ name, data, playTrack, currentTrack }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-white/10 bg-[var(--color-surface)] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--color-surface-light)] transition"
      >
        {expanded ? (
          <ChevronDown size={16} className="text-[var(--color-accent)]" />
        ) : (
          <ChevronRight size={16} className="text-[var(--color-accent)]" />
        )}
        <Music size={16} className="text-[var(--color-text-muted)]" />
        <span className="text-sm font-semibold text-[var(--color-text)] flex-1 text-left">
          {name}
        </span>
        <span className="text-xs text-[var(--color-text-muted)]">
          {data.tracks.length} {data.tracks.length === 1 ? 'track' : 'tracks'}
        </span>
        <span className="text-xs text-[var(--color-text-muted)] hidden sm:inline ml-2 max-w-[200px] truncate">
          {data.players.join(', ')}
        </span>
      </button>

      {expanded && (
        <div className="px-2 pb-2 space-y-0.5">
          {data.tracks.map((entry) => {
            const isCurrent = currentTrack?.id === entry.track.id;
            return (
              <button
                key={`${entry.track.id}-${entry.playerName}`}
                onClick={() =>
                  playTrack(entry.track, data.tracks.map((e) => e.track))
                }
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition cursor-pointer ${
                  isCurrent
                    ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]'
                    : 'hover:bg-[var(--color-surface-light)] text-[var(--color-text)]'
                }`}
              >
                <Play size={14} className="shrink-0 opacity-60" />
                <span className="flex-1 truncate text-sm">{entry.track.title || 'Untitled'}</span>
                <span
                  className={`text-xs shrink-0 ${
                    isCurrent ? 'text-[var(--color-accent)]' : 'text-[var(--color-accent)]/70'
                  } font-medium`}
                >
                  {entry.playerName}
                </span>
                <span className="text-xs text-[var(--color-text-muted)] shrink-0 w-12 text-right">
                  {formatDuration(entry.track.duration_secs)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function InstrumentBrowser({ instruments, playTrack, currentTrack }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Music size={24} className="text-[var(--color-accent)]" />
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Instruments</h1>
      </div>

      {instruments.length === 0 ? (
        <p className="text-[var(--color-text-muted)] text-center py-12">No instruments found.</p>
      ) : (
        <div className="space-y-2">
          {instruments.map(([name, data]) => (
            <InstrumentRow
              key={name}
              name={name}
              data={data}
              playTrack={playTrack}
              currentTrack={currentTrack}
            />
          ))}
        </div>
      )}
    </div>
  );
}
