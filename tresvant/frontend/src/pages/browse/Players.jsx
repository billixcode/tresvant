import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import PlayerRoster from '../../components/browse/PlayerRoster';

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPlayers() {
      const { data: people, error: pErr } = await supabase
        .from('people')
        .select('id, name');

      if (pErr || !people) {
        setLoading(false);
        return;
      }

      const { data: personnel, error: tpErr } = await supabase
        .from('track_personnel')
        .select('person_id, instrument, track_id');

      if (tpErr) {
        setLoading(false);
        return;
      }

      const personnelByPerson = {};
      for (const tp of personnel || []) {
        if (!personnelByPerson[tp.person_id]) {
          personnelByPerson[tp.person_id] = { instruments: new Set(), trackIds: new Set() };
        }
        if (tp.instrument) personnelByPerson[tp.person_id].instruments.add(tp.instrument);
        personnelByPerson[tp.person_id].trackIds.add(tp.track_id);
      }

      const result = people.map((p) => ({
        id: p.id,
        name: p.name,
        instruments: [...(personnelByPerson[p.id]?.instruments || [])],
        trackCount: personnelByPerson[p.id]?.trackIds.size || 0,
      }));

      result.sort((a, b) => a.name.localeCompare(b.name));
      setPlayers(result);
      setLoading(false);
    }
    fetchPlayers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[var(--color-text-muted)]">Loading players...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <PlayerRoster
        players={players}
        onPlayerClick={(id) => navigate(`/browse/players/${id}`)}
      />
    </div>
  );
}
