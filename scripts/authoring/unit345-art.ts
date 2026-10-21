/** Small, deterministic vector templates for worked solutions. No bitmap or UI runtime dependency. */
export type Scene =
  | {
      kind: 'parts';
      title: string;
      rows: { label: string; parts: [string, number][] }[];
      note: string;
    }
  | { kind: 'route'; title: string; legs: [string, number][]; note: string }
  | {
      kind: 'table';
      title: string;
      headings: string[];
      rows: string[][];
      active?: number;
      note: string;
    }
  | {
      kind: 'range';
      title: string;
      lower: number;
      upper: number;
      selected?: [number, number];
      note: string;
    }
  | { kind: 'digits'; title: string; numbers: string[]; highlights?: number[]; note: string }
  | { kind: 'code'; title: string; chunks: [string, string][]; note: string };
const escape = (s: unknown) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
const text = (x: number, y: number, s: unknown, size = 21, anchor = 'start') =>
  '<text x="' +
  x +
  '" y="' +
  y +
  '" font-size="' +
  size +
  '" text-anchor="' +
  anchor +
  '" fill="#243754">' +
  escape(s) +
  '</text>';
const rect = (x: number, y: number, w: number, h: number, color = '#e6eeff') =>
  '<rect x="' +
  x +
  '" y="' +
  y +
  '" width="' +
  w +
  '" height="' +
  h +
  '" fill="' +
  color +
  '" stroke="#7c98d2" stroke-width="1.5"/>';
const path = (d: string, color = '#3563e9', width = 3) =>
  '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="' + width + '"/>';

export function renderScene(scene: Scene) {
  let body = text(30, 35, scene.title, 22);
  const colors = ['#dce7ff', '#dceee5', '#fff0cd'];
  if (scene.kind === 'parts') {
    const max = Math.max(...scene.rows.map((r) => r.parts.reduce((s, p) => s + p[1], 0)), 1);
    scene.rows.forEach((row, i) => {
      let x = 150;
      const y = 70 + i * 70;
      body += text(28, y + 25, row.label, 18);
      row.parts.forEach(([label, value], j) => {
        const width = (value / max) * 490;
        body += rect(x, y, width, 38, colors[j % colors.length]);
        // Narrow pieces use an external label, rather than clipping text inside the bar.
        body += text(
          x + width / 2,
          width >= 92 ? y + 26 : y - 8,
          label,
          width >= 92 ? 18 : 16,
          'middle',
        );
        x += width;
      });
    });
  } else if (scene.kind === 'route') {
    const total = scene.legs.reduce((s, p) => s + p[1], 0);
    let x = 65;
    body += text(65, 100, '起点', 19);
    scene.legs.forEach(([label, distance], i) => {
      const width = (distance / total) * 570;
      body += path('M' + x + ' 160H' + (x + width), i % 2 ? '#43876b' : '#3563e9', 7);
      body += '<circle cx="' + x + '" cy="160" r="5" fill="#243754"/>';
      body += text(x + width / 2, 137, label, 20, 'middle');
      body += text(x + width / 2, 205, distance + '米', 19, 'middle');
      x += width;
    });
    body +=
      '<circle cx="' + x + '" cy="160" r="5" fill="#243754"/>' + text(635, 100, '终点', 19, 'end');
  } else if (scene.kind === 'table') {
    const width = 650 / scene.headings.length;
    scene.headings.forEach((s, i) => {
      body += rect(35 + i * width, 62, width, 42);
      body += text(35 + (i + 0.5) * width, 89, s, 18, 'middle');
    });
    scene.rows.forEach((row, i) =>
      row.forEach((s, j) => {
        body += rect(
          35 + j * width,
          104 + i * 43,
          width,
          43,
          i === scene.active ? '#dceee5' : '#fff',
        );
        body += text(35 + (j + 0.5) * width, 132 + i * 43, s, 18, 'middle');
      }),
    );
  } else if (scene.kind === 'range') {
    const [lo, hi] = scene.selected ?? [scene.lower, scene.upper - 1];
    const toX = (n: number) => 95 + ((n - scene.lower) / (scene.upper - scene.lower)) * 530;
    body += rect(toX(lo), 142, Math.max(1, toX(hi) - toX(lo)), 23, '#dceee5');
    body += path('M70 165H655');
    for (const value of [scene.lower, (scene.lower + scene.upper) / 2, scene.upper]) {
      body +=
        path('M' + toX(value) + ' 153V177', '#7c98d2', 2) +
        text(toX(value), 210, value, 18, 'middle');
    }
    body += '<circle cx="' + toX(lo) + '" cy="165" r="6" fill="#3563e9"/>';
    body += '<circle cx="' + toX(hi) + '" cy="165" r="6" fill="#43876b"/>';
    body += text(360, 252, lo + ' 至 ' + hi + '，两端都包括', 20, 'middle');
  } else if (scene.kind === 'digits') {
    const count = Math.max(...scene.numbers.map((n) => n.length));
    const labels = [
      '千亿',
      '百亿',
      '十亿',
      '亿',
      '千万',
      '百万',
      '十万',
      '万',
      '千',
      '百',
      '十',
      '个',
    ].slice(-count);
    const width = Math.min(65, 640 / count),
      left = (720 - count * width) / 2;
    labels.forEach((label, i) => {
      body += text(left + (i + 0.5) * width, 85, label, 17, 'middle');
    });
    scene.numbers.forEach((n, row) =>
      n
        .padStart(count, ' ')
        .split('')
        .forEach((digit, i) => {
          body += rect(
            left + i * width,
            105 + row * 65,
            width,
            58,
            scene.highlights?.includes(i) ? '#fff0cd' : i < count - 4 ? '#dceee5' : '#e6eeff',
          );
          body += text(left + (i + 0.5) * width, 145 + row * 65, digit, 30, 'middle');
        }),
    );
  } else {
    const width = 640 / scene.chunks.length;
    scene.chunks.forEach(([label, value], i) => {
      body += text(40 + (i + 0.5) * width, 95, label, 19, 'middle');
      body += rect(40 + i * width, 115, width, 85, colors[i % 3]);
      body += text(40 + (i + 0.5) * width, 168, value, 30, 'middle');
    });
  }
  body += rect(25, 286, 670, 43, '#f5f7fb') + text(42, 314, scene.note, 19);
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 340" role="img"><rect width="720" height="340" fill="white"/><g font-family="system-ui, sans-serif">' +
    body +
    '</g></svg>\n'
  );
}
