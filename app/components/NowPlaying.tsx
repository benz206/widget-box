import type { NowPlaying as Track } from "@/lib/api/spotify";
import { useAlbumColor, useNowPlaying, useProgress } from "@/lib/widgets/system/spotify";

function Card({ track }: { track: Track }) {
  const progress = useProgress(track);
  const color = useAlbumColor(track.art);
  return (
    <div
      className="now-playing animate-fade-in"
      data-paused={track.playing ? undefined : true}
      style={color ? { background: color.tint } : undefined}
    >
      {track.art && <img src={track.art} alt="" />}
      <div className="now-playing-text">
        <strong className="truncate">{track.title}</strong>
        <span className="truncate">{track.artist}</span>
        <div className="now-playing-bar" aria-hidden>
          <span style={{ width: `${(progress / track.durationMs) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

export default function NowPlaying() {
  const { data: track } = useNowPlaying();
  return track ? <Card track={track} /> : null;
}
