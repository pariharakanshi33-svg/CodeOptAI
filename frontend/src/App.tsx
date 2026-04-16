import Editor from '@monaco-editor/react'
import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  explainCode,
  fetchHistory,
  findBugs,
  optimizeCode,
} from './services/api'
import type { AnalysisResponse, HistoryItem, SupportedLanguage } from './types'

const defaultCode: Record<SupportedLanguage, string> = {
  javascript: `function sum(arr){\n  let total = 0\n  for(let i = 0; i < arr.length; i++){\n    total = total + arr[i]\n  }\n  return total\n}`,
  python: `def sum_array(arr):\n    total = 0\n    for i in range(len(arr)):\n        total += arr[i]\n    return total`,
  cpp: `#include <vector>\nusing namespace std;\n\nint sum(vector<int> arr){\n    int total = 0;\n    for(int i = 0; i < arr.size(); i++){\n        total += arr[i];\n    }\n    return total;\n}`,
  java: `import java.util.List;\n\npublic class Sum {\n    public static int sum(List<Integer> arr) {\n        int total = 0;\n        for (int i = 0; i < arr.size(); i++) {\n            total += arr.get(i);\n        }\n        return total;\n    }\n}`,
}

const languageOptions: SupportedLanguage[] = ['javascript', 'python', 'cpp', 'java']

