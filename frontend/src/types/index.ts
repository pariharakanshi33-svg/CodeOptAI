export type SupportedLanguage = 'javascript' | 'python' | 'cpp' | 'java'

export interface AnalysisResponse {
  optimizedCode: string
  explanation: string[]
  suggestions: string[]
  language: SupportedLanguage
  complexity: {
    time: string
    space: string
  }
}

export interface HistoryItem {
  id: string
  createdAt: string
  language: SupportedLanguage
  originalCode: string
  optimizedCode: string
}
