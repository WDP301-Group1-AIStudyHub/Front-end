export interface ChatSource {
  documentId: string
  title: string
  chunkIndex: number
  contentPreview: string
  relevanceScore?: number
}

export interface ChatEvaluation {
  retrievedChunksCount: number
  relevantChunksCount: number
  averageRelevanceScore: number
  correctiveAttempted: boolean
  isGrounded: boolean
  confidenceScore: number
  responseTimeMs: number
}

export interface AskChatPayload {
  question: string
  threadId?: string
  documentId?: string
  documentIds?: string[]
  subject?: string
  subjectId?: string
  scope?: 'single_document' | 'subject_all' | 'document_set' | 'library_all'
  mode: 'basic' | 'corrective'
}

export interface AskChatResponse {
  threadId?: string
  answer: string
  mode: string
  originalQuestion: string
  rewrittenQuery?: string
  sources: ChatSource[]
  evaluation?: ChatEvaluation
}

export interface ChatHistoryItem {
  id: string
  threadId?: string
  question: string
  answer: string
  mode: string
  documentId?: string
  documentIds?: string[]
  subject?: string
  subjectId?: string
  scope?: 'single_document' | 'subject_all' | 'document_set' | 'library_all'
  sources: ChatSource[]
  evaluation?: ChatEvaluation
  createdAt: string
  updatedAt: string
}

export type ChatHistoryListResponse = ChatHistoryItem[]

export interface ChatThreadItem {
  id: string
  ownerId: string
  title: string
  status: 'ACTIVE' | 'ARCHIVED'
  lastMessageAt: string
  messageCount: number
  scope?: 'single_document' | 'subject_all' | 'document_set' | 'library_all'
  subjectId?: string
  documentId?: string
  documentIds?: string[]
  mode?: 'basic' | 'corrective'
  createdAt: string
  updatedAt: string
}

export interface ChatThreadDetail {
  thread: ChatThreadItem
  messages: ChatHistoryItem[]
}

export interface ChatThreadListResponse {
  threads: ChatThreadItem[]
  total: number
}

export interface EvaluationLog {
  id: string
  question: string
  mode: string
  evaluation?: ChatEvaluation
  createdAt: string
}

export type EvaluationLogsResponse = EvaluationLog[]

export interface EvaluationSummary {
  totalQuestions: number
  averageRelevanceScore: number
  averageConfidenceScore: number
  averageResponseTime: number
  basicModeCount: number
  correctiveModeCount: number
}

export type BenchmarkDifficulty = 'easy' | 'medium' | 'hard'
export type BenchmarkWinner = 'basic' | 'corrective' | 'tie' | 'not_run'

export interface BenchmarkScores {
  correctness: number
  faithfulness: number
  relevance: number
  completeness: number
  totalScore: number
}

export interface BenchmarkRetrievedChunk {
  chunkIndex?: number
  documentTitle?: string
  page?: number
  relevanceScore?: number
  contentPreview?: string
}

export interface BenchmarkModeResult {
  answer: string
  scores: BenchmarkScores
  explanation?: string
  durationMs?: number
  retrievedChunksCount?: number
  relevantChunksCount?: number
  retrievedChunks?: BenchmarkRetrievedChunk[]
  issues?: string[]
  improvements?: string[]
  rewrittenQuery?: string
  groundingSummary?: string
}

export interface BenchmarkRunResult {
  id?: string
  benchmarkQuestionId?: string
  questionId: string
  question?: string
  questionText?: string
  expectedAnswer?: string
  subject?: string
  documentId?: string
  documentTitle?: string
  difficulty?: BenchmarkDifficulty
  durationMs?: number
  basic?: BenchmarkModeResult
  corrective?: BenchmarkModeResult
  basicResult?: BenchmarkModeResult
  correctiveResult?: BenchmarkModeResult
  basicAnswer?: string
  correctiveAnswer?: string
  basicEvaluation?: Partial<BenchmarkScores> & {
    answerCorrectness?: number
    overallScore?: number
    explanation?: string
  }
  correctiveEvaluation?: Partial<BenchmarkScores> & {
    answerCorrectness?: number
    overallScore?: number
    explanation?: string
  }
  winner: BenchmarkWinner
  createdAt?: string
}

export interface BenchmarkQuestion {
  id: string
  question: string
  expectedAnswer: string
  documentId?: string
  documentTitle?: string
  subject?: string
  difficulty: BenchmarkDifficulty
  runCount: number
  lastRunAt?: string
  lastWinner?: BenchmarkWinner
  needsReview?: boolean
  createdBy?: string
  createdAt?: string
  updatedAt?: string
  latestResult?: BenchmarkRunResult
}

export interface CreateBenchmarkQuestionPayload {
  question: string
  expectedAnswer: string
  documentId?: string
  subject?: string
  difficulty: BenchmarkDifficulty
}

export interface BenchmarkSummary {
  totalRuns: number
  totalBenchmarks?: number
  periodRunCount?: number
  periodDelta?: number
  averageBasicScore: number
  basicAverageScore?: number
  averageCorrectiveScore: number
  correctiveAverageScore?: number
  basicWinRate: number
  correctiveWinRate: number
  tieRate?: number
  faithfulnessImprovement: number
  averageFaithfulnessImprovement?: number
  correctnessImprovement: number
  averageCorrectnessImprovement?: number
  metricAverages?: {
    basic?: Partial<Omit<BenchmarkScores, 'totalScore'>>
    corrective?: Partial<Omit<BenchmarkScores, 'totalScore'>>
  }
  basicMetricAverages?: Partial<Omit<BenchmarkScores, 'totalScore'>>
  correctiveMetricAverages?: Partial<Omit<BenchmarkScores, 'totalScore'>>
  winCounts?: {
    basic?: number
    corrective?: number
    tie?: number
  }
  basicWins?: number
  correctiveWins?: number
  ties?: number
  recentRuns?: BenchmarkRecentRun[]
  latestRuns?: BenchmarkRecentRun[]
}

export type BenchmarkQuestionsResponse = BenchmarkQuestion[]

export interface BenchmarkRecentRun {
  id: string
  questionId?: string
  question: string
  createdAt?: string
  runAt?: string
  winner: BenchmarkWinner
  delta?: number
}
