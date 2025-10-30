#!/usr/bin/env node

const { spawn } = require('node:child_process')

const env = {
  ...process.env,
  NODE_ENV: 'production',
  HOSTNAME: '0.0.0.0',
  PORT: '3000',
}

;(async() => {
  // If running the web server then prerender pages
  const args = process.argv.slice(2)
  const command = args.join(' ')

  if (command === 'pnpm run start') {
    console.log('[docker-entrypoint] Starting standalone server on 0.0.0.0:3000...')

    // Copy .next/static to standalone folder if it exists
    // This ensures all static assets are available
    const fs = require('fs')
    const path = require('path')

    const staticSource = '/app/.next/static'
    const staticDest = '/app/.next/standalone/.next/static'

    if (fs.existsSync(staticSource)) {
      console.log('[docker-entrypoint] Copying .next/static to standalone...')
      // Create destination if not exists
      if (!fs.existsSync(path.dirname(staticDest))) {
        fs.mkdirSync(path.dirname(staticDest), { recursive: true })
      }
      // Simple recursive copy
      const copyDir = (src, dest) => {
        fs.mkdirSync(dest, { recursive: true })
        fs.readdirSync(src).forEach(file => {
          const srcPath = path.join(src, file)
          const destPath = path.join(dest, file)
          if (fs.statSync(srcPath).isDirectory()) {
            copyDir(srcPath, destPath)
          } else {
            fs.copyFileSync(srcPath, destPath)
          }
        })
      }
      copyDir(staticSource, staticDest)
      console.log('[docker-entrypoint] ✓ Static files copied')
    }

    await exec('node /app/.next/standalone/server.js')
  } else {
    // launch application with explicit environment variables
    await exec(command)
  }
})()

function exec(command) {
  console.log(`[docker-entrypoint] Executing: ${command}`)
  const child = spawn(command, { shell: true, stdio: 'inherit', env })
  return new Promise((resolve, reject) => {
    child.on('exit', code => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${command} failed rc=${code}`))
      }
    })
  })
}
