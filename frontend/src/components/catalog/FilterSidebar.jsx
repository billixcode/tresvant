import { useState } from 'react';
import { Filter, ChevronDown } from 'lucide-react';

export default function FilterSidebar({ filters, onFilterChange, albums, genres }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const updateFilter = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const toggleGenre = (genre) => {
    const current = filters.genres || [];
    const next = current.includes(genre)
      ? current.filter((g) => g !== genre)
      : [...current, genre];
    updateFilter('genres', next);
  };

  const sidebar = (
    <div className="space-y-6">
      {/* Album filter */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
          Album
        </label>
        <select
          value={filters.album || ''}
          onChange={(e) => updateFilter('album', e.target.value)}
          className="w-full rounded-lg bg-[var(--color-surface-light)] text-[var(--color-text)] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        >
          <option value="">All Albums</option>
          {albums.map((album) => (
            <option key={album} value={album}>
              {album}
            </option>
          ))}
        </select>
      </div>

      {/* Genre filter */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
          Genre
        </label>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {genres.map((genre) => (
            <label
              key={genre}
              className="flex items-center gap-2 text-sm text-[var(--color-text)] cursor-pointer hover:text-white transition-colors"
            >
              <input
                type="checkbox"
                checked={(filters.genres || []).includes(genre)}
                onChange={() => toggleGenre(genre)}
                className="rounded border-white/20 bg-[var(--color-surface-light)] accent-[var(--color-accent)]"
              />
              {genre}
            </label>
          ))}
        </div>
      </div>

      {/* Recorded date range */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
          Recorded Date
        </label>
        <div className="flex flex-col gap-2">
          <input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => updateFilter('dateFrom', e.target.value)}
            placeholder="From"
            className="w-full rounded-lg bg-[var(--color-surface-light)] text-[var(--color-text)] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
          <input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => updateFilter('dateTo', e.target.value)}
            placeholder="To"
            className="w-full rounded-lg bg-[var(--color-surface-light)] text-[var(--color-text)] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </div>
      </div>

      {/* Personnel name search */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
          Personnel
        </label>
        <input
          type="text"
          value={filters.personnel || ''}
          onChange={(e) => updateFilter('personnel', e.target.value)}
          placeholder="Search by name..."
          className="w-full rounded-lg bg-[var(--color-surface-light)] text-[var(--color-text)] border border-white/10 px-3 py-2 text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-surface)] text-[var(--color-text)] border border-white/10 text-sm mb-4 cursor-pointer"
      >
        <Filter size={16} />
        Filters
        <ChevronDown
          size={16}
          className={`transition-transform ${mobileOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Mobile collapsible */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileOpen ? 'max-h-[1000px] opacity-100 mb-6' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="rounded-xl bg-[var(--color-surface)] border border-white/10 p-4">
          {sidebar}
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 shrink-0 rounded-xl bg-[var(--color-surface)] border border-white/10 p-5 h-fit sticky top-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)] mb-4">
          <Filter size={16} />
          Filters
        </h3>
        {sidebar}
      </aside>
    </>
  );
}
