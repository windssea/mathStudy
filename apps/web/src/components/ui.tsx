import { Button } from './ui/button';
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
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
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
  Sun,
  Moon,
  Monitor,
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
    <div className="loading-state" role="status" aria-label="加载中">
      <span className="sr-only">加载中…</span>
      <div className="skeleton skeleton-title" />
      <div className="skeleton-workspace">
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    </div>
  );
}
export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="empty-state" role="alert">
      <Icon name="CircleHelp" size={36} />
      <h2>{message}</h2>
      {retry && (
        <Button variant="default" className="button primary" onClick={retry}>
          重新加载
        </Button>
      )}
      <a className="button secondary" href="/">
        回到练习
      </a>
    </div>
  );
}
