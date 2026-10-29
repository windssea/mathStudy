import { createContext, useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** A lesson keeps its current explanation beside the canvas, not beneath it. */
export const LessonNarrationTarget = createContext<HTMLElement | null>(null);

export default function LessonNarration({ children }: { children: ReactNode }) {
  const target = useContext(LessonNarrationTarget);
  return target ? createPortal(children, target) : children;
}
