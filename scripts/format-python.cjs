'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';
const venvPython = isWin
    ? path.join(root, 'venv-tools', 'Scripts', 'python.exe')
    : path.join(root, 'venv-tools', 'bin', 'python');
const pythonExecutable = fs.existsSync(venvPython) ? venvPython : process.env.PYTHON || 'python';

const checkOnly = process.argv.includes('--check');

function runRuff(args) {
    const result = spawnSync(pythonExecutable, ['-m', 'ruff', ...args], {
        cwd: root,
        stdio: 'inherit',
    });
    if (result.error) {
        console.error(result.error.message);
        process.exit(1);
    }
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

if (checkOnly) {
    runRuff(['check']);
    runRuff(['format', '--check']);
} else {
    runRuff(['check', '--fix', '--unsafe-fixes']);
    runRuff(['format']);
}
