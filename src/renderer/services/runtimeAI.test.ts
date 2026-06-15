import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RuntimeAIService } from '../services/runtimeAI'
import type { AIConfig } from '../services/ai'

describe('RuntimeAIService', () => {
  let service: RuntimeAIService
  const mockConfig: AIConfig = {
    provider: 'anthropic',
    apiKey: 'test-key',
    baseUrl: 'https://api.anthropic.com',
    apiPath: '/v1/messages',
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.7,
    maxTokens: 1024,
    timeout: 30000,
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock Electron proxyRequest
    if (window.electronAPI) {
      window.electronAPI.proxyRequest = vi.fn()
    }
  })

  describe('Anthropic provider', () => {
    it('should generate text with correct API format', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: {},
        body: JSON.stringify({
          content: [{ text: 'Generated response' }],
        }),
      }
      vi.mocked(window.electronAPI!.proxyRequest!).mockResolvedValue(mockResponse)

      service = new RuntimeAIService(mockConfig)
      const result = await service.generate('Test prompt')

      expect(result).toBe('Generated response')
      expect(window.electronAPI!.proxyRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://api.anthropic.com/v1/messages',
          method: 'POST',
        })
      )
    })

    it('should handle API errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        headers: {},
        body: JSON.stringify({ error: { message: 'Invalid API key' } }),
      }
      vi.mocked(window.electronAPI!.proxyRequest!).mockResolvedValue(mockResponse)

      service = new RuntimeAIService(mockConfig)
      await expect(service.generate('Test')).rejects.toThrow('Invalid API key')
    })

    it('should include system prompt in request', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: {},
        body: JSON.stringify({ content: [{ text: 'Response' }] }),
      }
      vi.mocked(window.electronAPI!.proxyRequest!).mockResolvedValue(mockResponse)

      const configWithSystem = { ...mockConfig, systemPrompt: 'You are a helpful assistant' }
      service = new RuntimeAIService(configWithSystem)
      await service.generate('Hello')

      const callArgs = vi.mocked(window.electronAPI!.proxyRequest!).mock.calls[0][0]
      const body = JSON.parse(callArgs.body as string)
      expect(body.system).toBe('You are a helpful assistant')
    })
  })

  describe('OpenAI provider', () => {
    it('should generate text with OpenAI format', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: {},
        body: JSON.stringify({
          choices: [{ message: { content: 'OpenAI response' } }],
        }),
      }
      vi.mocked(window.electronAPI!.proxyRequest!).mockResolvedValue(mockResponse)

      const openaiConfig = {
        ...mockConfig,
        provider: 'openai' as const,
        baseUrl: 'https://api.openai.com',
        apiPath: '/v1/chat/completions',
      }
      service = new RuntimeAIService(openaiConfig)
      const result = await service.generate('Test prompt')

      expect(result).toBe('OpenAI response')
      const callArgs = vi.mocked(window.electronAPI!.proxyRequest!).mock.calls[0][0]
      expect(callArgs.url).toContain('/v1/chat/completions')
    })
  })

  describe('testConnection', () => {
    it('should return success on valid connection', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: {},
        body: JSON.stringify({ content: [{ text: '连接成功' }] }),
      }
      vi.mocked(window.electronAPI!.proxyRequest!).mockResolvedValue(mockResponse)

      service = new RuntimeAIService(mockConfig)
      const result = await service.testConnection()

      expect(result.success).toBe(true)
      // Latency may be 0 in test environment, just check it's a number
      expect(typeof result.latency).toBe('number')
      expect(result.model).toBe('claude-3-5-sonnet-20241022')
    })

    it('should retry once on failure', async () => {
      const mockFailure = {
        ok: false,
        status: 500,
        headers: {},
        body: 'Server error',
      }
      const mockSuccess = {
        ok: true,
        status: 200,
        headers: {},
        body: JSON.stringify({ content: [{ text: '连接成功' }] }),
      }

      vi.mocked(window.electronAPI!.proxyRequest!)
        .mockResolvedValueOnce(mockFailure)
        .mockResolvedValueOnce(mockSuccess)

      service = new RuntimeAIService(mockConfig)
      const result = await service.testConnection()

      expect(result.success).toBe(true)
      expect(window.electronAPI!.proxyRequest).toHaveBeenCalledTimes(2)
    })

    it('should return error after retry fails', async () => {
      const mockFailure = {
        ok: false,
        status: 401,
        headers: {},
        body: JSON.stringify({ error: 'Unauthorized' }),
      }
      vi.mocked(window.electronAPI!.proxyRequest!).mockResolvedValue(mockFailure)

      service = new RuntimeAIService(mockConfig)
      const result = await service.testConnection()

      expect(result.success).toBe(false)
      expect(result.error).toContain('Unauthorized')
    })
  })

  describe('SSRF protection', () => {
    it('should block localhost URLs', async () => {
      const localConfig = { ...mockConfig, baseUrl: 'http://localhost:3000' }
      service = new RuntimeAIService(localConfig)

      await expect(service.generate('test')).rejects.toThrow()
    })

    it('should block private IP ranges', async () => {
      const privateConfig = { ...mockConfig, baseUrl: 'http://192.168.1.1' }
      service = new RuntimeAIService(privateConfig)

      await expect(service.generate('test')).rejects.toThrow()
    })
  })
})
