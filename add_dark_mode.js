const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.join(__dirname, 'src', 'app'),
  path.join(__dirname, 'src', 'components')
];

const classMap = {
  'bg-white': 'bg-white dark:bg-slate-900',
  'bg-neutral-50/50': 'bg-neutral-50/50 dark:bg-slate-900/50',
  'bg-neutral-50': 'bg-neutral-50 dark:bg-slate-900',
  'bg-neutral-100': 'bg-neutral-100 dark:bg-slate-800',
  'border-neutral-100': 'border-neutral-100 dark:border-slate-800',
  'border-neutral-200': 'border-neutral-200 dark:border-slate-700',
  'border-neutral-300': 'border-neutral-300 dark:border-slate-600',
  'text-neutral-900': 'text-neutral-900 dark:text-neutral-100',
  'text-neutral-800': 'text-neutral-800 dark:text-neutral-200',
  'text-neutral-700': 'text-neutral-700 dark:text-neutral-300',
  'text-neutral-600': 'text-neutral-600 dark:text-neutral-400',
  'text-neutral-500': 'text-neutral-500 dark:text-neutral-400',
  'text-blue-900': 'text-blue-900 dark:text-blue-100',
  'text-blue-800': 'text-blue-800 dark:text-blue-200',
  'divide-neutral-100': 'divide-neutral-100 dark:divide-slate-800',
  'divide-neutral-200': 'divide-neutral-200 dark:divide-slate-700',
  'hover:bg-neutral-50': 'hover:bg-neutral-50 dark:hover:bg-slate-800',
  'hover:bg-neutral-100': 'hover:bg-neutral-100 dark:hover:bg-slate-700',
  'hover:bg-neutral-50/50': 'hover:bg-neutral-50/50 dark:hover:bg-slate-800/50'
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // We want to replace these classes only if they are not already followed by a dark: class.
  // We use regex with word boundaries.
  for (const [lightClass, replacement] of Object.entries(classMap)) {
    // Regex: match the lightClass, but ensure it's not part of another class (like text-neutral-900/50)
    // and that the replacement is not already present.
    // To be safe, we just match the exact class string surrounded by quotes, spaces or backticks.
    const regex = new RegExp(`(?<=['"\\\`\\s])(${lightClass.replace(/\//g, '\\\\/')})(?=['"\\\`\\s])`, 'g');
    
    content = content.replace(regex, (match) => {
      // Check if the surrounding string already has the dark version.
      // This is a naive check but works for most cases since we just replace exactly.
      return replacement;
    });
  }

  // De-duplicate if already applied
  for (const [lightClass, replacement] of Object.entries(classMap)) {
    const doubleDark = replacement + ' dark:' + replacement.split('dark:')[1];
    content = content.replace(new RegExp(doubleDark.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

targetDirs.forEach(walkDir);
console.log('Done!');
