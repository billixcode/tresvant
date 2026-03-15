import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { usePlayer } from '../../hooks/usePlayer';
import GenreCloud from '../../components/browse/GenreCloud';

export default function Genres() {
  const [tracks, setTracks] = useState([]);
  const [genreCounts, setGenreCounts] = useState({});
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [loading, setLoading] = useState(true);
  const { playTrack, currentTrack } = usePlayer();

  useEffect(() => {
    async function fetchTracks() {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .eq('status', 'published');

      if (!error && data) {
        setTracks(data);

        // Count genre occurrences
        const counts = {};
        for (const track of data) {
          const genres = track.genre || [];
          for (const g of genres) {
            counts[g] = (counts[g] || 0) + 1;
          }
        }
        setGenreCounts(counts);
      }
      setLoading(false);
    }
    fetchTracks();
  }, []);

  const filteredTracks = selectedGenre
    ? tracks.filter((t) => (t.genre || []).includes(selectedGenre))
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[var(--color-text-muted)]">Loading genres...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <GenreCloud
        genreCounts={genreCounts}
        selectedGenre={selectedGenre}
        onGenreSelect={setSelectedGenre}
        filteredTracks={filteredTracks}
        playTrack={playTrack}
        currentTrack={currentTrack}
      />
    </div>
  );
}
