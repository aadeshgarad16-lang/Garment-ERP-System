const fs = require('fs');

const files = [
  'src/app/(dashboard)/out-source/complete/page.tsx',
  'src/app/(dashboard)/out-source/Outsource-Service/page.tsx'
];

const replacements = [
  { search: /bg-white/g, replace: 'bg-white dark:bg-[#121212]' },
  { search: /text-slate-900/g, replace: 'text-slate-900 dark:text-white' },
  { search: /text-slate-800/g, replace: 'text-slate-800 dark:text-slate-100' },
  { search: /text-slate-700/g, replace: 'text-slate-700 dark:text-slate-200' },
  { search: /text-slate-600/g, replace: 'text-slate-600 dark:text-slate-300' },
  { search: /text-slate-500/g, replace: 'text-slate-500 dark:text-slate-400' },
  { search: /text-slate-400/g, replace: 'text-slate-400 dark:text-slate-500' },
  { search: /bg-slate-50\/50/g, replace: 'bg-slate-50/50 dark:bg-[#1a1a1a]' },
  { search: /bg-slate-50/g, replace: 'bg-slate-50 dark:bg-[#18181b]' },
  { search: /bg-slate-100/g, replace: 'bg-slate-100 dark:bg-[#202020]' },
  { search: /border-slate-200/g, replace: 'border-slate-200 dark:border-neutral-800' },
  { search: /border-slate-100/g, replace: 'border-slate-100 dark:border-neutral-800' },
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  // First clean up any accidental double darks if they exist
  for (const r of replacements) {
    content = content.replace(r.search, r.replace);
  }
  
  // Cleanup duplicates that might have occurred if a class already had dark:
  content = content.replace(/dark:bg-\[\#121212\]\s*dark:bg-\[\#121212\]/g, 'dark:bg-[#121212]');
  content = content.replace(/dark:text-white\s*dark:text-white/g, 'dark:text-white');
  content = content.replace(/dark:text-slate-100\s*dark:text-slate-100/g, 'dark:text-slate-100');
  content = content.replace(/dark:text-slate-200\s*dark:text-slate-200/g, 'dark:text-slate-200');
  content = content.replace(/dark:text-slate-300\s*dark:text-slate-300/g, 'dark:text-slate-300');
  content = content.replace(/dark:text-slate-400\s*dark:text-slate-400/g, 'dark:text-slate-400');
  content = content.replace(/dark:text-slate-500\s*dark:text-slate-500/g, 'dark:text-slate-500');
  content = content.replace(/dark:border-neutral-800\s*dark:border-neutral-800/g, 'dark:border-neutral-800');
  content = content.replace(/dark:bg-\[\#1a1a1a\]\s*dark:bg-\[\#1a1a1a\]/g, 'dark:bg-[#1a1a1a]');
  content = content.replace(/dark:bg-\[\#18181b\]\s*dark:bg-\[\#18181b\]/g, 'dark:bg-[#18181b]');
  content = content.replace(/dark:bg-\[\#202020\]\s*dark:bg-\[\#202020\]/g, 'dark:bg-[#202020]');
  
  fs.writeFileSync(file, content, 'utf8');
  console.log(`Updated ${file}`);
}
