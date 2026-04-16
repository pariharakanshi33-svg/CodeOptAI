function optimizeWhitespace(code) {
  return code
    .replace(/\t/g, '  ')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function optimizeJavaScript(code) {
  const sumLoopPattern =
    /function\s+(\w+)\s*\(\s*(\w+)\s*\)\s*\{\s*let\s+(\w+)\s*=\s*0\s*;?\s*for\s*\(\s*let\s+\w+\s*=\s*0\s*;\s*\w+\s*<\s*\2\.length\s*;\s*\w+\+\+\s*\)\s*\{\s*\3\s*(?:=|\+=)\s*\2\[\w+\]\s*;?\s*\}\s*return\s+\3\s*;?\s*\}/s
  const match = code.match(sumLoopPattern)
  if (match) {
    const fnName = match[1]
    const arrName = match[2]
    return `function ${fnName}(${arrName}) {\n  return ${arrName}.reduce((total, item) => total + item, 0)\n}`
  }

  return code.replace(/\bvar\b/g, 'let')
}

function optimizePython(code) {
  const sumLoopPattern =
    /def\s+(\w+)\s*\(\s*(\w+)\s*\)\s*:\s*total\s*=\s*0\s*for\s+\w+\s+in\s+range\(len\(\2\)\)\s*:\s*total\s*\+=\s*\2\[\w+\]\s*return\s+total/s
  const match = code.match(sumLoopPattern)
  if (match) {
    const fnName = match[1]
    const arrName = match[2]
    return `def ${fnName}(${arrName}):\n    return sum(${arrName})`
  }
  return code
}

function optimizeCpp(code) {
  const sumLoopPattern =
    /int\s+(\w+)\s*\(\s*vector<int>\s+(\w+)\s*\)\s*\{\s*int\s+(\w+)\s*=\s*0\s*;\s*for\s*\(\s*int\s+\w+\s*=\s*0\s*;\s*\w+\s*<\s*\2\.size\(\)\s*;\s*\w+\+\+\s*\)\s*\{\s*\3\s*\+=\s*\2\[\w+\]\s*;\s*\}\s*return\s+\3\s*;\s*\}/s
  const match = code.match(sumLoopPattern)
  if (match) {
    const fnName = match[1]
    const arrName = match[2]
    return `int ${fnName}(const vector<int>& ${arrName}) {\n    int total = 0;\n    for (int value : ${arrName}) {\n        total += value;\n    }\n    return total;\n}`
  }
  return code
}

function optimizeJava(code) {
  const sumLoopPattern =
    /public\s+static\s+int\s+(\w+)\s*\(\s*List<Integer>\s+(\w+)\s*\)\s*\{\s*int\s+(\w+)\s*=\s*0\s*;\s*for\s*\(\s*int\s+\w+\s*=\s*0\s*;\s*\w+\s*<\s*\2\.size\(\)\s*;\s*\w+\+\+\s*\)\s*\{\s*\3\s*\+=\s*\2\.get\(\w+\)\s*;\s*\}\s*return\s+\3\s*;\s*\}/s
  const match = code.match(sumLoopPattern)
  if (match) {
    const fnName = match[1]
    const arrName = match[2]
    return `public static int ${fnName}(List<Integer> ${arrName}) {\n    int total = 0;\n    for (int value : ${arrName}) {\n        total += value;\n    }\n    return total;\n}`
  }
  return code
}

function runLanguageOptimization(code, language) {
  if (language === 'javascript') return optimizeJavaScript(code)
  if (language === 'python') return optimizePython(code)
  if (language === 'cpp') return optimizeCpp(code)
  if (language === 'java') return optimizeJava(code)
  return code
}

function withFallbackNote(code, language) {
  const note = {
    javascript: '// Optimized in fallback mode: applied safe cleanup and suggestions.',
    python: '# Optimized in fallback mode: applied safe cleanup and suggestions.',
    cpp: '// Optimized in fallback mode: applied safe cleanup and suggestions.',
    java: '// Optimized in fallback mode: applied safe cleanup and suggestions.',
  }[language]

  if (!note) return code
  if (code.startsWith(note)) return code
  return `${note}\n${code}`
}

function languageTips(language) {
  const common = [
    'Use descriptive variable names to improve readability.',
    'Break large functions into smaller, testable units.',
    'Add input validation for safer execution paths.',
  ]

  if (language === 'javascript') {
    return [
      'Prefer const/let over var and avoid mutating shared state.',
      'Use array methods like reduce/map/filter when they improve clarity.',
      ...common,
    ]
  }

  if (language === 'python') {
    return [
      'Prefer enumerate and direct iteration over index-based loops.',
      'Use list/dict comprehensions for concise transformations.',
      ...common,
    ]
  }

  if (language === 'cpp') {
    return [
      'Pass large containers by const reference to avoid copies.',
      'Prefer range-based loops when indices are unnecessary.',
      ...common,
    ]
  }

  if (language === 'java') {
    return [
      'Prefer enhanced for-loops when index access is unnecessary.',
      'Use final for values that should not change after assignment.',
      ...common,
    ]
  }

  return common
}

function analyzeComplexity(code) {
  const loops = (code.match(/\b(for|while)\b/g) || []).length
  if (loops >= 2) return { time: 'Likely O(n^2)', space: 'Likely O(1) to O(n)' }
  if (loops === 1) return { time: 'Likely O(n)', space: 'Likely O(1)' }
  return { time: 'Likely O(1)', space: 'Likely O(1)' }
}

function fallbackOptimize(code, language) {
  const cleaned = optimizeWhitespace(code)
  const optimizedCore = runLanguageOptimization(cleaned, language)
  const changedByRule = optimizedCore !== cleaned
  const optimized = changedByRule ? optimizedCore : withFallbackNote(optimizedCore, language)
  const changed = optimized !== cleaned

  return {
    optimizedCode: optimized,
    explanation: [
      changed
        ? 'Applied deterministic refactoring to improve readability and iteration style.'
        : 'Applied formatting cleanup (trimmed trailing spaces and normalized spacing).',
      'Preserved original logic because AI provider is not configured.',
      changed
        ? 'Used language-specific fallback transformations for common loop patterns.'
        : 'Provided best-practice recommendations based on selected language.',
    ],
    suggestions: languageTips(language),
    complexity: analyzeComplexity(code),
  }
}

function fallbackExplain(language) {
  return {
    explanation: [
      `This ${language} snippet was analyzed in fallback mode.`,
      'Set LLM_API_KEY in backend/.env for deeper AI-generated explanations.',
      'Current output focuses on structural readability recommendations.',
    ],
  }
}

function fallbackBugs() {
  return {
    bugs: [
      'No AI bug scan available in fallback mode.',
      'Set LLM_API_KEY in backend/.env to enable model-based bug detection.',
    ],
  }
}

module.exports = {
  fallbackOptimize,
  fallbackExplain,
  fallbackBugs,
}
