#!/usr/bin/env node
// Updated: 2026-01-08

const { spawn } = require('node:child_process')
const path = require('path')

const env = {
  ...process.env,
  NODE_ENV: 'production',
  HOSTNAME: '0.0.0.0',
  PORT: '3000',
}

;(async() => {
  const args = process.argv.slice(2)
  const command = args.join(' ')

  if (command === 'pnpm run start') {
    console.log('[docker-entrypoint] Starting Next.js standalone server on 0.0.0.0:3000...')

    // Use next start from /app/node_modules
    // Working directory is set to /app/.next/standalone
    await exec('node /app/node_modules/next/dist/bin/next start', env)
  } else {
    // launch application with explicit environment variables
    await exec(command, env)
  }
})()

function exec(command, env) {
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
