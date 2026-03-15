import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { usePlayer } from '../../hooks/usePlayer';
import InstrumentBrowser from '../../components/browse/InstrumentBrowser';

export default function Instruments() {
  const [instruments, setInstruments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { playTrack, currentTrack } = usePlayer();

  useEffect(() => {
    async function fetchData() {
      const { data: personnel, error: tpErr } = await supabase
        .from('track_personnel')
        .select('instrument, track_id, person_id');

      if (tpErr || !personnel) {
        setLoading(false);
        return;
      }

      const trackIds = [...new Set(personnel.map((tp) => tp.track_id))];
      const personIds = [...new Set(personnel.map((tp) => tp.person_id))];

      const [{ data: tracks }, { data: people }] = await Promise.all([
        supabase
          .from('tracks')
          .select('*')
          .eq('status', 'published')
          .in('id', trackIds),
        supabase.from('people').select('id, name').in('id', personIds),
      ]);

      const trackMap = {};
      for (const t of tracks || []) trackMap[t.id] = t;
      const personMap = {};
      for (const p of people || []) personMap[p.id] = p.name;

      const instMap = {};
      for (const tp of personnel) {
        const instName = tp.instrument || 'Unknown';
        const track = trackMap[tp.track_id];
        if (!track) continue;

        if (!instMap[instName]) {
          instMap[instName] = { tracks: [], players: new Set() };
        }
        instMap[instName].tracks.push({
          track,
          playerName: personMap[tp.person_id] || 'Unknown',
        });
        if (personMap[tp.person_id]) {
          instMap[instName].players.add(personMap[tp.person_id]);
        }
      }

      const sorted = Object.entries(instMap)
        .map(([name, data]) => [name, { ...data, players: [...data.players].sort() }])
        .sort(([a], [b]) => a.localeCompare(b));

      setInstruments(sorted);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[var(--color-text-muted)]">Loading instruments...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <InstrumentBrowser
        instruments={instruments}
        playTrack={playTrack}
        currentTrack={currentTrack}
      />
    </div>
  );
}
