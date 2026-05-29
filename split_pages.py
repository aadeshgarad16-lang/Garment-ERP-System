import os
import re

orders_path = r"c:\Users\USER\Downloads\Sason_Project\garment-erp-system\src\app\(dashboard)\orders\page.tsx"
stock_path = r"c:\Users\USER\Downloads\Sason_Project\garment-erp-system\src\app\(dashboard)\stock-calculation\page.tsx"
layout_path = r"c:\Users\USER\Downloads\Sason_Project\garment-erp-system\src\components\DashboardLayout.tsx"

os.makedirs(os.path.dirname(stock_path), exist_ok=True)

with open(orders_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the JSX chunks
jsx_match = re.search(r'(        \{\/\* Garment Specifications Card - Full Width Below \*\/\}.*?)(        \{\/\* Saved Orders Card \*\/\})', content, re.DOTALL)
if not jsx_match:
    print("JSX chunks not found")
    exit(1)

jsx_to_move = jsx_match.group(1)

# Remove the JSX chunks from orders/page.tsx
content = content.replace(jsx_to_move, "")

# Remove specs and draftSpecs state
content = re.sub(r'  const \[specs, setSpecs\] = useState<GarmentSpec\[\]>\(\[\n    \{ id: \'1\', sku: \'\', size: \'\', design: \'\', quantity: 0, stockAvailable: 0, useExistingStock: 0 \}\n  \]\);\n\n', '', content)
content = re.sub(r'  const \[draftSpecs, setDraftSpecs\] = useState<GarmentSpec\[\]>\(\[\]\);\n\n', '', content)

# Remove helper functions
helpers_pattern = r'  const addRow = \(\) => \{.*?\n  \};\n\n  const removeRow = \(id: string\) => \{.*?\n  \};\n\n  const updateRow = \(id: string, field: keyof GarmentSpec, value: string \| number\) => \{.*?\n  \};\n\n'
content = re.sub(helpers_pattern, '', content, flags=re.DOTALL)

# Remove calculated logic
logic_pattern = r'  const isValidRow = \(spec: GarmentSpec\) => \{.*?\n  \};\n\n  const isFormValid = specs\.every\(isValidRow\);\n  const totalQuantity = specs\.reduce\(\(sum, spec\) => sum \+ \(spec\.quantity \|\| 0\), 0\);\n  const totalStockUsed = specs\.reduce\(\(sum, spec\) => sum \+ \(spec\.useExistingStock \|\| 0\), 0\);\n  const totalProductionRequired = specs\.reduce\(\(sum, spec\) => sum \+ Math\.max\(0, \(spec\.quantity \|\| 0\) - \(spec\.useExistingStock \|\| 0\)\), 0\);\n  const partialFulfillmentPercentage = totalQuantity > 0 \? Math\.round\(\(totalStockUsed / totalQuantity\) \* 100\) : 0;\n\n'
content = re.sub(logic_pattern, '', content, flags=re.DOTALL)

# Remove specs from localStorage save
content = content.replace('        if (data.specs && data.specs.length > 0) setSpecs(data.specs);\n', '')
content = content.replace('        if (data.draftSpecs) setDraftSpecs(data.draftSpecs);\n', '')
content = content.replace('      specs,\n', '')
content = content.replace('      draftSpecs,\n', '')
content = content.replace('  }, [poInfo, specs, draftSpecs, paymentTerm, poAmount, advanceAmount]);', '  }, [poInfo, paymentTerm, poAmount, advanceAmount]);')

content = content.replace("    setSpecs([{ id: Math.random().toString(36).substring(7), sku: '', size: '', design: '', quantity: 0, stockAvailable: 0, useExistingStock: 0 }]);\n    setDraftSpecs([]);\n", "")

with open(orders_path, 'w', encoding='utf-8') as f:
    f.write(content)

# Write the new page
stock_page = """"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/language-context';
import {
  Package,
  Plus,
  Save,
  Trash2,
  FileText,
  CheckCircle2,
  Box,
  AlertCircle,
  Calculator
} from 'lucide-react';

interface GarmentSpec {
  id: string;
  sku: string;
  size: string;
  design: string;
  quantity: number;
  stockAvailable: number;
  useExistingStock: number;
}

export default function StockCalculationPage() {
  const router = useRouter();
  const { t } = useLanguage();
  
  const [specs, setSpecs] = useState<GarmentSpec[]>([
    { id: '1', sku: '', size: '', design: '', quantity: 0, stockAvailable: 0, useExistingStock: 0 }
  ]);
  const [draftSpecs, setDraftSpecs] = useState<GarmentSpec[]>([]);

  useEffect(() => {
    const draft = localStorage.getItem('orderInitiationDraft');
    if (draft) {
      try {
        const data = JSON.parse(draft);
        if (data.specs && data.specs.length > 0) setSpecs(data.specs);
        if (data.draftSpecs) setDraftSpecs(data.draftSpecs);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const draft = localStorage.getItem('orderInitiationDraft');
    let data: any = {};
    if (draft) {
      try { data = JSON.parse(draft); } catch(e) {}
    }
    data.specs = specs;
    data.draftSpecs = draftSpecs;
    localStorage.setItem('orderInitiationDraft', JSON.stringify(data));
  }, [specs, draftSpecs]);

  const addRow = () => {
    setSpecs([...specs, { id: Math.random().toString(36).substring(7), sku: '', size: '', design: '', quantity: 0, stockAvailable: 0, useExistingStock: 0 }]);
  };

  const removeRow = (id: string) => {
    if (specs.length > 1) {
      setSpecs(specs.filter(s => s.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof GarmentSpec, value: string | number) => {
    setSpecs(specs.map(s => {
      if (s.id === id) {
        return { ...s, [field]: value };
      }
      return s;
    }));
  };

  const isValidRow = (spec: GarmentSpec) => {
    return spec.useExistingStock <= spec.stockAvailable && spec.useExistingStock <= spec.quantity;
  };

  const isFormValid = specs.every(isValidRow);
  const totalQuantity = specs.reduce((sum, spec) => sum + (spec.quantity || 0), 0);
  const totalStockUsed = specs.reduce((sum, spec) => sum + (spec.useExistingStock || 0), 0);
  const totalProductionRequired = specs.reduce((sum, spec) => sum + Math.max(0, (spec.quantity || 0) - (spec.useExistingStock || 0)), 0);
  const partialFulfillmentPercentage = totalQuantity > 0 ? Math.round((totalStockUsed / totalQuantity) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <Package className="h-6 w-6 text-blue-600" />
          Stock Calculation
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Calculate garment requirements and allocate existing stock.
        </p>
      </div>
      
""" + jsx_to_move + """
    </div>
  );
}
"""

with open(stock_path, 'w', encoding='utf-8') as f:
    f.write(stock_page)

# Update DashboardLayout.tsx
with open(layout_path, 'r', encoding='utf-8') as f:
    layout = f.read()

layout = layout.replace("{ tKey: 'orderInitiation', href: '/orders', icon: ShoppingCart },", "{ tKey: 'orderInitiation', href: '/orders', icon: ShoppingCart },\n  { tKey: 'stockCalculation', href: '/stock-calculation', icon: Package },")
with open(layout_path, 'w', encoding='utf-8') as f:
    layout.write(layout)

print("Done")
