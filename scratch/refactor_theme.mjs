import fs from 'fs';
import path from 'path';

const searchDir = 'c:/Users/USER/Pictures/Garment__WEB/Sasons_Clone1/clone1/Garment-ERP-System/src/app';

const replacements = [
  // Backgrounds
  { regex: /bg-white dark:bg-slate-900/g, replacement: 'bg-card' },
  { regex: /bg-slate-50 dark:bg-slate-800\/50/g, replacement: 'bg-muted' },
  { regex: /bg-slate-50 dark:bg-slate-800/g, replacement: 'bg-muted' },
  { regex: /bg-indigo-50 dark:bg-indigo-900\/20/g, replacement: 'bg-primary/10' },
  { regex: /bg-indigo-600 hover:bg-indigo-700/g, replacement: 'bg-primary hover:bg-primary/90' },
  
  // Borders
  { regex: /border-neutral-200 dark:border-slate-700/g, replacement: 'border-border' },
  { regex: /border-neutral-100 dark:border-slate-800/g, replacement: 'border-border' },
  { regex: /border-gray-200 dark:border-slate-700/g, replacement: 'border-border' },
  { regex: /border-gray-100 dark:border-slate-800/g, replacement: 'border-border' },
  { regex: /border-slate-200 dark:border-slate-700/g, replacement: 'border-border' },

  // Text Colors
  { regex: /text-slate-900 dark:text-slate-100/g, replacement: 'text-foreground' },
  { regex: /text-slate-900 dark:text-white/g, replacement: 'text-foreground' },
  { regex: /text-neutral-900 dark:text-neutral-100/g, replacement: 'text-foreground' },
  { regex: /text-gray-900 dark:text-white/g, replacement: 'text-foreground' },
  
  { regex: /text-slate-500 dark:text-slate-400/g, replacement: 'text-muted-foreground' },
  { regex: /text-neutral-500 dark:text-neutral-400/g, replacement: 'text-muted-foreground' },
  { regex: /text-gray-500 dark:text-gray-400/g, replacement: 'text-muted-foreground' },
  
  { regex: /text-indigo-600 dark:text-indigo-400/g, replacement: 'text-primary' },
  { regex: /text-indigo-600/g, replacement: 'text-primary' },
  
  // Focus Rings
  { regex: /focus:ring-indigo-500/g, replacement: 'focus:ring-ring' },
  { regex: /focus:border-indigo-500/g, replacement: 'focus:border-primary' }
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  for (const { regex, replacement } of replacements) {
    content = content.replace(regex, replacement);
  }

  // Inject transition-all duration-200 ease-in-out for buttons if they don't have it
  // This is a bit tricky with regex, but we can look for basic class boundaries
  // For safety, we'll rely on the global CSS for form inputs, but we can add transitions where appropriate
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function traverseDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      traverseDir(fullPath);
    } else if (stat.isFile() && (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts'))) {
      processFile(fullPath);
    }
  }
}

console.log('Starting global CSS token migration...');
traverseDir(searchDir);
console.log('Migration complete.');
