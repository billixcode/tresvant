import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import AlbumGrid from '../../components/browse/AlbumGrid';

export default function Albums() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchAlbums() {
      const { data: tracks, error: tErr } = await supabase
        .from('tracks')
        .select('*')
        .eq('status', 'published');

      if (tErr || !tracks) {
        setLoading(false);
        return;
      }

      // Get personnel for all tracks
      const trackIds = tracks.map((t) => t.id);
      const { data: personnel } = await supabase
        .from('track_personnel')
        .select('track_id, person_id')
        .in('track_id', trackIds);

      const personIds = [...new Set((personnel || []).map((tp) => tp.person_id))];
      const { data: people } = personIds.length > 0
        ? await supabase.from('people').select('id, name').in('id', personIds)
        : { data: [] };

      const personMap = {};
      for (const p of people || []) personMap[p.id] = p.name;

      const personnelByTrack = {};
      for (const tp of personnel || []) {
        if (!personnelByTrack[tp.track_id]) personnelByTrack[tp.track_id] = new Set();
        if (personMap[tp.person_id]) personnelByTrack[tp.track_id].add(personMap[tp.person_id]);
      }

      // Group by album
      const albumMap = {};
      for (const track of tracks) {
        const albumName = track.album || 'Untagged';
        if (!albumMap[albumName]) {
          albumMap[albumName] = { tracks: [], personnel: new Set() };
        }
        albumMap[albumName].tracks.push(track);
        const tp = personnelByTrack[track.id];
        if (tp) tp.forEach((name) => albumMap[albumName].personnel.add(name));
      }

      const result = Object.entries(albumMap).map(([name, data]) => {
        const dates = data.tracks
          .map((t) => t.recorded_date)
          .filter(Boolean)
          .sort();
        const dateRange =
          dates.length > 0
            ? dates.length === 1
              ? dates[0]
              : `${dates[0]} - ${dates[dates.length - 1]}`
            : null;

        const totalDuration = data.tracks.reduce(
          (sum, t) => sum + (t.duration_secs || 0),
          0
        );

        return {
          name,
          trackCount: data.tracks.length,
          dateRange,
          totalDuration,
          personnel: [...data.personnel].sort(),
        };
      });

      result.sort((a, b) => {
        if (a.name === 'Untagged') return 1;
        if (b.name === 'Untagged') return -1;
        return a.name.localeCompare(b.name);
      });

      setAlbums(result);
      setLoading(false);
    }
    fetchAlbums();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[var(--color-text-muted)]">Loading albums...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <AlbumGrid
        albums={albums}
        onAlbumClick={(name) =>
          navigate(`/browse/albums/${encodeURIComponent(name)}`)
        }
      />
    </div>
  );
}
