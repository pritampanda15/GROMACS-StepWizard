import React, { useEffect, useRef, useState } from 'react';
import { Film, Maximize2, Pause, Play, RotateCcw, Upload } from 'lucide-react';

interface MovieClip {
  id: 'membrane' | 'protein';
  label: string;
  title: string;
  subtitle: string;
  src: string;
}

const MOVIE_CLIPS: MovieClip[] = [
  {
    id: 'membrane',
    label: 'Membrane · Lipid Bilayer',
    title: 'Transmembrane Protein · Lipid Bilayer MD',
    subtitle: 'CHARMM36 semi-isotropic NPT · 310.15 K',
    src: './media/membrane_bilayer_md.mp4',
  },
  {
    id: 'protein',
    label: 'Protein · Ligand Complex',
    title: 'Protein–Ligand Binding Dynamics',
    subtitle: 'Explicit solvent NPT · GPU-resident GROMACS',
    src: './media/protein_ligand_md.mp4',
  },
];

const SPEEDS = [0.5, 1, 1.5, 2];

export const MdMoviePlayer: React.FC<{
  dtFs?: number;
  temperatureK?: number;
}> = ({ dtFs = 2, temperatureK = 300 }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [activeId, setActiveId] = useState<'membrane' | 'protein' | 'custom'>('membrane');
  const [customUrl, setCustomUrl] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState<string>('Custom MD Trajectory');
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const currentClip =
    activeId === 'custom'
      ? {
          title: customTitle,
          subtitle: 'Local MD trajectory video',
          src: customUrl ?? MOVIE_CLIPS[0].src,
        }
      : MOVIE_CLIPS.find((c) => c.id === activeId) ?? MOVIE_CLIPS[0];

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = speed;
  }, [speed, activeId, customUrl]);

  useEffect(() => {
    return () => {
      if (customUrl) URL.revokeObjectURL(customUrl);
    };
  }, [customUrl]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const restart = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {});
    setPlaying(true);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      wrapRef.current?.requestFullscreen().catch(() => {});
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (customUrl) URL.revokeObjectURL(customUrl);
    const url = URL.createObjectURL(file);
    setCustomUrl(url);
    setCustomTitle(file.name.replace(/\.(mp4|webm|mov)$/i, ''));
    setActiveId('custom');
    setPlaying(true);
    e.target.value = '';
  };

  return (
    <div className="space-y-2.5">
      {/* Top Apple Movie Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="inline-flex items-center gap-1.5 flex-wrap">
          {MOVIE_CLIPS.map((clip) => {
            const active = activeId === clip.id;
            return (
              <button
                key={clip.id}
                type="button"
                onClick={() => {
                  setActiveId(clip.id);
                  setPlaying(true);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-medium transition-all cursor-pointer border ${
                  active
                    ? 'bg-[#0071e3] text-white border-[#0071e3] shadow-[0_4px_12px_rgba(0,113,227,0.3)]'
                    : 'apple-glass text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Film className="w-3 h-3" />
                <span>{clip.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-medium transition-all cursor-pointer border ${
              activeId === 'custom'
                ? 'bg-[#30d158] text-black border-[#30d158]'
                : 'apple-glass text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title="Preview your own MP4/WebM MD trajectory movie"
          >
            <Upload className="w-3 h-3" />
            <span>Load Video</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleUpload}
            className="hidden"
          />
        </div>

        <span className="text-[11px] font-mono text-[var(--text-tertiary)] tabular-nums">
          dt={dtFs} fs · {temperatureK} K
        </span>
      </div>

      {/* Apple-Framed Video Stage */}
      <div
        ref={wrapRef}
        className="group relative w-full h-[350px] sm:h-[400px] rounded-[26px] overflow-hidden bg-[#04060b] text-white select-none shadow-[0_24px_60px_rgba(0,0,0,0.32)] border border-white/10 [&:fullscreen]:rounded-none [&:fullscreen]:h-screen"
      >
        <video
          key={currentClip.src}
          ref={videoRef}
          src={currentClip.src}
          autoPlay
          loop
          muted
          playsInline
          onClick={togglePlay}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            setDuration(v.duration || 0);
            v.playbackRate = speed;
          }}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            if (v.duration > 0) setProgress(v.currentTime / v.duration);
          }}
          className="w-full h-full object-cover cursor-pointer"
        />

        {/* Subtle top & bottom gradient scrims for crisp legibility */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/55 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />

        {/* Top-left live status pill */}
        <div className="absolute top-3.5 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/12 text-[11px] font-medium text-white/90">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#30d158] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#30d158]" />
          </span>
          <span>GROMACS MD Trajectory</span>
        </div>

        {/* Top-right speed & fullscreen controls */}
        <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
          <div className="hidden sm:flex rounded-full bg-black/45 p-0.5 backdrop-blur-md border border-white/12">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`rounded-full px-2 py-0.5 text-[11px] tabular-nums transition cursor-pointer ${
                  speed === s ? 'bg-white text-black font-medium' : 'text-white/75 hover:text-white'
                }`}
              >
                {s}×
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={restart}
            aria-label="Restart movie"
            className="w-7 h-7 rounded-full bg-black/45 hover:bg-black/65 backdrop-blur-md border border-white/12 flex items-center justify-center text-white/90 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? 'Pause movie' : 'Play movie'}
            className="w-7 h-7 rounded-full bg-black/45 hover:bg-black/65 backdrop-blur-md border border-white/12 flex items-center justify-center text-white/90 transition cursor-pointer"
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label="Full screen"
            className="w-7 h-7 rounded-full bg-black/45 hover:bg-black/65 backdrop-blur-md border border-white/12 flex items-center justify-center text-white/90 transition cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bottom caption & timeline scrubber */}
        <div className="absolute inset-x-4 bottom-3.5 space-y-1.5">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[13.5px] font-semibold tracking-[-0.01em] text-white truncate">
                {currentClip.title}
              </div>
              <div className="text-[11px] text-white/65 truncate">{currentClip.subtitle}</div>
            </div>
            <span className="font-mono text-[11px] text-white/70 tabular-nums shrink-0">
              {(progress * duration).toFixed(1)}s / {duration.toFixed(1)}s
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={1}
            step={0.002}
            value={progress}
            aria-label="Video timeline"
            onChange={(e) => {
              const frac = parseFloat(e.target.value);
              setProgress(frac);
              if (videoRef.current && duration > 0) {
                videoRef.current.currentTime = frac * duration;
              }
            }}
            className="md-movie-scrub w-full"
          />
        </div>
      </div>
    </div>
  );
};
