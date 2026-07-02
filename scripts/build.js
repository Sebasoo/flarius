const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');

const COPY_ITEMS = ['index.html', 'css', 'js', 'screens', 'assets'];

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

if (fs.existsSync(dist)) {
  fs.rmSync(dist, { recursive: true, force: true });
}

fs.mkdirSync(dist, { recursive: true });

for (const item of COPY_ITEMS) {
  const src = path.join(root, item);
  if (!fs.existsSync(src)) {
    console.error(`Missing build input: ${item}`);
    process.exit(1);
  }
  copyRecursive(src, path.join(dist, item));
}

console.log('Static build complete -> dist/');
