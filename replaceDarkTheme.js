const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  { regex: /dark:bg-slate-950/g, replacement: 'dark:bg-neutral-900' },
  { regex: /dark:bg-slate-900/g, replacement: 'dark:bg-neutral-800' },
  { regex: /dark:bg-slate-800/g, replacement: 'dark:bg-neutral-800' },
  { regex: /dark:bg-slate-700/g, replacement: 'dark:bg-neutral-700' },
  { regex: /dark:bg-blue-950/g, replacement: 'dark:bg-neutral-900' },
  { regex: /dark:bg-blue-900/g, replacement: 'dark:bg-neutral-800' },
  { regex: /dark:bg-blue-[0-9]+\/50/g, replacement: 'dark:bg-neutral-800/50' }, // For cases like dark:bg-blue-900/50
  { regex: /dark:border-slate-800/g, replacement: 'dark:border-neutral-700' },
  { regex: /dark:border-slate-700/g, replacement: 'dark:border-neutral-700' },
  { regex: /dark:border-slate-600/g, replacement: 'dark:border-neutral-600' },
  { regex: /dark:text-slate-400/g, replacement: 'dark:text-neutral-400' },
  { regex: /dark:text-slate-300/g, replacement: 'dark:text-neutral-300' },
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const rule of replacements) {
        content = content.replace(rule.regex, rule.replacement);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

console.log('Starting dark theme replacement...');
processDirectory(srcDir);
console.log('Replacement complete.');
