const fs = require('fs');

const filePath = 'c:/Users/USER/Pictures/Garment__WEB/Sasons_Clone1/clone1/Garment-ERP-System/src/app/(dashboard)/store/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');
let original = content;

// Add imports
if (!content.includes('usePermission')) {
  const lastImport = content.lastIndexOf('import ');
  if (lastImport !== -1) {
    const end = content.indexOf('\n', lastImport);
    content = content.slice(0, end + 1) + 
      'import { usePermission } from "@/hooks/usePermission";\nimport { PermissionGuard } from "@/components/PermissionGuard";\n' + 
      content.slice(end + 1);
  } else {
    content = 'import { usePermission } from "@/hooks/usePermission";\nimport { PermissionGuard } from "@/components/PermissionGuard";\n' + content;
  }
}

// Add hook inside component
const funcMatch = content.match(/export default function\s+(\w+)\s*\([^)]*\)\s*\{/);
if (funcMatch) {
  const insertIdx = funcMatch.index + funcMatch[0].length;
  if (!content.includes('const { isReadOnly } = usePermission')) {
    content = content.slice(0, insertIdx) +
      '\n  const { isReadOnly } = usePermission("Store");\n' +
      content.slice(insertIdx);
  }
} else {
    console.error("Could not find export default function");
}

// Safely modify inputs
// Look for tags and capture their attributes
const tagRegex = /<(input|select|textarea|button)(?:\s+([^>]*?))?(\/?)>/g;

content = content.replace(tagRegex, (match, tag, attrs, selfClosing) => {
  attrs = attrs || '';
  if (attrs.includes('type="hidden"')) return match;
  
  if (attrs.includes('disabled={')) {
    // If it has disabled={something}, append || isReadOnly
    attrs = attrs.replace(/disabled=\{([^}]+)\}/, (m, inner) => \`disabled={\${inner} || isReadOnly}\`);
  } else if (!attrs.includes(' disabled ')) {
    // Doesn't have disabled, add it
    attrs = 'disabled={isReadOnly} ' + attrs;
  }
  
  return \`<\${tag} \${attrs.trim()}\${selfClosing ? ' /' : ''}>\`;
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done testing store/page.tsx');
