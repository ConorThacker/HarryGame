export interface Question {
  question: string;
  answer: number;
}

export enum GameState {
  Welcome,
  Playing,
  LevelEnd,
}

export enum AnswerState {
    UNANSWERED,
    CORRECT,
    INCORRECT
}