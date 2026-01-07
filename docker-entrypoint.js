#!/usr/bin/env node

const { spawn } = require('node:child_process')
const path = require('path')
const fs = require('fs')

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
    console.log('[docker-entrypoint] Starting Next.js server on 0.0.0.0:3000...')

    // When using standalone output, next start will use the built app
    // Start with: next start
    await exec('node /app/.next/standalone/node_modules/.bin/next start', env)
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
