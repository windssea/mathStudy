import { useId, useState } from 'react';

/** The next step is primary; automatic playback and settings are optional. */
export default function StepControls({
  step,
  last,
  onStep,
  playing,
  onPlay,
  speed,
  onSpeed,
  onReset,
  staticMode = false,
  onStatic,
}: {
  step: number;
  last: number;
  onStep: (step: number) => void;
  playing: boolean;
  onPlay: () => void;
  speed: number;
  onSpeed: (speed: number) => void;
  onReset: () => void;
  staticMode?: boolean;
  onStatic?: () => void;
}) {
  const id = useId();
  const [settings, setSettings] = useState(false);
  return (
    <div className="step-controls">
      <div className="step-primary">
        <button
          className="button secondary"
          disabled={step === 0 || staticMode}
          onClick={() => onStep(step - 1)}
        >
          上一步
        </button>
        <label className="step-timeline" htmlFor={id}>
          <span>
            {step + 1} / {last + 1} 步
          </span>
          <input
            id={id}
            aria-label="演示步骤"
            type="range"
            min={0}
            max={last}
            value={step}
            disabled={staticMode}
            onChange={(e) => onStep(Number(e.target.value))}
          />
        </label>
        <button
          className="button primary"
          disabled={step === last || staticMode}
          onClick={() => onStep(step + 1)}
        >
          下一步
        </button>
        <button
          className="button subtle"
          aria-expanded={settings}
          onClick={() => setSettings(!settings)}
        >
          演示设置
        </button>
      </div>
      {settings && (
        <div className="step-settings">
          <button className="button secondary" disabled={staticMode} onClick={onPlay}>
            {playing ? '暂停' : '播放演示'}
          </button>
          <label>
            播放速度
            <select value={speed} onChange={(e) => onSpeed(Number(e.target.value))}>
              <option value={0.75}>0.75倍</option>
              <option value={1}>1倍</option>
              <option value={1.5}>1.5倍</option>
            </select>
          </label>
          <button className="button subtle" onClick={onReset}>
            重新演示
          </button>
          {onStatic && (
            <button className="button subtle" aria-pressed={staticMode} onClick={onStatic}>
              {staticMode ? '返回动态演示' : '查看静态步骤'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
