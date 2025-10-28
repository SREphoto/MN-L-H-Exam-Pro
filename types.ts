export enum NavSection {
  KnowledgeBase = 'Knowledge Base',
  PracticeTest = 'Practice Test',
  AiTools = 'AI Tools',
  StudyPlan = 'Study Plan',
}

export enum AiToolMode {
  Tutor = 'AI Tutor',
  Regulatory = 'Regulatory Q&A',
  Chatbot = 'General Chatbot',
}

export interface PracticeQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  rationale: string;
  topic: string;
}

export interface Flashcard {
  term: string;
  definition: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  groundingChunks?: any[];
}

export interface TopicPerformance {
    [topic: string]: {
        correct: number;
        total: number;
    };
}

export interface QuizResult {
    date: number; // timestamp
    score: number;
    totalQuestions: number;
    percentage: number;
    topicBreakdown: TopicPerformance;
    isExamMode: boolean;
}