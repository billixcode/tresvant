import { useState, useEffect, useMemo } from 'react';
import { LayoutGrid, List, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { usePlayer } from '../hooks/usePlayer';
import FilterSidebar from '../components/catalog/FilterSidebar';
import TrackGrid from '../components/catalog/TrackGrid';
import TrackDetailDrawer from '../components/catalog/TrackDetailDrawer';

export default function Catalog() {
  const { playTrack } = usePlayer();

  const [tracks, setTracks] = useState([]);
  const [personnelMap, setPersonnelMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem('catalog-view') || 'grid'
  );
  const [filters, setFilters] = useState({
    album: '',
    genres: [],
    dateFrom: '',
    dateTo: '',
    personnel: '',
  });

  // Persist view mode
  useEffect(() => {
    localStorage.setItem('catalog-view', viewMode);
  }, [viewMode]);

  // Fetch tracks and personnel
  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const { data: trackData, error: trackError } = await supabase
        .from('tracks')
        .select('*')
        .eq('status', 'published')
        .order('recorded_date', { ascending: false });

      if (trackError) {
        console.error('Error fetching tracks:', trackError);
        setLoading(false);
        return;
      }

      setTracks(trackData || []);

      // Fetch personnel for all tracks
      const trackIds = (trackData || []).map((t) => t.id);
      if (trackIds.length > 0) {
        const { data: tpData } = await supabase
          .from('track_personnel')
          .select('track_id, instrument, role, people(id, name)')
          .in('track_id', trackIds);

        const map = {};
        (tpData || []).forEach((tp) => {
          if (!map[tp.track_id]) map[tp.track_id] = [];
          map[tp.track_id].push({
            person_id: tp.people?.id,
            name: tp.people?.name,
            instrument: tp.instrument,
            role: tp.role,
          });
        });
        setPersonnelMap(map);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  // Derive distinct albums and genres
  const albums = useMemo(() => {
    const set = new Set(tracks.map((t) => t.album).filter(Boolean));
    return Array.from(set).sort();
  }, [tracks]);

  const genres = useMemo(() => {
    const set = new Set();
    tracks.forEach((t) => {
      if (Array.isArray(t.genre)) {
        t.genre.forEach((g) => set.add(g));
      } else if (t.genre) {
        set.add(t.genre);
      }
    });
    return Array.from(set).sort();
  }, [tracks]);

  // Filter and search tracks
  const filteredTracks = useMemo(() => {
    let result = tracks;

    // Album filter
    if (filters.album) {
      result = result.filter((t) => t.album === filters.album);
    }

    // Genre filter
    if (filters.genres.length > 0) {
      result = result.filter((t) => {
        const trackGenres = Array.isArray(t.genre) ? t.genre : t.genre ? [t.genre] : [];
        return filters.genres.some((g) => trackGenres.includes(g));
      });
    }

    // Date range filter
    if (filters.dateFrom) {
      result = result.filter((t) => t.recorded_date && t.recorded_date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      result = result.filter((t) => t.recorded_date && t.recorded_date <= filters.dateTo);
    }

    // Personnel name filter
    if (filters.personnel) {
      const q = filters.personnel.toLowerCase();
      result = result.filter((t) => {
        const people = personnelMap[t.id] || [];
        return people.some((p) => p.name?.toLowerCase().includes(q));
      });
    }

    // Text search across title and personnel names
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((t) => {
        if (t.title?.toLowerCase().includes(q)) return true;
        const people = personnelMap[t.id] || [];
        return people.some((p) => p.name?.toLowerCase().includes(q));
      });
    }

    return result;
  }, [tracks, personnelMap, filters, search]);

  const handlePlay = (track) => {
    playTrack(track, filteredTracks);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6 h-10 w-48 rounded-lg bg-[var(--color-surface)] animate-pulse" />
        <div className="flex gap-6">
          <div className="hidden md:block w-64 shrink-0 h-96 rounded-xl bg-[var(--color-surface)] animate-pulse" />
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-36 rounded-xl bg-[var(--color-surface)] animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Catalog</h1>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 sm:w-72">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tracks..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--color-surface)] text-[var(--color-text)] border border-white/10 text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>

          {/* View toggle */}
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-white'
              }`}
              aria-label="Grid view"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-white'
              }`}
              aria-label="List view"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex gap-6">
        <FilterSidebar
          filters={filters}
          onFilterChange={setFilters}
          albums={albums}
          genres={genres}
        />

        <div className="flex-1 min-w-0">
          <TrackGrid
            tracks={filteredTracks}
            personnelMap={personnelMap}
            viewMode={viewMode}
            onTrackClick={setSelectedTrack}
            onPlayTrack={handlePlay}
          />
        </div>
      </div>

      {/* Detail drawer */}
      <TrackDetailDrawer
        track={selectedTrack}
        personnel={selectedTrack ? personnelMap[selectedTrack.id] || [] : []}
        onClose={() => setSelectedTrack(null)}
        onPlay={handlePlay}
      />
    </div>
  );
}
