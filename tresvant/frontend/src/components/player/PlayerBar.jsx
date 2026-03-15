import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Image,
} from 'lucide-react';
import { usePlayer } from '../../hooks/usePlayer';

function formatTime(seconds) {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PlayerBar({ showSlideshow, setShowSlideshow }) {
  const {
    currentTrack,
    isPlaying,
    currentTime: elapsed,
    duration,
    volume,
    isMuted,
    play,
    pause,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
  } = usePlayer();

  const hasTrack = !!currentTrack;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface)]/95 backdrop-blur-sm border-t border-white/10">
      {/* Seek bar - full width on mobile, sits at the very top of the bar */}
      <div className="flex items-center gap-2 px-3 sm:hidden">
        <span className="text-[10px] text-white/50 w-8 text-right tabular-nums">
          {formatTime(elapsed)}
        </span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={elapsed || 0}
          onChange={(e) => seek(Number(e.target.value))}
          disabled={!hasTrack}
          className="flex-1 h-1 accent-white cursor-pointer disabled:cursor-default disabled:opacity-30"
          aria-label="Seek"
        />
        <span className="text-[10px] text-white/50 w-8 tabular-nums">
          {formatTime(duration)}
        </span>
      </div>

      {/* Main controls row */}
      <div className="flex items-center px-3 sm:px-4 py-2 sm:py-3 gap-3 sm:gap-4">
        {/* Track info */}
        <div className="flex-1 min-w-0">
          {hasTrack ? (
            <div className="truncate text-xs sm:text-sm text-white/90">
              {currentTrack.title}
            </div>
          ) : (
            <div className="truncate text-xs sm:text-sm text-white/40">
              No track selected
            </div>
          )}
        </div>

        {/* Transport controls + seek bar (desktop) */}
        <div className="flex flex-col items-center gap-1 sm:flex-[2] sm:max-w-xl sm:w-full">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={previous}
              disabled={!hasTrack}
              className="text-white/70 hover:text-white disabled:text-white/20 transition-colors cursor-pointer disabled:cursor-default"
              aria-label="Previous track"
            >
              <SkipBack size={18} />
            </button>

            <button
              onClick={isPlaying ? pause : play}
              disabled={!hasTrack}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-white text-black hover:bg-white/90 disabled:bg-white/20 disabled:text-white/40 transition-colors cursor-pointer disabled:cursor-default"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </button>

            <button
              onClick={next}
              disabled={!hasTrack}
              className="text-white/70 hover:text-white disabled:text-white/20 transition-colors cursor-pointer disabled:cursor-default"
              aria-label="Next track"
            >
              <SkipForward size={18} />
            </button>
          </div>

          {/* Seek bar - desktop only (inline with transport) */}
          <div className="hidden sm:flex items-center gap-2 w-full">
            <span className="text-xs text-white/50 w-10 text-right tabular-nums">
              {formatTime(elapsed)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={elapsed || 0}
              onChange={(e) => seek(Number(e.target.value))}
              disabled={!hasTrack}
              className="flex-1 h-1 accent-white cursor-pointer disabled:cursor-default disabled:opacity-30"
              aria-label="Seek"
            />
            <span className="text-xs text-white/50 w-10 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume + slideshow */}
        <div className="flex items-center gap-2 sm:gap-3 sm:flex-1 sm:justify-end">
          <button
            onClick={toggleMute}
            className="hidden sm:block text-white/70 hover:text-white transition-colors cursor-pointer"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="hidden sm:block w-24 h-1 accent-white cursor-pointer"
            aria-label="Volume"
          />

          <button
            onClick={() => setShowSlideshow(true)}
            disabled={!hasTrack}
            className="text-white/70 hover:text-white disabled:text-white/20 transition-colors cursor-pointer disabled:cursor-default"
            aria-label="Open slideshow"
          >
            <Image size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
