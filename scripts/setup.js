import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

const root = path.join(import.meta.dirname, '..');
const envPath = path.join(root, '.env');
const examplePath = path.join(root, '.env.example');

const run = (cmd) => {
    console.log(`\n> ${cmd}`);
    execSync(cmd, { stdio: 'inherit', cwd: root });
}

if (!fs.existsSync(envPath)) {
    fs.copyFileSync(examplePath, envPath);
    console.log('.env dibuat dari .env.example');
}

let env = fs.readFileSync(envPath, 'utf-8');
const match = env.match(/^JWT_SECRET=["']?(.*?)["']?\s*$/m);
if (!match || !match[1]) {
    const secret = crypto.randomBytes(64).toString('hex');
    env = match
        ? env.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET="${secret}"`)
        : env.trimEnd() + `\nJWT_SECRET="${secret}"\n`;
    fs.writeFileSync(envPath, env);
    console.log('jwt_secret generated');
}

run('docker compose up -d --wait');

if (fs.existsSync(path.join(root, 'prisma', 'migrations'))) {
    run('npx prisma migrate deploy');
}
run('npx prisma generate');

console.log('\n setup selesai');

