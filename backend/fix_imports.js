const fs = require('fs');
const path = require('path');

const srcRoot = path.resolve(__dirname, 'src');

function getAllTsFiles(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getAllTsFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) {
      results.push(full);
    }
  }
  return results;
}

const files = getAllTsFiles(srcRoot);
let totalReplacements = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const fileDir = path.dirname(file);

  // Match: from 'src/...' or from "src/..."
  const importRegex = /(['"])src\/([^'"]+)\1/g;

  let modified = false;
  const newContent = content.replace(importRegex, (match, quote, importPath) => {
    const absoluteTarget = path.join(srcRoot, importPath);
    let relativePath = path.relative(fileDir, absoluteTarget).replace(/\\/g, '/');
    if (!relativePath.startsWith('.')) {
      relativePath = './' + relativePath;
    }
    modified = true;
    totalReplacements++;
    return `${quote}${relativePath}${quote}`;
  });

  if (modified) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated: ${path.relative(srcRoot, file)}`);
  }
}

console.log(`\nDone! Total replacements: ${totalReplacements}`);
