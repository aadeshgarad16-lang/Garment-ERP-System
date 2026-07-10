const fs = require('fs');
const path = require('path');

const baseDir = 'c:/Users/USER/Pictures/Garment__WEB/Sasons_Clone1/clone1/Garment-ERP-System/src/app/(dashboard)';

const moduleMap = {
  'orders': 'Order Initiation',
  'order-specifications': 'Specifications',
  'textile-specifications': 'Specifications',
  'stock-calculation': 'Stock Check',
  'bom-calculation': 'BOM Calculation',
  'inventory': 'Inventory Check',
  'material-allocation': 'Material Allocation',
  'material-release': 'Material Allocation',
  'out-source': 'Out Source',
  'procurement': 'Procurement',
  'production': 'Production',
  'quality-packing': 'Quality & Packing',
  'logistics': 'Logistics',
  'accounts': 'Accounts',
  'store': 'Store',
  'reports': 'Reports',
  'logs': 'System Logs',
  'dashboard': 'Dashboard'
};

function processFile(filePath, moduleName) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Add imports if missing
  if (!content.includes('usePermission')) {
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfLastImport = content.indexOf('\\n', lastImportIndex);
      content = content.slice(0, endOfLastImport + 1) + 
        'import { usePermission } from "@/hooks/usePermission";\\nimport { PermissionGuard } from "@/components/PermissionGuard";\\n' + 
        content.slice(endOfLastImport + 1);
    } else {
        content = 'import { usePermission } from "@/hooks/usePermission";\\nimport { PermissionGuard } from "@/components/PermissionGuard";\\n' + content;
    }
  }

  // 2. Add hook if missing
  if (!content.includes('const { isReadOnly } = usePermission')) {
    const functionMatch = content.match(/export default function\\s+\\w+\\s*\\([^)]*\\)\\s*\\{/);
    if (functionMatch) {
      const matchLength = functionMatch[0].length;
      const index = functionMatch.index + matchLength;
      content = content.slice(0, index) +
        '\\n  const { isReadOnly } = usePermission("' + moduleName + '");\\n' +
        content.slice(index);
    } else {
        const fallbackMatch = content.match(/function\\s+\\w+\\s*\\([^)]*\\)\\s*\\{/);
        if (fallbackMatch) {
            const matchLength = fallbackMatch[0].length;
            const index = fallbackMatch.index + matchLength;
            content = content.slice(0, index) +
                '\\n  const { isReadOnly } = usePermission("' + moduleName + '");\\n' +
                content.slice(index);
        }
    }
  }

  // 3. Disable inputs, selects, textareas, buttons
  const tagsToDisable = ['input', 'select', 'textarea', 'button'];
  for (const tag of tagsToDisable) {
    const regex = new RegExp('<' + tag + '(\\\\s[^>]*?)?>', 'g');
    content = content.replace(regex, (match, attributes) => {
        if (!attributes) return '<' + tag + ' disabled={isReadOnly}>';
        if (attributes.includes('type="hidden"')) return match;
        
        if (attributes.includes('disabled={')) {
            return match.replace(/disabled=\\{([^}]+)\\}/, 'disabled={$1 || isReadOnly}');
        } else if (attributes.includes(' disabled ')) {
            return match; // already natively disabled without brackets
        }
        return '<' + tag + ' disabled={isReadOnly}' + attributes + '>';
    });
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated: ' + filePath);
  }
}

function traverseAndProcess(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      traverseAndProcess(fullPath);
    } else if (item === 'page.tsx') {
      const relativePath = path.relative(baseDir, fullPath);
      const rootDir = relativePath.split(path.sep)[0];
      const moduleName = moduleMap[rootDir];
      if (moduleName && rootDir !== 'add-user' && rootDir !== 'order-list' && rootDir !== 'dashboard') {
        try {
            processFile(fullPath, moduleName);
        } catch (e) {
            console.error('Failed to process ' + fullPath + ':', e);
        }
      }
    }
  }
}

traverseAndProcess(baseDir);
console.log('Script execution completed.');
