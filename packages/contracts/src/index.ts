import { z } from 'zod';

export const editionId = 'sj-math-g4-upper-2026-v1';
export const releaseId = 'preview-2026-10-u02-r1';
export const difficultySchema = z.enum(['basic', 'advanced', 'challenge']);
export type Difficulty = z.infer<typeof difficultySchema>;
export const questionTypeSchema = z.enum(['fill', 'application', 'choice']);
export type QuestionType = z.infer<typeof questionTypeSchema>;
export const divisionDemoSchema = z.object({
  kind: z.enum(['groups', 'trial', 'longDivision', 'chain', 'review']),
  dividend: z.number().int().min(10).max(999),
  divisor: z.number().int().min(10).max(99),
});
export type DivisionDemo = z.infer<typeof divisionDemoSchema>;
export const geometryDemoSchema = z.object({
  kind: z.enum([
    'boundary',
    'perimeterMeasure',
    'perimeterFormula',
    'areaUnits',
    'areaTiling',
    'areaConversion',
    'areaEstimate',
    'perimeterAreaCompare',
  ]),
  columns: z.number().int().min(1).max(12),
  rows: z.number().int().min(1).max(10),
  unit: z.enum(['cm', 'dm', 'm']),
});
export type GeometryDemo = z.infer<typeof geometryDemoSchema>;
export const demoSchema = z.discriminatedUnion('kind', [divisionDemoSchema, geometryDemoSchema]);
export type Demo = z.infer<typeof demoSchema>;
export const lessonSchema = z.object({
  id: z.string(),
  unitId: z.string(),
  title: z.string(),
  pages: z.tuple([z.number(), z.number()]),
  summary: z.string(),
  goals: z.array(z.string()),
  concepts: z.array(z.object({ title: z.string(), text: z.string() })),
  demo: demoSchema,
  questionIds: z.array(z.string()),
  minutes: z.number(),
});
export type Lesson = z.infer<typeof lessonSchema>;
export type LessonSummary = Pick<
  Lesson,
  'id' | 'unitId' | 'title' | 'pages' | 'summary' | 'minutes'
> & { available: boolean };
export interface CatalogNode {
  id: string;
  kind: 'unit' | 'activity' | 'review';
  title: string;
  sortOrder: number;
  printedRange: [number, number];
  pdfRange: [number, number];
  lessons: LessonSummary[];
}
export interface Textbook {
  id: string;
  title: string;
  editionLabel: string;
  publisher: string;
  grade: number;
  volume: string;
  releaseId: string;
  catalog: CatalogNode[];
}
export interface QuestionPublic {
  id: string;
  unitId: string;
  lessonId?: string;
  title: string;
  type: QuestionType;
  difficulty: Difficulty;
  stem: string;
  fields: { key: string; label: string; suffix?: string }[];
  options?: string[];
  hint: string;
  sourceKind: 'original';
  knowledge: string;
  pages: [number, number];
  hasVisual: boolean;
}
export const visualSchema = z.object({
  kind: z.enum([
    'division',
    'bars',
    'rectangle',
    'operations',
    'numberline',
    'multiplication',
    'perimeterComparison',
    'areaComparison',
    'wallFence',
  ]),
  title: z.string(),
  labels: z.array(z.string()),
  values: z.array(z.number().finite()),
  captions: z.array(z.string()).min(2),
});
export type Visual = z.infer<typeof visualSchema>;
export interface Explanation {
  analysis: string;
  steps: string[];
  answer: string;
  pitfall: string;
  visual?: Visual;
}
export interface Question extends QuestionPublic {
  expected: Record<string, string>;
  explanation: Explanation;
}
export const submissionSchema = z
  .object({ answers: z.record(z.string(), z.string().max(80)) })
  .strict();
export interface Grade {
  correct: boolean;
  feedback: string;
  explanation: Explanation;
}
export interface ApiEnvelope<T> {
  data: T;
  requestId: string;
}
export const difficultyLabels: Record<Difficulty, string> = {
  basic: '基础',
  advanced: '进阶',
  challenge: '挑战',
};
export const typeLabels: Record<QuestionType, string> = {
  fill: '填空题',
  application: '应用题',
  choice: '选择题',
};
