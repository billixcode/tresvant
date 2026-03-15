import React from 'react';
import { X } from 'lucide-react';
import { usePlayer } from '../../hooks/usePlayer';
import { useSlideshow } from '../../hooks/useSlideshow';

export default function SlideshowOverlay({ setShowSlideshow }) {
  const { isPlaying } = usePlayer();
  const { currentPhoto } = useSlideshow(isPlaying);

  const hasPhoto = !!currentPhoto;
  const caption = currentPhoto?.caption || '';
  const location = currentPhoto?.location || '';
  const photoDate = currentPhoto?.photo_date || '';
  const captionParts = [caption, location, photoDate].filter(Boolean);
  const showCaption = captionParts.length > 0;

  return (
    <div className="fixed inset-0 z-40 bg-black" style={{ bottom: 96 }}>
      {/* Dismiss button */}
      <button
        onClick={() => setShowSlideshow(false)}
        className="absolute top-4 right-4 z-50 text-white/70 hover:text-white transition-colors cursor-pointer"
        aria-label="Close slideshow"
      >
        <X size={28} />
      </button>

      {/* Photo or placeholder */}
      <div className="w-full h-full flex items-center justify-center overflow-hidden">
        {hasPhoto ? (
          <img
            key={currentPhoto.url || currentPhoto.src}
            src={currentPhoto.url || currentPhoto.src}
            alt={caption || 'Slideshow photo'}
            className="max-w-full max-h-full object-contain animate-[crossfade_1s_ease-in-out]"
          />
        ) : (
          <span className="text-white/30 text-4xl font-light tracking-widest select-none">
            Tresvant
          </span>
        )}
      </div>

      {/* Caption bar */}
      {hasPhoto && showCaption && (
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded px-3 py-2 text-sm text-white/80">
          {captionParts.join(' \u00b7 ')}
        </div>
      )}

      <style>{`
        @keyframes crossfade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
