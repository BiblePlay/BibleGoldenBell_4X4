import type { QuizQuestion } from '../types'

export const questions: QuizQuestion[] = Array.from(
  { length: 16 },
  (_, index) => ({
    id: `Q${String(index + 1).padStart(3, '0')}`,
    categoryId: 'joseph',
    number: index + 1,
    type: 'general',
    answerType: 'short',
    question: '',
    answer: '',
    score: 0,
  }),
)