function App() {
  const [language, setLanguage] = useState<SupportedLanguage>('javascript')
  const [sourceCode, setSourceCode] = useState(defaultCode.javascript)
  const [optimizedCode, setOptimizedCode] = useState('')
  const [explanation, setExplanation] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [bugs, setBugs] = useState<string[]>([])
  const [complexity, setComplexity] = useState({ time: '-', space: '-' })
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canAnalyze = useMemo(() => sourceCode.trim().length > 0, [sourceCode])

  useEffect(() => {
    setSourceCode(defaultCode[language])
    setOptimizedCode('')
    setExplanation([])
    setSuggestions([])
    setBugs([])
    setComplexity({ time: '-', space: '-' })
  }, [language])

  useEffect(() => {
    void refreshHistory()
  }, [])

  async function refreshHistory() {
    try {
      const items = await fetchHistory()
      setHistory(items)
    } catch {
      // Ignore history fetch failures to keep UI responsive.
    }
  }

  async function runOptimize() {
    if (!canAnalyze) return
    setLoading(true)
    setError('')
    try {
      const result: AnalysisResponse = await optimizeCode({ code: sourceCode, language })
      setOptimizedCode(result.optimizedCode)
      setExplanation(result.explanation)
      setSuggestions(result.suggestions)
      setComplexity(result.complexity)
      await refreshHistory()
    } catch (err) {
      if (axios.isAxiosError<{ error?: string }>(err)) {
        setError(err.response?.data?.error || 'Unable to optimize code right now.')
      } else {
        setError('Unable to optimize code right now. Check backend and API key settings.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function runExplain() {
    if (!canAnalyze) return
    setLoading(true)
    setError('')
    try {
      const { explanation: explanationData } = await explainCode({ code: sourceCode, language })
      setExplanation(explanationData)
    } catch (err) {
      if (axios.isAxiosError<{ error?: string }>(err)) {
        setError(err.response?.data?.error || 'Unable to explain code at this moment.')
      } else {
        setError('Unable to explain code at this moment.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function runFindBugs() {
    if (!canAnalyze) return
    setLoading(true)
    setError('')
    try {
      const { bugs: bugList } = await findBugs({ code: sourceCode, language })
      setBugs(bugList)
    } catch (err) {
      if (axios.isAxiosError<{ error?: string }>(err)) {
        setError(err.response?.data?.error || 'Unable to run bug analysis right now.')
      } else {
        setError('Unable to run bug analysis right now.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function copyOptimizedCode() {
    if (!optimizedCode) return
    await navigator.clipboard.writeText(optimizedCode)
  }

  function downloadOptimizedCode() {
    if (!optimizedCode) return
    const extensionMap: Record<SupportedLanguage, string> = {
      javascript: 'js',
      python: 'py',
      cpp: 'cpp',
      java: 'java',
    }
    const blob = new Blob([optimizedCode], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `optimized-code.${extensionMap[language]}`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <header className="rounded-xl border border-slate-800 bg-slate-900 p-4 md:p-5">
          <h1 className="text-2xl font-bold text-cyan-300 md:text-3xl">CodeOptAI</h1>
          <p className="mt-2 text-sm text-slate-300 md:text-base">
            Paste your code, optimize it with AI, and get practical suggestions for
            performance, readability, and best practices.
          </p>
        </header>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <label className="text-sm text-slate-300">
                Language
                <select
                  className="ml-2 rounded-md border border-slate-700 bg-slate-800 px-2 py-1"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                >
                  {languageOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded-md bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                  disabled={loading || !canAnalyze}
                  onClick={runOptimize}
                >
                  {loading ? 'Optimizing...' : 'Optimize Code'}
                </button>
                <button
                  className="rounded-md border border-slate-600 px-3 py-2 text-sm"
                  disabled={loading || !canAnalyze}
                  onClick={runExplain}
                >
                  Explain Code
                </button>
                <button
                  className="rounded-md border border-slate-600 px-3 py-2 text-sm"
                  disabled={loading || !canAnalyze}
                  onClick={runFindBugs}
                >
                  Find Bugs
                </button>
              </div>
            </div>

            <Editor
              height="60vh"
              theme="vs-dark"
              language={language === 'cpp' ? 'cpp' : language}
              value={sourceCode}
              onChange={(value) => setSourceCode(value ?? '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                automaticLayout: true,
              }}
            />
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-3 flex flex-wrap justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-100">Output</h2>
              <div className="flex gap-2">
                <button
                  className="rounded-md border border-slate-600 px-3 py-1 text-sm"
                  onClick={copyOptimizedCode}
                  disabled={!optimizedCode}
                >
                  Copy
                </button>
                <button
                  className="rounded-md border border-slate-600 px-3 py-1 text-sm"
                  onClick={downloadOptimizedCode}
                  disabled={!optimizedCode}
                >
                  Download
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="mb-2 text-sm text-slate-400">Original</p>
                <Editor
                  height="28vh"
                  theme="vs-dark"
                  language={language === 'cpp' ? 'cpp' : language}
                  value={sourceCode}
                  options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13 }}
                />
              </div>
              <div>
                <p className="mb-2 text-sm text-slate-400">Optimized</p>
                <Editor
                  height="28vh"
                  theme="vs-dark"
                  language={language === 'cpp' ? 'cpp' : language}
                  value={optimizedCode || '// Optimized code will appear here...'}
                  options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13 }}
                />
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-cyan-300">Improvements</h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  {explanation.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-cyan-300">Suggestions</h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  {suggestions.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300">
              <p>Complexity (estimated):</p>
              <p>Time: {complexity.time}</p>
              <p>Space: {complexity.space}</p>
            </div>

            {bugs.length > 0 && (
              <div className="mt-4">
                <h3 className="mb-2 text-sm font-semibold text-rose-300">Potential Bugs</h3>
                <ul className="space-y-2 text-sm text-rose-200">
                  {bugs.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            )}

            {error && (
              <p className="mt-4 rounded-md border border-rose-700 bg-rose-900/30 px-3 py-2 text-sm text-rose-200">
                {error}
              </p>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h2 className="mb-3 text-lg font-semibold text-slate-100">Recent Optimizations</h2>
          <div className="space-y-2 text-sm text-slate-300">
            {history.length === 0 && <p>No history yet.</p>}
            {history.slice(0, 5).map((item) => (
              <article key={item.id} className="rounded-md border border-slate-800 bg-slate-950 p-3">
                <p className="text-xs text-slate-400">
                  {item.language} - {new Date(item.createdAt).toLocaleString()}
                </p>
                <p className="mt-1 truncate">{item.originalCode.replace(/\s+/g, ' ').slice(0, 100)}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

export default App
