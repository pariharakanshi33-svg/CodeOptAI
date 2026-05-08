import axios from 'axios'
import type { AnalysisResponse, HistoryItem, SupportedLanguage } from '../types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://codeoptai.onrender.com',
})
const usePuter = import.meta.env.VITE_USE_PUTER === 'true'

async function puterOptimize(code: string, language: SupportedLanguage): Promise<AnalysisResponse> {
  if (!window.puter?.ai?.chat) {
    throw new Error('Puter SDK is unavailable in this browser session')
  }

  const prompt = `Optimize this ${language} code and return JSON with keys: optimizedCode (string), explanation (string[]), suggestions (string[]), complexity ({time,space}). Code:\n\n${code}`
  const response = await window.puter.ai.chat(prompt, {
    model: import.meta.env.VITE_PUTER_MODEL || 'gpt-4.1-mini',
  })

  const raw = typeof response === 'string' ? response : response?.message?.content || '{}'
  const parsed = JSON.parse(raw)
  return {
    optimizedCode: parsed.optimizedCode || code,
    explanation: parsed.explanation || [],
    suggestions: parsed.suggestions || [],
    language,
    complexity: {
      time: parsed.complexity?.time || 'Not provided',
      space: parsed.complexity?.space || 'Not provided',
    },
  }
}

export async function optimizeCode(payload: {
  code: string
  language: SupportedLanguage
}): Promise<AnalysisResponse> {
  if (usePuter) {
    return puterOptimize(payload.code, payload.language)
  }
  const { data } = await api.post<AnalysisResponse>('/optimize', payload)
  return data
}

export async function explainCode(payload: {
  code: string
  language: SupportedLanguage
}): Promise<{ explanation: string[] }> {
  const { data } = await api.post<{ explanation: string[] }>('/explain', payload)
  return data
}

export async function findBugs(payload: {
  code: string
  language: SupportedLanguage
}): Promise<{ bugs: string[] }> {
  const { data } = await api.post<{ bugs: string[] }>('/find-bugs', payload)
  return data
}

export async function fetchHistory(): Promise<HistoryItem[]> {
  const { data } = await api.get<HistoryItem[]>('/history')
  return data
}
