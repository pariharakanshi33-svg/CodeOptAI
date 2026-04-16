interface PuterChatResponse {
  message?: {
    content?: string
  }
}

interface PuterAPI {
  ai?: {
    chat?: (
      prompt: string,
      options?: { model?: string }
    ) => Promise<string | PuterChatResponse>
  }
}

declare global {
  interface Window {
    puter?: PuterAPI
  }
}

export {}
