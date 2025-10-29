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
    console.log('[docker-entrypoint] Starting custom server on 0.0.0.0:3000...')
    await exec('node /app/server.js')
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
