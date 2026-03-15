import { ArrowLeft, Play, Filter } from 'lucide-react';

function formatDuration(secs) {
  if (!secs && secs !== 0) return '--:--';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PlayerProfileComponent({
  person,
  instruments,
  tracks,
  selectedInstrument,
  onInstrumentChange,
  onBack,
  playTrack,
  currentTrack,
}) {
  const filteredTracks = selectedInstrument
    ? tracks.filter((t) => t.instrument === selectedInstrument)
    : tracks;

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition mb-6 cursor-pointer"
      >
        <ArrowLeft size={16} />
        Back to Players
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">{person.name}</h1>
        {person.bio && (
          <p className="text-[var(--color-text-muted)] text-sm leading-relaxed max-w-2xl">
            {person.bio}
          </p>
        )}
        {instruments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {instruments.map((inst) => (
              <span
                key={inst}
                className="rounded-full bg-[var(--color-surface-light)] px-3 py-1 text-xs text-[var(--color-text-muted)]"
              >
                {inst}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Instrument filter */}
      <div className="flex items-center gap-3 mb-4">
        <Filter size={16} className="text-[var(--color-text-muted)]" />
        <select
          value={selectedInstrument}
          onChange={(e) => onInstrumentChange(e.target.value)}
          className="rounded-lg bg-[var(--color-surface-light)] text-[var(--color-text)] border border-white/10 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        >
          <option value="">All Instruments</option>
          {instruments.map((inst) => (
            <option key={inst} value={inst}>
              {inst}
            </option>
          ))}
        </select>
        <span className="text-sm text-[var(--color-text-muted)]">
          {filteredTracks.length} {filteredTracks.length === 1 ? 'track' : 'tracks'}
        </span>
      </div>

      {/* Track grid */}
      {filteredTracks.length === 0 ? (
        <p className="text-[var(--color-text-muted)] text-center py-12">No tracks found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filteredTracks.map((t) => {
            const isCurrent = currentTrack?.id === t.track.id;
            return (
              <button
                key={`${t.track.id}-${t.instrument}`}
                onClick={() => playTrack(t.track, filteredTracks.map((ft) => ft.track))}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition cursor-pointer ${
                  isCurrent
                    ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]'
                    : 'bg-[var(--color-surface)] hover:bg-[var(--color-surface-light)] text-[var(--color-text)]'
                }`}
              >
                <Play size={14} className="shrink-0 opacity-60" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.track.title || 'Untitled'}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{t.instrument}</p>
                </div>
                <span className="text-xs text-[var(--color-text-muted)] shrink-0">
                  {formatDuration(t.track.duration_secs)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
