import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useGroupRef } from 'react-resizable-panels';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizable';

/** Shared question/answer and demonstration/notes layout. Sizes are percentages. */
export default function SplitWorkspace({
  primary,
  secondary,
  primaryLabel = '题目',
  secondaryLabel = '作答与解析',
  className = '',
  initialSize = 52,
  focusSecondary = false,
}: {
  primary: ReactNode;
  secondary: ReactNode;
  primaryLabel?: string;
  secondaryLabel?: string;
  className?: string;
  initialSize?: number;
  focusSecondary?: boolean;
}) {
  const groupRef = useGroupRef();
  const primaryId = useId(),
    secondaryId = useId();
  const previousLayout = useRef<Record<string, number> | undefined>(undefined);
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const media = window.matchMedia?.('(min-width: 768px)');
    const adjust = () => {
      if (focusSecondary && (media?.matches ?? true)) {
        if (!previousLayout.current) {
          const layout = group.getLayout();
          previousLayout.current =
            Number.isFinite(layout[primaryId]) && Number.isFinite(layout[secondaryId])
              ? layout
              : { [primaryId]: initialSize, [secondaryId]: 100 - initialSize };
        }
        group.setLayout({ [primaryId]: 35, [secondaryId]: 65 });
      } else if (previousLayout.current) {
        group.setLayout(previousLayout.current);
        previousLayout.current = undefined;
      }
    };
    adjust();
    media?.addEventListener('change', adjust);
    return () => media?.removeEventListener('change', adjust);
  }, [focusSecondary, groupRef, primaryId, secondaryId, initialSize]);
  return (
    <ResizablePanelGroup
      groupRef={groupRef}
      orientation="horizontal"
      className={`split-workspace ${className}`}
    >
      <ResizablePanel
        id={primaryId}
        defaultSize={`${initialSize}%`}
        minSize="35%"
        aria-label={primaryLabel}
      >
        <div className="workspace-pane">{primary}</div>
      </ResizablePanel>
      <ResizableHandle withHandle aria-label="调整左右区域宽度" />
      <ResizablePanel id={secondaryId} minSize="35%" aria-label={secondaryLabel}>
        <div className="workspace-pane">{secondary}</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
