import { z } from 'zod';
export * from './learning';

export const editionId = 'sj-math-g4-upper-2026-v1';
export const releaseId = 'practice-2026-10-full-papers-r2';
export const difficultySchema = z.enum(['basic', 'advanced', 'challenge']);
export type Difficulty = z.infer<typeof difficultySchema>;
export const questionTypeSchema = z.enum([
  'fill',
  'application',
  'choice',
  'judgement',
  'calculation',
  'drawing',
]);
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
export const quantityDemoSchema = z.object({
  kind: z.enum(['equalGroups', 'shopping', 'journey', 'quantityProblems']),
  unitValue: z.number().int().min(1).max(100),
  count: z.number().int().min(1).max(12),
});
export type QuantityDemo = z.infer<typeof quantityDemoSchema>;
export const arithmeticDemoSchema = z.object({
  kind: z.enum(['operationOrder', 'nestedBrackets', 'multiStepProblems']),
  exampleId: z.string().min(1),
});
export type ArithmeticDemo = z.infer<typeof arithmeticDemoSchema>;
export const largeNumberDemoSchema = z.object({
  kind: z.enum([
    'countingUnits',
    'largeReading',
    'numberClasses',
    'decimalSystem',
    'roundingNumbers',
    'numberEncoding',
    'largeReview',
  ]),
  initialNumber: z.number().int().min(0).max(999999999999),
});
export type LargeNumberDemo = z.infer<typeof largeNumberDemoSchema>;
export const demoSchema = z.discriminatedUnion('kind', [
  divisionDemoSchema,
  geometryDemoSchema,
  quantityDemoSchema,
  arithmeticDemoSchema,
  largeNumberDemoSchema,
]);
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
  fields: {
    key: string;
    label: string;
    suffix?: string;
    inputMode?: 'text' | 'numeric';
    fixedValue?: '0';
  }[];
  options?: string[];
  hint: string;
  sourceKind: 'original' | 'collected' | 'adapted';
  topicIds?: string[];
  sources?: { paperId: string; page: number; number: string }[];
  promptImage?: { src: string; alt: string };
  responseMode?: 'selfReview';
  sourceIssue?: string;
  figure?: GridFigure;
  construction?: {
    columns: number;
    rows: number;
    area: number;
    perimeter?: number;
    rectangle: boolean;
    given?: number[];
  };
  knowledge: string;
  pages: [number, number];
  hasVisual: boolean;
}
export const visualSchema = z
  .object({
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
      'reasoning',
    ]),
    title: z.string(),
    labels: z.array(z.string()),
    values: z.array(z.number().finite()),
    captions: z.array(z.string()).min(2),
    stages: z
      .array(
        z.object({
          kind: z.enum([
            'flow',
            'table',
            'bars',
            'digits',
            'join',
            'grid',
            'packing',
            'fence',
            'image',
          ]),
          image: z
            .string()
            .regex(/^\/papers\/diagrams\/[a-zA-Z0-9_.-]+\.svg$/)
            .optional(),
          headings: z.array(z.string()),
          rows: z.array(z.array(z.string())),
          values: z.array(z.number().nonnegative()).optional(),
          highlights: z.array(z.number().int().nonnegative()).optional(),
        }),
      )
      .optional(),
  })
  .superRefine((visual, ctx) => {
    if (visual.kind !== 'reasoning') return;
    if (!visual.stages || visual.stages.length !== visual.captions.length) {
      ctx.addIssue({ code: 'custom', message: 'Each reasoning caption needs one diagram stage' });
      return;
    }
    for (const stage of visual.stages) {
      if (stage.kind === 'image' && !stage.image)
        ctx.addIssue({ code: 'custom', message: 'Image stage needs a local diagram' });
      if ((stage.kind === 'bars' || stage.kind === 'join') && !stage.values?.length)
        ctx.addIssue({ code: 'custom', message: 'Quantitative diagram needs values' });
      if (stage.kind === 'bars' && stage.headings.length !== stage.values?.length)
        ctx.addIssue({ code: 'custom', message: 'Each bar needs a label' });
      if (
        stage.kind === 'table' &&
        (!stage.headings.length || stage.rows.some((row) => row.length !== stage.headings.length))
      )
        ctx.addIssue({ code: 'custom', message: 'Table columns must match headings' });
    }
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
  answerRules?: Record<string, { kind: 'oneOf' | 'set'; values: string[] }>;
  explanation: Explanation;
}
export interface GridFigure {
  columns: number;
  rows: number;
  unitLabel: string;
  shapes: { label: string; cells: [number, number][] }[];
}
export interface PracticeTopic {
  id: string;
  unitId: string;
  title: string;
  questionIds: string[];
}
export interface PracticePaper {
  id: string;
  title: string;
  unitIds: string[];
  capturedAt: string;
  pages: { image: string; sourceFile: string }[];
  questionIds: string[];
  duplicateOf?: string;
}
export interface PracticeCatalog {
  topics: PracticeTopic[];
  papers: PracticePaper[];
}
export const questionSchema = z.object({
  id: z.string(),
  unitId: z.string(),
  lessonId: z.string().optional(),
  title: z.string(),
  stem: z.string(),
  type: questionTypeSchema,
  difficulty: difficultySchema,
  fields: z
    .array(
      z.object({
        key: z.string(),
        label: z.string(),
        suffix: z.string().optional(),
        inputMode: z.enum(['text', 'numeric']).optional(),
        fixedValue: z.literal('0').optional(),
      }),
    )
    .min(1)
    .max(8),
  options: z.array(z.string()).optional(),
  hint: z.string(),
  sourceKind: z.enum(['original', 'collected', 'adapted']),
  topicIds: z.array(z.string()).optional(),
  sources: z
    .array(z.object({ paperId: z.string(), page: z.number().int().positive(), number: z.string() }))
    .optional(),
  knowledge: z.string(),
  pages: z.tuple([z.number(), z.number()]),
  hasVisual: z.boolean(),
  expected: z.record(z.string(), z.string()),
  answerRules: z
    .record(
      z.string(),
      z.object({ kind: z.enum(['oneOf', 'set']), values: z.array(z.string()).min(1) }),
    )
    .optional(),
  promptImage: z
    .object({ src: z.string().regex(/^\/papers\/[a-zA-Z0-9_./-]+\.webp$/), alt: z.string().min(1) })
    .optional(),
  responseMode: z.literal('selfReview').optional(),
  sourceIssue: z.string().min(1).optional(),
  figure: z
    .object({
      columns: z.number().int().positive(),
      rows: z.number().int().positive(),
      unitLabel: z.string(),
      shapes: z.array(
        z.object({ label: z.string(), cells: z.array(z.tuple([z.number(), z.number()])) }),
      ),
    })
    .optional(),
  construction: z
    .object({
      columns: z.number().int().positive(),
      rows: z.number().int().positive(),
      area: z.number().int().positive(),
      perimeter: z.number().int().positive().optional(),
      rectangle: z.boolean(),
      given: z.array(z.number().int().nonnegative()).optional(),
    })
    .optional(),
  explanation: z.object({
    analysis: z.string(),
    steps: z.array(z.string()).min(1),
    answer: z.string(),
    pitfall: z.string(),
    visual: visualSchema.optional(),
  }),
});
export const submissionSchema = z
  .object({
    answers: z.record(z.string(), z.string().max(80)),
    attemptId: z.uuid().optional(),
    occurredAt: z.iso.datetime().optional(),
    assisted: z.boolean().optional(),
  })
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
  judgement: '判断题',
  calculation: '计算题',
  drawing: '作图题',
};
