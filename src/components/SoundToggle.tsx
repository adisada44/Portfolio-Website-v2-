import { Waveform } from '@phosphor-icons/react/dist/csr/Waveform';
import { WaveformSlash } from '@phosphor-icons/react/dist/csr/WaveformSlash';

type SoundToggleProps = {
  isSoundOn: boolean;
  onToggle: () => void;
};

export default function SoundToggle({
  isSoundOn,
  onToggle,
}: SoundToggleProps) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      aria-pressed={isSoundOn}
      aria-label={isSoundOn ? 'Turn off interface sounds' : 'Turn on interface sounds'}
      className="sound-control interactive-control flex cursor-pointer items-center gap-2 font-medium text-copy"
    >
      <span aria-hidden="true">
        {isSoundOn ? 'Turn off sound' : 'Turn on sound'}
      </span>
      <span className="sound-toggle-icon relative block size-5" aria-hidden="true">
        <Waveform
          size={20}
          weight="regular"
          className={isSoundOn ? 'sound-icon-on is-visible' : 'sound-icon-on'}
        />
        <WaveformSlash
          size={20}
          weight="regular"
          className={isSoundOn ? 'sound-icon-off' : 'sound-icon-off is-visible'}
        />
      </span>
    </button>
  );
}
