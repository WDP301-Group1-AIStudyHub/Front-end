export interface ChatSource {
  documentId: string
  title: string
  chunkIndex: number
  contentPreview: string
  relevanceScore: number
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
  documentId?: string
  subject?: string
  mode: 'basic' | 'corrective'
}

export interface AskChatResponse {
  answer: string
  mode: string
  originalQuestion: string
  rewrittenQuery?: string
  sources: ChatSource[]
  evaluation?: ChatEvaluation
}

export interface ChatHistoryItem {
  id: string
  question: string
  answer: string
  mode: string
  documentId?: string
  subject?: string
  sources: ChatSource[]
  evaluation?: ChatEvaluation
  createdAt: string
  updatedAt: string
}

export type ChatHistoryListResponse = ChatHistoryItem[]

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
