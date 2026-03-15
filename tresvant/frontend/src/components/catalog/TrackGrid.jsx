import TrackCard from './TrackCard';

export default function TrackGrid({ tracks, personnelMap, viewMode, onTrackClick, onPlayTrack }) {
  if (!tracks || tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg text-[var(--color-text-muted)] mb-1">No tracks found</p>
        <p className="text-sm text-[var(--color-text-muted)]/60">
          Try adjusting your filters or search query.
        </p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="flex flex-col gap-1">
        {/* List header */}
        <div className="flex items-center gap-4 px-4 py-2 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide border-b border-white/5">
          <div className="w-8 shrink-0" />
          <div className="flex-1">Title</div>
          <div className="hidden sm:block flex-1">Album</div>
          <div className="hidden md:block flex-1">Personnel</div>
          <div className="hidden lg:block w-28 shrink-0">Recorded</div>
          <div className="w-16 shrink-0 text-right">Duration</div>
        </div>
        {tracks.map((track) => (
          <TrackCard
            key={track.id}
            track={track}
            personnel={personnelMap?.[track.id] || []}
            viewMode="list"
            onClick={onTrackClick}
            onPlay={onPlayTrack}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {tracks.map((track) => (
        <TrackCard
          key={track.id}
          track={track}
          personnel={personnelMap?.[track.id] || []}
          viewMode="grid"
          onClick={onTrackClick}
          onPlay={onPlayTrack}
        />
      ))}
    </div>
  );
}
