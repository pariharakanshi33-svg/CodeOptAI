const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const crypto = require('crypto')
const {
  callLLM,
  buildOptimizePrompt,
  buildExplainPrompt,
  buildBugPrompt,
  getLLMConfig,
  hasUsableApiKey,
} = require('./llmClient')
const {
  fallbackOptimize,
  fallbackExplain,
  fallbackBugs,
} = require('./fallbackAnalyzer')

dotenv.config({ override: true })

const app = express()
const port = process.env.PORT || 4000
const allowFallback = process.env.ALLOW_FALLBACK === 'true'

app.use(cors())
app.use(express.json({ limit: '1mb' }))

const history = []

function validatePayload(req, res) {
  const { code, language } = req.body
  if (!code || !language) {
    res.status(400).json({ error: 'code and language are required' })
    return null
  }
  return { code, language }
}

app.get('/api/health', (_req, res) => {
  const { provider, apiKey, baseUrl, model } = getLLMConfig()
  res.json({
    status: 'ok',
    service: 'CodeOptAI backend',
    llmProvider: provider,
    llmConfigured: hasUsableApiKey(apiKey),
    llmBaseUrl: baseUrl,
    llmModel: model,
    fallbackEnabled: allowFallback,
  })
})

app.post('/api/optimize', async (req, res) => {
  const payload = validatePayload(req, res)
  if (!payload) return

  try {
    const result = await callLLM(buildOptimizePrompt(payload.code, payload.language))

    const normalized = {
      optimizedCode: result.optimizedCode || payload.code,
      explanation: result.explanation || [],
      suggestions: result.suggestions || [],
      language: payload.language,
      complexity: {
        time: result.complexity?.time || 'Not provided',
        space: result.complexity?.space || 'Not provided',
      },
    }

    history.unshift({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      language: payload.language,
      originalCode: payload.code,
      optimizedCode: normalized.optimizedCode,
    })

    if (history.length > 20) history.pop()

    res.json(normalized)
  } catch (error) {
    if (
      allowFallback &&
      String(error.message || '').includes('Missing LLM API key')
    ) {
      const fallback = fallbackOptimize(payload.code, payload.language)
      history.unshift({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        language: payload.language,
        originalCode: payload.code,
        optimizedCode: fallback.optimizedCode,
      })
      if (history.length > 20) history.pop()
      res.json({
        ...fallback,
        language: payload.language,
      })
      return
    }
    res.status(500).json({ error: error.message || 'Optimization failed' })
  }
})

app.post('/api/explain', async (req, res) => {
  const payload = validatePayload(req, res)
  if (!payload) return

  try {
    const result = await callLLM(buildExplainPrompt(payload.code, payload.language))
    res.json({ explanation: result.explanation || [] })
  } catch (error) {
    if (
      allowFallback &&
      String(error.message || '').includes('Missing LLM API key')
    ) {
      res.json(fallbackExplain(payload.language))
      return
    }
    res.status(500).json({ error: error.message || 'Explain failed' })
  }
})

app.post('/api/find-bugs', async (req, res) => {
  const payload = validatePayload(req, res)
  if (!payload) return

  try {
    const result = await callLLM(buildBugPrompt(payload.code, payload.language))
    res.json({ bugs: result.bugs || [] })
  } catch (error) {
    if (
      allowFallback &&
      String(error.message || '').includes('Missing LLM API key')
    ) {
      res.json(fallbackBugs())
      return
    }
    res.status(500).json({ error: error.message || 'Bug scan failed' })
  }
})

app.get('/api/history', (_req, res) => {
  res.json(history)
})

app.listen(port, () => {
  console.log(`CodeOptAI backend running at http://localhost:${port}`)
})
