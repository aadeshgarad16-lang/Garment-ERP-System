import re

with open('c:/Users/USER/Pictures/Garment__WEB/Sasons_Clone1/clone1/Garment-ERP-System/src/app/(dashboard)/quality-packing/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix states
text = re.sub(
    r'  const \[currentOrder, setCurrentOrder\] = useState<any>\(null\);\n  const \[showPendingPanel, setShowPendingPanel\] = useState\(false\);\n  const \[pendingOrders, setPendingOrders\] = useState<any\[\]>\(\[\]\);\n  const \[isProcessing, setIsProcessing\] = useState\(false\);\n  const \[poNumber, setPoNumber\] = useState<string>\(\'\'\);\n  const \[pendingOrders, setPendingOrders\] = useState<any\[\]>\(\[\]\);',
    r'''  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [poNumber, setPoNumber] = useState<string>('');
  const [showPendingPanel, setShowPendingPanel] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);''',
    text
)

# Remove the old loadPendingOrders
text = re.sub(
    r'  const loadPendingOrders = \(\) => \{.*?  const loadPendingOrders = async \(\) => \{',
    r'  const loadPendingOrders = async () => {',
    text,
    flags=re.DOTALL
)

with open('c:/Users/USER/Pictures/Garment__WEB/Sasons_Clone1/clone1/Garment-ERP-System/src/app/(dashboard)/quality-packing/page.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
