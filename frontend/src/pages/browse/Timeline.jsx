import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { usePlayer } from '../../hooks/usePlayer';
import TimelineComponent from '../../components/browse/Timeline';

export default function Timeline() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { playTrack, currentTrack, isPlaying } = usePlayer();

  useEffect(() => {
    async function fetchTracks() {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .eq('status', 'published')
        .order('recorded_date', { ascending: true });

      if (!error && data) setTracks(data);
      setLoading(false);
    }
    fetchTracks();
  }, []);

  // Group by year descending, tracks within each year ascending by date
  const yearMap = {};
  for (const track of tracks) {
    const year = track.recorded_date
      ? new Date(track.recorded_date).getFullYear()
      : 'Unknown';
    if (!yearMap[year]) yearMap[year] = [];
    yearMap[year].push(track);
  }

  const yearGroups = Object.entries(yearMap)
    .sort(([a], [b]) => {
      if (a === 'Unknown') return 1;
      if (b === 'Unknown') return -1;
      return Number(b) - Number(a);
    })
    .map(([year, yearTracks]) => ({
      year,
      tracks: yearTracks.sort((a, b) =>
        (a.recorded_date || '').localeCompare(b.recorded_date || '')
      ),
    }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[var(--color-text-muted)]">Loading timeline...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <TimelineComponent
        yearGroups={yearGroups}
        allTracks={tracks}
        playTrack={playTrack}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
      />
    </div>
  );
}
