#!/usr/bin/env node
// Simple orchestrator to run BFF and frontend dev servers in paralell
// Usage: node scripts/start-dev.mjs
const { spawn } = require('child_process');

function spawnAsync(command, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: true, ...opts });
    child.on('error', reject);
    child.on('exit', code => {
      if (code === 0) resolve(); else reject(new Error(`Process ${command} exited with code ${code}`));
    });
  });
}

async function main() {
  try {
    // Start BFF
    const bff = spawn('node', ['server/bff/index.js'], { stdio: 'inherit', shell: true });
    bff.on('error', (err) => { console.error('BFF failed to start:', err); process.exit(1); });
    // Start Frontend (web) if package exists
    const hasWebDev = true;
    const webDevProcess = spawn('npm', ['--prefix', 'web', 'run', 'dev'], { stdio: 'inherit', shell: true });
    webDevProcess.on('error', (err) => { console.error('Frontend dev failed to start:', err); });
    // Await both (only if they exit, we exit as well)
    await Promise.all([
      new Promise((resolve)=>bff.on('close', resolve)),
      new Promise((resolve)=>webDevProcess.on('close', resolve))
    ]);
  } catch (err) {
    console.error('Migration dev server failed to start:', err);
    process.exit(1);
  }
}

main();
