import { useEffect, useState } from 'react';
import { IconButton, Slider } from '@mui/material';
import { PauseOutlined, PlayArrowOutlined } from '@mui/icons-material';

const FONT = 'Roboto, sans-serif';

const clock = (s: number) => `0:${String(Math.floor(s)).padStart(2, '0')}`;

/** Placeholder label, play button, file name, timeline and length — the audio
 *  row of the single-project editor. The clip is a stand-in, so "playing" only
 *  moves the playhead. */
export const AudioPlayerRow = ({ label, name, seconds }: { label: string; name: string; seconds: number }) => {
  const [playing, setPlaying] = useState(false);
  const [at, setAt] = useState(0);

  useEffect(() => {
    if (!playing) return undefined;
    const t = setInterval(() => setAt((v) => Math.min(v + 0.1, seconds)), 100);
    return () => clearInterval(t);
  }, [playing, seconds]);
  useEffect(() => { if (at >= seconds) setPlaying(false); }, [at, seconds]);

  const toggle = () => {
    if (!playing && at >= seconds) setAt(0);
    setPlaying((p) => !p);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ width: 120, flexShrink: 0, fontSize: 14, fontWeight: 500, fontFamily: FONT, color: '#1f1d25' }}>{label}</span>
      <IconButton size="small" aria-label={playing ? `Pause ${name}` : `Play ${name}`} onClick={toggle}>
        {playing ? <PauseOutlined /> : <PlayArrowOutlined />}
      </IconButton>
      <span style={{ width: 200, flexShrink: 0, fontSize: 14, fontFamily: FONT, color: '#1f1d25', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
      <Slider
        size="small" min={0} max={seconds} step={0.1} value={at} aria-label={`${name} timeline`}
        onChange={(_, v) => setAt(v as number)}
        sx={{ flex: 1, color: '#473bab', '& .MuiSlider-thumb': { width: 12, height: 12 }, '& .MuiSlider-rail': { opacity: 0.3 } }}
      />
      <span style={{ fontSize: 13, fontFamily: FONT, color: '#1f1d25', width: 32, textAlign: 'right' }}>{clock(seconds)}</span>
    </div>
  );
};
