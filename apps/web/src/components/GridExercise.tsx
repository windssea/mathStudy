import { Button } from './ui/button';
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
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
            fill="var(--sky-soft)"
            stroke="var(--sky)"
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
                    stroke="var(--destructive)"
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
  const [active, setActive] = useState(() =>
    [...value].findIndex((_, i) => !task.given?.includes(i)),
  );
  const [undo, setUndo] = useState<string[]>([]);
  const helpId = useId();
  const board = useRef<HTMLDivElement>(null);
  const lastValue = useRef(value);
  useEffect(() => {
    if (lastValue.current !== value) setUndo([]);
    lastValue.current = value;
  }, [value]);
  function change(next: string) {
    if (next === value) return;
    setUndo((previous) => [...previous.slice(-49), value]);
    lastValue.current = next;
    onChange(next);
  }
  function restore() {
    const previous = undo.at(-1);
    if (previous === undefined) return;
    setUndo((items) => items.slice(0, -1));
    lastValue.current = previous;
    onChange(previous);
  }
  function move(index: number, key: string) {
    const row = Math.floor(index / task.columns);
    const column = index % task.columns;
    const dx = key === 'ArrowLeft' ? -1 : key === 'ArrowRight' ? 1 : 0;
    const dy = key === 'ArrowUp' ? -1 : key === 'ArrowDown' ? 1 : 0;
    let x = key === 'Home' ? 0 : key === 'End' ? task.columns - 1 : column + dx;
    let y = row + dy;
    const stepX = key === 'Home' ? 1 : key === 'End' ? -1 : dx;
    while (x >= 0 && x < task.columns && y >= 0 && y < task.rows) {
      const target = y * task.columns + x;
      if (!task.given?.includes(target)) {
        setActive(target);
        board.current?.querySelector<HTMLButtonElement>(`[data-cell="${target}"]`)?.focus();
        return;
      }
      x += stepX;
      y += dy;
    }
  }
  return (
    <div className="grid-exercise" style={{ '--grid-columns': task.columns } as CSSProperties}>
      <div
        className="drawing-board"
        ref={board}
        role="group"
        aria-label="方格作图"
        aria-describedby={helpId}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
            event.preventDefault();
            restore();
          }
        }}
        style={{ gridTemplateColumns: `repeat(${task.columns},minmax(0,1fr))` }}
      >
        {[...value].map((cell, i) => (
          <button
            key={i}
            type="button"
            aria-label={`第${Math.floor(i / task.columns) + 1}行第${(i % task.columns) + 1}列${task.given?.includes(i) ? '，已知方格' : ''}`}
            aria-pressed={cell === '1'}
            data-cell={i}
            tabIndex={i === active ? 0 : -1}
            data-given={task.given?.includes(i)}
            disabled={task.given?.includes(i)}
            onFocus={() => setActive(i)}
            onKeyDown={(event) => {
              if (
                ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(
                  event.key,
                )
              ) {
                event.preventDefault();
                move(i, event.key);
              }
            }}
            onClick={() =>
              change(value.slice(0, i) + (cell === '1' ? '0' : '1') + value.slice(i + 1))
            }
          />
        ))}
      </div>
      <p id={helpId} className="sr-only">
        方向键移动，空格选中或取消，Ctrl 或 Command 加 Z 撤销。
      </p>
      <div className="drawing-actions">
        <output aria-live="polite">已选{[...value].filter((c) => c === '1').length}格</output>
        <Button
          variant="ghost"
          className="button subtle"
          type="button"
          onClick={() => change(initialDrawing(task))}
        >
          清空作图
        </Button>
        <Button variant="outline" type="button" disabled={!undo.length} onClick={restore}>
          撤销
        </Button>
      </div>
    </div>
  );
}
