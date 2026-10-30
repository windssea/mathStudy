import type { Visual } from '@mathstudy/contracts';

type Stage = NonNullable<Visual['stages']>[number];

/** Text remains readable when the explanation pane is resized. */
export default function QuantityReasoningDiagram({ stage }: { stage: Stage }) {
  if (stage.kind === 'table')
    return (
      <table className="quantity-reasoning-table" aria-label="数量关系表">
        <thead>
          <tr>
            {stage.headings.map((heading, i) => (
              <th key={i} scope="col">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stage.rows.map((row, i) => (
            <tr key={i} data-highlighted={stage.highlights?.includes(i)}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  const values = stage.values ?? [],
    max = Math.max(...values, 1);
  return (
    <div className="quantity-reasoning-bars" role="group" aria-label="数量条形图">
      {values.map((value, i) => (
        <div key={i}>
          <div className="quantity-bar-label">
            <span>{stage.headings[i]}</span>
            <strong>{value}</strong>
          </div>
          <div className="quantity-bar-track" aria-hidden="true">
            <span style={{ width: `${(value / max) * 100}%` }} />
          </div>
        </div>
      ))}
      {stage.rows.slice(0, 2).map((row, i) => (
        <p key={i}>{row.join('：')}</p>
      ))}
    </div>
  );
}
