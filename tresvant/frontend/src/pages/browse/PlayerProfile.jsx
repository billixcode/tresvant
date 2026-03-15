import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { usePlayer } from '../../hooks/usePlayer';
import PlayerProfileComponent from '../../components/browse/PlayerProfile';

export default function PlayerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playTrack, currentTrack } = usePlayer();
  const [person, setPerson] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [selectedInstrument, setSelectedInstrument] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      const { data: personData, error: pErr } = await supabase
        .from('people')
        .select('*')
        .eq('id', id)
        .single();

      if (pErr || !personData) {
        setLoading(false);
        return;
      }
      setPerson(personData);

      const { data: personnel, error: tpErr } = await supabase
        .from('track_personnel')
        .select('instrument, track_id')
        .eq('person_id', id);

      if (tpErr || !personnel || personnel.length === 0) {
        setLoading(false);
        return;
      }

      const trackIds = [...new Set(personnel.map((tp) => tp.track_id))];
      const { data: trackData, error: tErr } = await supabase
        .from('tracks')
        .select('*')
        .eq('status', 'published')
        .in('id', trackIds);

      if (tErr) {
        setLoading(false);
        return;
      }

      const trackMap = {};
      for (const t of trackData || []) trackMap[t.id] = t;

      const instSet = new Set();
      const trackList = [];
      for (const tp of personnel) {
        if (trackMap[tp.track_id]) {
          if (tp.instrument) instSet.add(tp.instrument);
          trackList.push({
            track: trackMap[tp.track_id],
            instrument: tp.instrument || 'Unknown',
          });
        }
      }

      setInstruments([...instSet].sort());
      setTracks(trackList);
      setLoading(false);
    }
    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[var(--color-text-muted)]">Loading profile...</p>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[var(--color-text-muted)]">Player not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <PlayerProfileComponent
        person={person}
        instruments={instruments}
        tracks={tracks}
        selectedInstrument={selectedInstrument}
        onInstrumentChange={setSelectedInstrument}
        onBack={() => navigate('/browse/players')}
        playTrack={playTrack}
        currentTrack={currentTrack}
      />
    </div>
  );
}
