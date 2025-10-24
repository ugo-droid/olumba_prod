// scripts/check-file-conflicts.js
// Prevents future file conflicts in API directory

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findConflicts(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  const basenames = {};
  const conflicts = [];

  files.forEach(file => {
    if (file.isDirectory()) {
      const subConflicts = findConflicts(path.join(dir, file.name));
      conflicts.push(...subConflicts);
    } else {
      const basename = file.name.replace(/\.[^.]+$/, '');
      const fullPath = path.join(dir, file.name);
      
      if (basenames[basename]) {
        conflicts.push({
          file1: basenames[basename],
          file2: fullPath
        });
      } else {
        basenames[basename] = fullPath;
      }
    }
  });

  return conflicts;
}

console.log('🔍 Checking for file conflicts in API directory...');

const conflicts = findConflicts('api');

if (conflicts.length > 0) {
  console.error('❌ File conflicts found:');
  conflicts.forEach(c => {
    console.error(`  - ${c.file1} conflicts with ${c.file2}`);
  });
  console.error('\n💡 Fix by removing one of the conflicting files.');
  process.exit(1);
} else {
  console.log('✅ No file conflicts found');
  console.log('✅ All API files have unique names');
}
