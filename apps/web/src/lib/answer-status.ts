/** Historical first-attempt correctness alone does not mean the question is mastered now. */
export function independentlyMastered(answer?: { correct: boolean; needsReview: boolean }) {
  return !!answer?.correct && !answer.needsReview;
}

export function answerStatus(
  answer?: { independentCorrect: boolean; needsReview: boolean; correct: boolean },
  latest?: { correct: boolean; assisted: boolean },
) {
  if (!answer) return '未练习';
  if (independentlyMastered(answer)) return '独立答对';
  return answer.correct && latest?.correct && latest.assisted ? '借助方法答对' : '待复习';
}
