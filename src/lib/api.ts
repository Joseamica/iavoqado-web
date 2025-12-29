/**
 * API Client for IAvoqado Backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

interface RequestOptions extends RequestInit {
  token?: string
}

class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options

  const headers: Record<string, string> = {}

  // Copy existing headers
  if (fetchOptions.headers) {
    const existingHeaders = fetchOptions.headers as Record<string, string>
    Object.assign(headers, existingHeaders)
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(fetchOptions.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.error || 'UnknownError',
      data.message || 'An error occurred'
    )
  }

  return data as T
}

// ============================================
// Onboarding API
// ============================================

export interface WizardQuestion {
  id: string
  text: string
  type: 'single' | 'multiple' | 'text'
  options?: { value: string; label: string }[]
  required: boolean
}

export interface WizardAnswers {
  business_type: string
  industry: string
  monthly_transactions: string
  primary_metrics: string[]
  data_source_type: string
  update_frequency: string
  data_volume: string
  sample_questions?: string
}

export interface OnboardingPlan {
  steps: {
    id: string
    order: number
    title: string
    description: string
    status: string
    type: string
    progress?: { current: number; total: number }
  }[]
  estimatedSetupTime: string
  requiresOAuth: boolean
  requiresAgent: boolean
  recommendedPlan: string
  estimatedMonthlyCost: number
}

export interface ProposedTable {
  name: string
  sourceFiles: string[]
  columns: {
    name: string
    originalNames: string[]
    semanticType: string
    isPrimaryKey: boolean
    isForeignKey: boolean
  }[]
  estimatedRows: number
  isMasterData: boolean
  mergedFrom?: string[]
}

export interface DetectedRelationship {
  fromTable: string
  fromColumn: string
  toTable: string
  toColumn: string
  confidence: number
  type: string
}

export interface DetectedTerm {
  term: string
  meaning: string
  foundIn: string[]
  confidence: number
}

export interface ProposedModel {
  tables: ProposedTable[]
  relationships: DetectedRelationship[]
  terminology: DetectedTerm[]
  warnings: string[]
  summary: {
    totalTables: number
    totalRows: number
    totalFiles: number
  }
}

export interface StageInfo {
  title: string
  description: string
  estimatedMinutes: number
}

// ============================================
// Clarification Types
// ============================================

export interface ClarificationQuestionOption {
  value: string
  label: string
  description?: string
  icon?: string
}

export interface ClarificationQuestion {
  id: string
  type: 'business_context' | 'schema_validation' | 'terminology' | 'data_quality'
  question: string
  importance: 'critical' | 'high' | 'medium' | 'low'
  options?: ClarificationQuestionOption[]
  context?: {
    columnName?: string
    sampleValues?: string[]
    suggestedAnswer?: string
  }
  createdAt: string
}

export interface ClarificationState {
  needed: boolean
  reason: 'low_quality_score' | 'low_confidence' | 'both'
  questions: ClarificationQuestion[]
  answeredCount: number
  pendingCount: number
  qualityScore?: number
  llmConfidence?: number
  skipped?: boolean
}

export interface ClarificationAnswer {
  questionId: string
  answer: string
}

// ============================================
// Validation Types
// ============================================

export interface ValidationError {
  fileId: string
  fileName: string
  errorType: 'corrupt' | 'empty' | 'no_headers' | 'schema_failed' | 'unsupported' | 'too_large'
  message: string
  suggestion: string
}

export interface ValidationWarning {
  fileId: string
  fileName: string
  warningType: string
  message: string
}

export interface ProcessingStatus {
  hasProcessing: boolean
  stateId?: string
  stage?: string
  stageInfo?: StageInfo
  progress?: { current: number; total: number; percentage: number }
  timing?: {
    startedAt: string
    stageStartedAt: string
    completedAt?: string
  }
  model?: ProposedModel
  qualityScore?: number
  error?: string | { stage?: string; message?: string; retryable?: boolean }
  message?: string
  // Clarification support
  clarification?: ClarificationState
  // Validation support
  validationErrors?: ValidationError[]
  validationWarnings?: ValidationWarning[]
}

export interface ReadyStatus {
  ready: boolean
  organizationName: string
  businessType: string
  industry: string
  qualityScore?: number
  completedAt?: string
  dataSources: {
    total: number
    ready: number
    tables: string[]
  }
  chatbot: {
    available: boolean
    endpoint?: string
    suggestedQuestions: string[]
  }
}

export const onboardingApi = {
  // Get wizard questions
  getQuestions: (token: string) =>
    request<{ questions: WizardQuestion[]; totalSteps: number; stepTitles: string[] }>(
      '/onboarding/questions',
      { token }
    ),

  // Submit wizard answers and get plan
  submitPlan: (token: string, answers: WizardAnswers) =>
    request<{ success: boolean; plan: OnboardingPlan; summary: any }>(
      '/onboarding/plan',
      {
        method: 'POST',
        body: JSON.stringify(answers),
        token,
      }
    ),

  // Start processing with file upload
  startProcessing: async (token: string, files: File[]) => {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))

    return request<{
      success: boolean
      stateId: string
      status: string
      message: string
      model: ProposedModel
    }>('/onboarding/process/start', {
      method: 'POST',
      body: formData,
      token,
    })
  },

  // Get processing status
  getProcessingStatus: (token: string) =>
    request<ProcessingStatus>('/onboarding/process/status', { token }),

  // Confirm model and continue
  confirmModel: (
    token: string,
    accept: boolean,
    modifications?: {
      tableRenames?: Record<string, string>
      columnRenames?: Record<string, string>
      additionalTerminology?: { term: string; meaning: string }[]
    }
  ) =>
    request<{ success: boolean; message: string; status: string; stageInfo: StageInfo }>(
      '/onboarding/process/confirm',
      {
        method: 'POST',
        body: JSON.stringify({ accept, modifications }),
        token,
      }
    ),

  // Check if chatbot is ready
  checkReady: (token: string) =>
    request<ReadyStatus>('/onboarding/ready', { token }),

  // Get all stage labels
  getStages: (token: string) =>
    request<{ stages: (StageInfo & { id: string })[] }>('/onboarding/stages', { token }),

  // Sign DPA
  signDpa: (token: string) =>
    request<{ success: boolean; signedAt: string; message: string }>(
      '/onboarding/step/sign-dpa',
      { method: 'POST', token }
    ),

  // Get suggested questions
  getSuggestedQuestions: (token: string) =>
    request<{ suggestions: string[]; businessType: string }>(
      '/onboarding/suggested-questions',
      { token }
    ),

  // Recalculate quality score
  recalculateQuality: (token: string) =>
    request<{
      success: boolean
      previousScore: number
      newScore: number
      breakdown: {
        schemaUnderstanding: number
        terminologyCoverage: number
        queryValidation: number
        relationshipConfidence: number
      }
      isReady: boolean
      issues: string[]
      validatedQueries: number
      totalQueries: number
    }>('/onboarding/recalculate-quality', { method: 'POST', token }),

  // ============================================
  // Clarification API
  // ============================================

  // Get clarification questions
  getClarificationQuestions: (token: string) =>
    request<{
      success: boolean
      reason: 'low_quality_score' | 'low_confidence' | 'both'
      qualityScore?: number
      llmConfidence?: number
      questions: ClarificationQuestion[]
      pendingCount: number
      answeredCount: number
    }>('/onboarding/clarification/questions', { token }),

  // Submit clarification answers
  submitClarificationAnswers: (token: string, answers: ClarificationAnswer[]) =>
    request<{
      success: boolean
      message: string
      improved: boolean
      previousScore?: number
      newScore?: number
      nextStage: string
    }>('/onboarding/clarification/submit', {
      method: 'POST',
      body: JSON.stringify({ answers }),
      token,
    }),

  // Skip clarification
  skipClarification: (token: string) =>
    request<{
      success: boolean
      message: string
      qualityScore?: number
      warning?: string
      nextStage: string
    }>('/onboarding/clarification/skip', { method: 'POST', token }),
}

// ============================================
// Chat API
// ============================================

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  sql?: string
  data?: any[]
  error?: string
  timestamp: string
  tokens?: { input: number; output: number }
  costUsd?: number
  model?: string
  provider?: string
  source?: string
}

export interface ChatResponse {
  success: boolean
  answer: string
  sql?: string
  data?: any[]
  confidence?: number
  conversationId: string
  tokens?: { input: number; output: number }
  costUsd?: number
  source?: string
}

export const chatApi = {
  // Ask a question (optionally in a conversation)
  ask: (token: string, question: string, conversationId?: string) =>
    request<ChatResponse>('/query/ask', {
      method: 'POST',
      body: JSON.stringify({ question, conversationId }),
      token,
    }),
}

// ============================================
// Conversations API
// ============================================

export interface Conversation {
  id: string
  title: string
  messageCount: number
  totalTokens: number
  totalCostUsd: number
  createdAt: string
  updatedAt: string
}

export interface ConversationDetail {
  id: string
  title: string
  dataSourceId?: string
  totalTokensInput: number
  totalTokensOutput: number
  totalCostUsd: number
  createdAt: string
  updatedAt: string
}

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sql?: string
  data?: any[]
  source?: string
  tokens: { input: number; output: number }
  costUsd: number
  model?: string
  provider?: string
  createdAt: string
}

export interface ConversationStats {
  totalConversations: number
  totalMessages: number
  totalTokens: number
  totalCostUsd: number
  averageTokensPerConversation: number
}

export const conversationsApi = {
  // List all conversations
  list: (token: string, limit = 50, offset = 0) =>
    request<{
      conversations: Conversation[]
      pagination: { limit: number; offset: number; hasMore: boolean }
    }>(`/conversations?limit=${limit}&offset=${offset}`, { token }),

  // Get single conversation with messages
  get: (token: string, id: string) =>
    request<{
      conversation: ConversationDetail
      messages: ConversationMessage[]
    }>(`/conversations/${id}`, { token }),

  // Create new conversation
  create: (token: string, title?: string, dataSourceId?: string) =>
    request<{
      success: boolean
      conversation: { id: string; title: string | null; createdAt: string }
    }>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ title, dataSourceId }),
      token,
    }),

  // Delete conversation
  delete: (token: string, id: string) =>
    request<{ success: boolean; message: string }>(`/conversations/${id}`, {
      method: 'DELETE',
      token,
    }),

  // Update conversation title
  updateTitle: (token: string, id: string, title: string) =>
    request<{ success: boolean; title: string }>(`/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
      token,
    }),

  // Get stats summary
  stats: (token: string) =>
    request<{ stats: ConversationStats }>('/conversations/stats/summary', { token }),
}

// ============================================
// Auth API
// ============================================

export const authApi = {
  // Login
  login: (email: string, password: string) =>
    request<{ token: string; user: { id: string; email: string; name: string } }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    ),

  // Register
  register: (data: { email: string; password: string; name: string; organizationName: string }) =>
    request<{ token: string; user: { id: string; email: string; name: string } }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  // Get current user
  me: (token: string) =>
    request<{ user: { id: string; email: string; name: string }; organization: any }>(
      '/auth/me',
      { token }
    ),
}

// ============================================
// Data Sources API
// ============================================

export interface DataSource {
  id: string
  name: string
  type: 'excel' | 'csv' | 'pdf' | 'docx' | 'doc' | 'postgresql' | 'mysql' | 'sqlserver' | 'agent'
  status: 'pending' | 'processing' | 'ready' | 'error' | 'syncing'
  originalFilename?: string
  sizeBytes?: number
  rowCount?: number
  errorMessage?: string
  createdAt: string
  lastSyncAt?: string
}

export interface DataSourcePreview {
  dataSourceId: string
  tableName: string
  columns: { name: string; type: string; semanticType?: string }[]
  rows: Record<string, any>[]
  totalRows: number
  previewRows: number
}

export interface DocumentContent {
  dataSourceId: string
  documentId: string
  name: string
  type: string
  category?: string
  status: string
  content: {
    rawText?: string
    summary?: string
    structuredData?: Record<string, any>
    extractedEntities?: any[]
    extractedTables?: any[]
  }
  wordCount: number
  createdAt: string
}

export const dataSourcesApi = {
  // List all data sources
  list: (token: string) =>
    request<{ dataSources: DataSource[] }>('/data-sources', { token }),

  // Get single data source
  get: (token: string, id: string) =>
    request<{ dataSource: DataSource }>(`/data-sources/${id}`, { token }),

  // Get preview (first N rows) - for Excel/CSV
  preview: (token: string, id: string, limit = 10) =>
    request<DataSourcePreview>(`/data-sources/${id}/preview?limit=${limit}`, { token }),

  // Get document content - for PDF/Word
  document: (token: string, id: string) =>
    request<DocumentContent>(`/data-sources/${id}/document`, { token }),

  // Get schema
  schema: (token: string, id: string) =>
    request<{
      schema: Record<string, any[]>
      relationships: any[]
      piiColumns: any[]
      rowCount: number
    }>(`/data-sources/${id}/schema`, { token }),

  // Delete data source
  delete: (token: string, id: string) =>
    request<{ success: boolean; message: string }>(`/data-sources/${id}`, {
      method: 'DELETE',
      token,
    }),
}

export { ApiError }
