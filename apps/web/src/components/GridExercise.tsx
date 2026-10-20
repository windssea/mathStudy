import type { GridFigure, QuestionPublic } from '@mathstudy/contracts';

export function CellDrawing({
  cells,
  boundary = false,
}: {
  cells: [number, number][];
  boundary?: boolean;
}) {
  const occupied = new Set(cells.map(([x, y]) => `${x},${y}`));
  return (
    <g>
      {cells.map(([x, y]) => (
        <g key={`${x},${y}`}>
          <rect
            x={x * 36}
            y={y * 36}
            width="36"
            height="36"
            fill="#dfe9ff"
            stroke="#97b1df"
            strokeWidth="1"
          />
          {boundary &&
            (
              [
                [0, -1, 0, 0, 36, 0],
                [1, 0, 36, 0, 36, 36],
                [0, 1, 0, 36, 36, 36],
                [-1, 0, 0, 0, 0, 36],
              ] as const
            ).map(
              ([dx, dy, x1, y1, x2, y2], i) =>
                !occupied.has(`${x + dx},${y + dy}`) && (
                  <line
                    key={i}
                    x1={x * 36 + x1}
                    y1={y * 36 + y1}
                    x2={x * 36 + x2}
                    y2={y * 36 + y2}
                    stroke="#bc4e3c"
                    strokeWidth="3"
                  />
                ),
            )}
        </g>
      ))}
    </g>
  );
}
export function GridFigureView({ figure }: { figure: GridFigure }) {
  return (
    <figure className="question-figure">
      <div>
        {figure.shapes.map((shape) => (
          <svg
            key={shape.label}
            viewBox={`-10 -10 ${figure.columns * 36 + 20} ${figure.rows * 36 + 20}`}
            role="img"
            aria-label={`${shape.label}，${figure.unitLabel}`}
          >
            <CellDrawing cells={shape.cells} />
          </svg>
        ))}
      </div>
      <figcaption>{figure.unitLabel}</figcaption>
    </figure>
  );
}
export function initialDrawing(task: NonNullable<QuestionPublic['construction']>) {
  return Array.from({ length: task.columns * task.rows }, (_, i) =>
    task.given?.includes(i) ? '1' : '0',
  ).join('');
}
export function GridEditor({
  task,
  value,
  onChange,
}: {
  task: NonNullable<QuestionPublic['construction']>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid-exercise">
      <div
        className="drawing-board"
        role="group"
        aria-label="方格作图"
        style={{ gridTemplateColumns: `repeat(${task.columns},minmax(0,1fr))` }}
      >
        {[...value].map((cell, i) => (
          <button
            key={i}
            type="button"
            aria-label={`第${Math.floor(i / task.columns) + 1}行第${(i % task.columns) + 1}列${task.given?.includes(i) ? '，已知方格' : ''}`}
            aria-pressed={cell === '1'}
            data-given={task.given?.includes(i)}
            disabled={task.given?.includes(i)}
            onClick={() =>
              onChange(value.slice(0, i) + (cell === '1' ? '0' : '1') + value.slice(i + 1))
            }
          />
        ))}
      </div>
      <div className="drawing-actions">
        <output aria-live="polite">已选{[...value].filter((c) => c === '1').length}格</output>
        <button
          className="button subtle"
          type="button"
          onClick={() => onChange(initialDrawing(task))}
        >
          清空作图
        </button>
      </div>
    </div>
  );
}
