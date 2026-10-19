import { createContext, useContext } from 'react';
import type { Textbook } from '@mathstudy/contracts';

export interface HomeData {
  textbook: Textbook;
  availableLessons: number;
  questionCount: number;
}
export const DataContext = createContext<HomeData | null>(null);
export function useCourse() {
  const value = useContext(DataContext);
  if (!value) throw new Error('课程数据尚未加载');
  return value;
}
