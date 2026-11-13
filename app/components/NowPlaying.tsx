import type { NowPlaying as Track } from "@/lib/api/spotify";
import Icon from "@/app/components/ui/Icon";
import { formatClock } from "@/app/components/widgets/kit";
import { useNowPlaying, useProgress } from "@/lib/widgets/system/spotify";

function Card({ track }: { track: Track }) {
  const progress = useProgress(track);
  return (
    <div
      className="now-playing corner-card material squircle animate-fade-in"
      data-paused={track.playing ? undefined : true}
    >
      {track.art ? <img src={track.art} alt="" /> : <span className="now-playing-art" />}
      <div className="now-playing-text">
        <strong className="truncate">{track.title}</strong>
        <span className="truncate">
          {track.artist}
          <span className="tabular"> · {formatClock(progress / 1000)}</span>
        </span>
      </div>
      {track.playing ? (
        <span className="now-playing-eq">
          <i />
          <i />
          <i />
          <span className="sr-only">Playing</span>
        </span>
      ) : (
        <>
          <Icon name="pause" size={14} />
          <span className="sr-only">Paused</span>
        </>
      )}
      <span className="now-playing-bar" aria-hidden style={{ width: `${(progress / track.durationMs) * 100}%` }} />
    </div>
  );
}

export default function NowPlaying() {
  const { data: track } = useNowPlaying();
  return track ? <Card track={track} /> : null;
}
