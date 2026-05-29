/**
 * React hook for streaming playback via YouTube audio streams.
 *
 * Audio is fetched from YouTube in the main process (cupid-audio:// protocol)
 * and played via HTML5 Audio. Same interface as useAudioPlayer.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export default function useStreamingPlayer(tracks, playMode = 'normal') {
  const audioRef = useRef(new Audio());
  const playModeRef = useRef(playMode);
  playModeRef.current = playMode;
  const nextIdxRef = useRef(null);
  const [trackIndex, setTrackIndex] = useState(0);

  const prevTracksRef = useRef(tracks);
  if (prevTracksRef.current !== tracks) {
    prevTracksRef.current = tracks;
    nextIdxRef.current = null;
    setTrackIndex(0);
  }
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying;
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [volume, setVolumeState] = useState(() => {
    const saved = localStorage.getItem('cass-volume');
    return saved !== null ? parseFloat(saved) : 1;
  });
  const [muted, setMuted] = useState(false);

  const audio = audioRef.current;
  audio.volume = muted ? 0 : volume;
  audio.preload = 'auto';

  const track = tracks[trackIndex] ?? {
    title: 'No track',
    artist: '',
    art: null,
    uri: null,
  };

  async function resolveTrackStream(t) {
    if (!t) throw new Error('No track');

    if (t.videoId) {
      try {
        return await window.cupid.getStreamUrlById(t.videoId);
      } catch (err) {
        console.warn('Direct video ID stream failed, falling back to search:', err.message);
      }
    }

    return window.cupid.getStreamUrl(t.title, t.artist);
  }

  useEffect(() => {
    if (tracks.length === 0) return;
    const t = tracks[trackIndex];
    if (!t) return;

    let cancelled = false;
    setLoading(true);

    async function loadStream() {
      try {
        const url = await resolveTrackStream(t);
        if (cancelled) return;
        audio.src = url;
        if (isPlayingRef.current) {
          audio.play().catch(() => {});
        }
      } catch (err) {
        console.error('Failed to get stream:', err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadStream();

    return () => { cancelled = true; };
  }, [trackIndex, tracks]);

  useEffect(() => {
    if (tracks.length === 0) {
      nextIdxRef.current = null;
      return;
    }

    const prefetched = new Set([trackIndex]);
    const prefetch = (idx) => {
      if (idx < 0 || idx >= tracks.length || prefetched.has(idx)) return;
      const t = tracks[idx];
      if (!t) return;
      prefetched.add(idx);
      resolveTrackStream(t).catch(() => {});
    };

    let nextIdx;
    if (playMode === 'shuffle' && tracks.length > 1) {
      do {
        nextIdx = Math.floor(Math.random() * tracks.length);
      } while (nextIdx === trackIndex);
    } else {
      nextIdx = (trackIndex + 1) % tracks.length;
    }
    nextIdxRef.current = nextIdx;

    // Keep prefetch fanout intentionally small; multiple parallel yt-dlp
    // calls can trigger intermittent extraction failures.
    prefetch(nextIdx);
  }, [trackIndex, tracks, playMode]);

  useEffect(() => {
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) {
        setProgress(audio.currentTime / audio.duration);
      }
    };

    const onLoadedMetadata = () => { setDuration(audio.duration); };

    const onEnded = () => {
      if (playModeRef.current === 'repeat') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }
      setTrackIndex((prev) => {
        if (nextIdxRef.current !== null && nextIdxRef.current !== prev) {
          return nextIdxRef.current;
        }
        if (playModeRef.current === 'shuffle' && tracks.length > 1) {
          let next;
          do { next = Math.floor(Math.random() * tracks.length); } while (next === prev);
          return next;
        }
        return (prev + 1) % tracks.length;
      });
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [tracks.length]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const next = useCallback(() => {
    setTrackIndex((prev) => {
      if (nextIdxRef.current !== null && nextIdxRef.current !== prev) {
        return nextIdxRef.current;
      }
      if (playModeRef.current === 'shuffle' && tracks.length > 1) {
        let n;
        do { n = Math.floor(Math.random() * tracks.length); } while (n === prev);
        return n;
      }
      return (prev + 1) % tracks.length;
    });
    setIsPlaying(true);
  }, [tracks.length]);

  const prev = useCallback(() => {
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
    } else {
      setTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
    }
    setIsPlaying(true);
  }, [tracks.length]);

  const seek = useCallback((fraction) => {
    if (audio.duration) {
      audio.currentTime = Math.min(fraction, 1) * audio.duration;
    }
  }, []);

  const setVolume = useCallback((v) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    audio.volume = clamped;
    localStorage.setItem('cass-volume', clamped);
    if (clamped > 0) setMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      audio.volume = m ? volume : 0;
      return !m;
    });
  }, [volume]);

  return {
    track,
    trackIndex,
    isPlaying,
    progress,
    duration,
    currentTime,
    togglePlay,
    next,
    prev,
    seek,
    volume,
    setVolume,
    muted,
    toggleMute,
    loading,
  };
}
