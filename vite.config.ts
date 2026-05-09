import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// API代理插件
function apiProxyPlugin(): Plugin {
  return {
    name: 'api-proxy',
    configureServer(server) {
      server.middlewares.use('/api/proxy', async (req, res) => {
        console.log(`[Proxy] ${req.method} ${req.url}`)
        
        // 设置CORS头
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, anthropic-version')

        if (req.method === 'OPTIONS') {
          res.statusCode = 200
          res.end()
          return
        }

        // 收集请求体
        const chunks: Buffer[] = []
        req.on('data', (chunk) => {
          chunks.push(Buffer.from(chunk))
        })

        req.on('end', async () => {
          try {
            // 解析请求参数
            const url = new URL(req.url || '/', `http://${req.headers.host}`)
            const targetUrl = url.searchParams.get('url')

            if (!targetUrl) {
              console.error('[Proxy] Missing url parameter')
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Missing url parameter' }))
              return
            }

            console.log(`[Proxy] Forwarding to: ${targetUrl}`)

            // 构建请求头
            const headers: Record<string, string> = {
              'Content-Type': 'application/json',
            }

            // 转发Authorization头
            if (req.headers.authorization) {
              headers['Authorization'] = req.headers.authorization
            }

            // 转发自定义头
            if (req.headers['x-api-key']) {
              headers['x-api-key'] = req.headers['x-api-key'] as string
            }
            if (req.headers['anthropic-version']) {
              headers['anthropic-version'] = req.headers['anthropic-version'] as string
            }

            const body = chunks.length > 0 ? Buffer.concat(chunks).toString() : undefined
            
            if (body) {
              console.log(`[Proxy] Request body length: ${body.length}`)
            }

            // 发送请求到目标API - 增加超时时间
            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), 300000) // 5分钟超时
            
            try {
              const response = await fetch(targetUrl, {
                method: req.method,
                headers,
                body: req.method === 'POST' ? body : undefined,
                signal: controller.signal,
              })

              clearTimeout(timeout)
              console.log(`[Proxy] Response status: ${response.status}`)

              // 转发响应
              res.statusCode = response.status
              res.setHeader('Content-Type', 'application/json')
              
              const responseText = await response.text()
              
              // 检查响应是否成功
              if (!response.ok) {
                console.error(`[Proxy] API error: ${responseText}`)
              }
              
              res.end(responseText)
            } catch (fetchError: any) {
              clearTimeout(timeout)
              if (fetchError.name === 'AbortError') {
                console.error('[Proxy] Request timeout')
                res.statusCode = 504
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: { message: '请求超时，请尝试使用更快的模型或简化描述' } }))
              } else {
                throw fetchError
              }
            }
          } catch (error: any) {
            console.error('[Proxy] Error:', error.message)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: { message: error.message } }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), apiProxyPlugin()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
  server: {
    port: 5173,
    host: true,
    open: true,
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
})
