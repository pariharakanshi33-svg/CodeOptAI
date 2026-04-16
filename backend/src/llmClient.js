function getLLMConfig() {
  const provider = (process.env.LLM_PROVIDER || 'groq').toLowerCase()

  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY || ''
    const baseUrl = process.env.OPENAI_BASE_URL || process.env.LLM_BASE_URL || 'https://api.openai.com/v1'
    const model = process.env.OPENAI_MODEL || process.env.LLM_MODEL || 'gpt-4o-mini'
    return { provider, apiKey, baseUrl, model }
  }

  const apiKey = process.env.GROQ_API_KEY || process.env.LLM_API_KEY || ''
  const baseUrl = process.env.GROQ_BASE_URL || process.env.LLM_BASE_URL || 'https://api.groq.com/openai/v1'
  const model = process.env.GROQ_MODEL || process.env.LLM_MODEL || 'llama-3.3-70b-versatile'
  return { provider, apiKey, baseUrl, model }
}

function hasUsableApiKey(value) {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return !normalized.startsWith('your_')
}

function extractJsonContent(content) {
  if (typeof content !== 'string') {
    throw new Error('Invalid LLM response: content is not a string')
  }

  const fenced = content.match(/```json\s*([\s\S]*?)\s*```/i)
  if (fenced?.[1]) return JSON.parse(fenced[1])
  return JSON.parse(content)
}

async function callLLM(messages) {
  const { apiKey, baseUrl, model } = getLLMConfig()
  if (!hasUsableApiKey(apiKey)) {
    throw new Error('Missing LLM API key in backend .env')
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`LLM request failed (${response.status}): ${details}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('Invalid LLM response: missing content')
  }

  return extractJsonContent(content)
}

function buildOptimizePrompt(code, language) {
  return [
    {
      role: 'system',
      content:
        'You are an expert software performance engineer and code reviewer. Return strict JSON only.',
    },
    {
      role: 'user',
      content: `Optimize this ${language} code and respond as JSON with keys: optimizedCode (string), explanation (array of strings), suggestions (array of strings), complexity (object with time and space strings). Code:\n\n${code}`,
    },
  ]
}

function buildExplainPrompt(code, language) {
  return [
    {
      role: 'system',
      content: 'You explain code succinctly. Return strict JSON only.',
    },
    {
      role: 'user',
      content: `Explain this ${language} code in bullet-style points as JSON: {"explanation": string[]}. Code:\n\n${code}`,
    },
  ]
}

function buildBugPrompt(code, language) {
  return [
    {
      role: 'system',
      content: 'You are a static analysis assistant. Return strict JSON only.',
    },
    {
      role: 'user',
      content: `Find potential bugs in this ${language} code and return JSON: {"bugs": string[]}. Code:\n\n${code}`,
    },
  ]
}

module.exports = {
  callLLM,
  buildOptimizePrompt,
  buildExplainPrompt,
  buildBugPrompt,
  getLLMConfig,
  hasUsableApiKey,
}
