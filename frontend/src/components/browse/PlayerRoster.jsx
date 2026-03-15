import { User, Music } from 'lucide-react';

export default function PlayerRoster({ players, onPlayerClick }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <User size={24} className="text-[var(--color-accent)]" />
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Players</h1>
      </div>

      {players.length === 0 ? (
        <p className="text-[var(--color-text-muted)] text-center py-12">No players found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((player) => (
            <button
              key={player.id}
              onClick={() => onPlayerClick(player.id)}
              className="flex flex-col gap-2 rounded-xl border border-white/10 bg-[var(--color-surface)] p-4 text-left transition hover:bg-[var(--color-surface-light)] hover:border-[var(--color-accent)]/30 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <User size={18} className="text-[var(--color-accent)]" />
                <span className="text-lg font-semibold text-[var(--color-text)] truncate">
                  {player.name}
                </span>
              </div>

              {player.instruments.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {player.instruments.map((inst) => (
                    <span
                      key={inst}
                      className="inline-flex items-center gap-1 rounded-full bg-[var(--color-surface-light)] px-2.5 py-0.5 text-xs text-[var(--color-text-muted)]"
                    >
                      <Music size={10} />
                      {inst}
                    </span>
                  ))}
                </div>
              )}

              <span className="text-xs text-[var(--color-text-muted)] mt-auto">
                {player.trackCount} {player.trackCount === 1 ? 'track' : 'tracks'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
