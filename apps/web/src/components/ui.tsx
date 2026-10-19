import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Blocks,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Flag,
  GraduationCap,
  Grid2X2,
  LayoutDashboard,
  Lightbulb,
  List,
  ListChecks,
  LockKeyhole,
  Menu,
  MoveUpRight,
  Pause,
  Play,
  RotateCcw,
  Search,
  Shapes,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trophy,
  X,
  NotebookPen,
  StepForward,
  Volume2,
} from 'lucide-react';
import type { CSSProperties } from 'react';
const icons = {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Blocks,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Flag,
  GraduationCap,
  Grid2X2,
  LayoutDashboard,
  Lightbulb,
  List,
  ListChecks,
  LockKeyhole,
  Menu,
  MoveUpRight,
  Pause,
  Play,
  RotateCcw,
  Search,
  Shapes,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trophy,
  X,
  NotebookPen,
  StepForward,
  Volume2,
};
export function Icon({
  name,
  size = 20,
  className,
}: {
  name: keyof typeof icons;
  size?: number;
  className?: string;
}) {
  const Component = icons[name];
  return <Component size={size} strokeWidth={1.8} aria-hidden="true" className={className} />;
}
export function Loading() {
  return (
    <div className="loading-state" role="status">
      <span className="loader" />
      <p>正在翻开你的数学课本…</p>
    </div>
  );
}
export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="empty-state" role="alert">
      <Icon name="CircleHelp" size={36} />
      <h2>{message}</h2>
      {retry && (
        <button className="button primary" onClick={retry}>
          重新加载
        </button>
      )}
    </div>
  );
}
export function BookArt({ small = false }: { small?: boolean }) {
  return (
    <div
      className={`book-art ${small ? 'small' : ''}`}
      aria-label="自制数学教材封面插画"
      role="img"
    >
      <div className="book-spine" />
      <div className="book-cover">
        <div className="cover-top">义务教育 · 苏教版</div>
        <strong>数学</strong>
        <span className="cover-en">MATHEMATICS</span>
        <svg viewBox="0 0 200 145" aria-hidden="true">
          <defs>
            <pattern id="book-grid" width="18" height="18" patternUnits="userSpaceOnUse">
              <path d="M18 0H0V18" fill="none" stroke="#c4d8ed" strokeWidth=".7" />
            </pattern>
          </defs>
          <rect x="5" y="4" width="190" height="135" fill="url(#book-grid)" />
          <path d="M24 122 94 16l75 106Z" fill="#fbd46c" stroke="#213b6c" strokeWidth="2" />
          <circle
            cx="132"
            cy="70"
            r="42"
            fill="#78aadd"
            fillOpacity=".8"
            stroke="#213b6c"
            strokeWidth="2"
          />
          <path
            d="m61 116 58-76 52 76Z"
            fill="#fff"
            fillOpacity=".5"
            stroke="#213b6c"
            strokeWidth="1.5"
          />
          <path d="M20 123h160" stroke="#213b6c" strokeWidth="2" />
          <text x="12" y="27" fill="#213b6c" fontSize="16">
            ÷
          </text>
          <text x="166" y="37" fill="#213b6c" fontSize="18">
            ×
          </text>
        </svg>
        <div className="cover-bottom">
          <b>四年级</b>
          <span>上册</span>
        </div>
        <div className="cover-publisher">江苏凤凰教育出版社</div>
      </div>
      <div className="book-pages" />
    </div>
  );
}
export function ProgressRing({ value, total }: { value: number; total: number }) {
  return (
    <div
      className="progress-ring"
      style={{ '--progress': `${(value / total) * 100}%` } as CSSProperties}
    >
      <div>
        <b>
          {value}
          <span>/{total}</span>
        </b>
        <small>课节完成</small>
      </div>
    </div>
  );
}
