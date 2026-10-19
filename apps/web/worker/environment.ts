import type { ContentDatabase, CourseContent } from './content-repository';
import type { PublicUser } from '@mathstudy/contracts';
export type WorkerEnvironment = {
  Bindings: {
    DB?: ContentDatabase;
    AUTH_SECRET?: string;
    CF_VERSION_METADATA?: { id: string; tag?: string; timestamp: string };
  };
  Variables: { requestId: string; content: CourseContent; user: PublicUser };
};
