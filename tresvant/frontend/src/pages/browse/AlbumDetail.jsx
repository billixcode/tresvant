import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { usePlayer } from '../../hooks/usePlayer';
import { ArrowLeft, Disc, Play, Clock } from 'lucide-react';

function formatDuration(secs) {
  if (!secs && secs !== 0) return '--:--';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AlbumDetail() {
  const { id } = useParams();
  const albumName = decodeURIComponent(id);
  const navigate = useNavigate();
  const { playTrack, currentTrack } = usePlayer();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTracks() {
      let query = supabase
        .from('tracks')
        .select('*')
        .eq('status', 'published');

      if (albumName === 'Untagged') {
        query = query.is('album', null);
      } else {
        query = query.eq('album', albumName);
      }

      const { data, error } = await query.order('track_number', { ascending: true });

      if (!error && data) setTracks(data);
      setLoading(false);
    }
    fetchTracks();
  }, [albumName]);

  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration_secs || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[var(--color-text-muted)]">Loading album...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/browse/albums')}
        className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition mb-6 cursor-pointer"
      >
        <ArrowLeft size={16} />
        Back to Albums
      </button>

      <div className="flex items-center gap-3 mb-2">
        <Disc size={28} className="text-[var(--color-accent)]" />
        <h1 className="text-3xl font-bold text-[var(--color-text)]">{albumName}</h1>
      </div>

      <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)] mb-8">
        <span>
          {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={14} />
          {formatDuration(totalDuration)}
        </span>
      </div>

      {tracks.length === 0 ? (
        <p className="text-[var(--color-text-muted)] text-center py-12">No tracks in this album.</p>
      ) : (
        <div className="space-y-1">
          {tracks.map((track, idx) => {
            const isCurrent = currentTrack?.id === track.id;
            return (
              <button
                key={track.id}
                onClick={() => playTrack(track, tracks)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition cursor-pointer ${
                  isCurrent
                    ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]'
                    : 'hover:bg-[var(--color-surface-light)] text-[var(--color-text)]'
                }`}
              >
                <span className="text-xs text-[var(--color-text-muted)] w-6 text-right shrink-0">
                  {track.track_number || idx + 1}
                </span>
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
      )}
    </div>
  );
}
