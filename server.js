const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

console.log(`[server.js] Starting server with NODE_ENV=${process.env.NODE_ENV}`)
console.log(`[server.js] Configured to listen on ${hostname}:${port}`)

// Create the Next.js app
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare()
  .then(() => {
    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true)
        await handle(req, res, parsedUrl)
      } catch (err) {
        console.error('[server.js] Error handling request:', err)
        res.statusCode = 500
        res.end('Internal server error')
      }
    })

    server.listen(port, hostname, () => {
      console.log(`[server.js] ✓ Server ready on http://${hostname}:${port}`)
      console.log(`[server.js] Listening on all interfaces (0.0.0.0)`)
    })

    server.on('error', (err) => {
      console.error('[server.js] Server error:', err)
      process.exit(1)
    })
  })
  .catch((err) => {
    console.error('[server.js] Failed to prepare app:', err)
    process.exit(1)
  })
