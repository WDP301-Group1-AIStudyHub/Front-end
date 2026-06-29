export type RagMode = 'dr-rag'
export type DrRagSelectionStrategy = 'cfs-heuristic'
export type ChatScope = 'single_document' | 'subject_all' | 'document_set' | 'library_all'

export interface ChatSource {
  documentId: string
  title: string
  chunkIndex: number
  section?: string
  inferredSection?: string
  semanticSectionLabel?: string
  heading?: string
  sectionTitle?: string
  sectionIndex?: number
  outlineNodeId?: string
  outlinePath?: string
  outlineLevel?: number
  outlineType?: string
  chapterOrdinal?: string
  contentPreview: string
  relevanceScore?: number
}

export interface ChatEvaluation {
  retrievedChunksCount: number
  relevantChunksCount: number
  averageRelevanceScore: number
  isGrounded: boolean
  confidenceScore: number
  responseTimeMs: number
  stageOneChunksCount?: number
  stageTwoChunksCount?: number
  selectedStaticChunksCount?: number
  selectedDynamicChunksCount?: number
  dynamicRetrievalAttempted?: boolean
  selectionStrategy?: DrRagSelectionStrategy
  retrievalQueries?: string[]
  usedFallbackChunks?: boolean
  relevanceThreshold?: number
  warning?: string
  fallbackGenerated?: boolean
  fallbackReason?: string
  detectedIntent?: string
  retrievedSections?: string[]
  answerProfile?: string
  usedSectionExpansion?: boolean
  selectedSectionTitle?: string
  contextChunksUsed?: number
}

export interface AskChatPayload {
  question: string
  threadId?: string
  documentId?: string
  documentIds?: string[]
  subject?: string
  subjectId?: string
  scope?: ChatScope
}

export interface AskChatResponse {
  threadId?: string
  answer: string
  mode?: RagMode
  originalQuestion?: string
  rewrittenQuery?: string
  sources: ChatSource[]
  evaluation?: ChatEvaluation
}

export interface ChatHistoryItem {
  id: string
  threadId?: string
  question: string
  answer: string
  mode?: RagMode
  documentId?: string
  documentIds?: string[]
  subject?: string
  subjectId?: string
  scope?: ChatScope
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
  scope?: ChatScope
  subjectId?: string
  documentId?: string
  documentIds?: string[]
  mode?: RagMode
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
  retrievalMode?: RagMode
  mode?: RagMode
  retrievedChunksCount?: number
  relevantChunksCount?: number
  averageRelevanceScore?: number
  isGrounded?: boolean
  confidenceScore?: number
  responseTimeMs?: number
  evaluation?: ChatEvaluation
  createdAt: string
}

export type EvaluationLogsResponse = EvaluationLog[]

export interface EvaluationSummary {
  totalQuestions: number
  averageRelevanceScore: number
  averageConfidenceScore: number
  averageResponseTime: number
  drRagModeCount: number
}

export type BenchmarkDifficulty = 'easy' | 'medium' | 'hard'

export interface BenchmarkScores {
  correctness: number
  faithfulness: number
  relevance: number
  completeness: number
  totalScore: number
}

export interface BenchmarkEvaluationScore {
  answerCorrectness: number
  faithfulness: number
  relevance: number
  completeness: number
  overallScore: number
  explanation: string
}

export interface BenchmarkRunResult {
  id?: string
  benchmarkQuestionId?: string
  questionId?: string
  question?: string
  expectedAnswer?: string
  subject?: string
  documentId?: string
  documentTitle?: string
  difficulty?: BenchmarkDifficulty
  durationMs?: number
  answer: string
  evaluation: BenchmarkEvaluationScore
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
  runCount?: number
  lastRunAt?: string
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
  averageScore: number
  averageAnswerCorrectness: number
  averageFaithfulness: number
  averageRelevance: number
  averageCompleteness: number
}

export type BenchmarkQuestionsResponse = BenchmarkQuestion[]
