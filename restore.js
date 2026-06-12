const fs = require('fs');
const file = 'src/app/(dashboard)/order-specifications/page.tsx';
let content = fs.readFileSync(file, 'utf-8');

// 1. Interfaces
const detailedInterface = `interface GarmentSpec {
  id: string;
  address: string;
  clothType1: string;
  quantity: number;
  clothType2: string;
}`;

const correctInterfaces = `interface GarmentSpec {
  id: string;
  itemDescription: string;
  size: string;
  pattern: string;
  quantity: number;
  stockAvailable: number;
  unitPrice: number;
  photoName: string | null;
  productionType: "In House" | "Outsource";
}

interface DetailedSpec {
  id: string;
  address: string;
  clothType1: string;
  quantity: number;
  clothType2: string;
}`;

content = content.replace(detailedInterface, correctInterfaces);

// 2. State
const specsState = `  const [specs, setSpecs] = useState<GarmentSpec[]>([
    {
      id: "1",
      address: "",
      clothType1: "",
      quantity: 0,
      clothType2: "",
    },
    {
      id: "2",
      address: "",
      clothType1: "",
      quantity: 0,
      clothType2: "",
    },
    {
      id: "3",
      address: "",
      clothType1: "",
      quantity: 0,
      clothType2: "",
    },
  ]);`;

const correctState = `  const [specs, setSpecs] = useState<GarmentSpec[]>([
    {
      id: "1",
      itemDescription: "",
      size: "",
      pattern: "",
      quantity: 0,
      stockAvailable: 0,
      unitPrice: 0,
      photoName: null,
      productionType: "In House",
    },
  ]);

  const [detailedSpecs, setDetailedSpecs] = useState<DetailedSpec[]>([
    { id: "1", address: "", clothType1: "", quantity: 0, clothType2: "" },
    { id: "2", address: "", clothType1: "", quantity: 0, clothType2: "" },
    { id: "3", address: "", clothType1: "", quantity: 0, clothType2: "" },
  ]);`;

content = content.replace(specsState, correctState);

// 3. Add row and update logic
const addRowLogic = `  const addRow = () => {
    setSpecs((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        address: "",
        clothType1: "",
        quantity: 0,
        clothType2: "",
      },
    ]);
  };`;

const correctAddRow = `  const addRow = () => {
    setSpecs((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        itemDescription: "",
        size: "",
        pattern: "",
        quantity: 0,
        stockAvailable: 0,
        unitPrice: 0,
        photoName: null,
        productionType: "In House",
      },
    ]);
  };

  const addDetailedRow = () => {
    setDetailedSpecs((prev) => [
      ...prev,
      { id: crypto.randomUUID(), address: "", clothType1: "", quantity: 0, clothType2: "" }
    ]);
  };

  const updateDetailedRow = (id: string, field: keyof DetailedSpec, value: string | number) => {
    setDetailedSpecs((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };
  
  const removeDetailedRow = (id: string) => {
    if (detailedSpecs.length > 1) {
      setDetailedSpecs((prev) => prev.filter((s) => s.id !== id));
    }
  };`;

content = content.replace(addRowLogic, correctAddRow);

// 4. Validation
const invalidSpecsStr = `const invalidSpecs = specs.some(
      (s) => !s.clothType1.trim() || !s.quantity || s.quantity <= 0
    );`;

const correctInvalidSpecs = `const invalidSpecs = specs.some(
      (s) => !s.itemDescription.trim() || !s.quantity || s.quantity <= 0
    );`;

content = content.replace(invalidSpecsStr, correctInvalidSpecs);

// 5. The tables
// Since I swapped them earlier, the current order is: Delivery Address Configuration -> Destination Allocations Table -> Detailed Specifications Table
// I need to insert the Garment Specifications matrix before Delivery Address Configuration, leaving the rest.

const garmentMatrix = \`      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 overflow-hidden mb-6">
        <div className="border-b border-neutral-200 dark:border-slate-700 px-6 py-4 bg-neutral-50/50 dark:bg-slate-800/50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
            Garment Line Specifications
          </h2>
          <button
            type="button"
            onClick={addRow}
            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-100 transition font-medium"
          >
            <Plus className="h-4 w-4" /> Add Row
          </button>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-neutral-50 dark:bg-slate-800">
              <tr className="text-xs uppercase text-neutral-500 dark:text-neutral-400 font-semibold tracking-wider">
                <th className="px-4 py-3 border-b border-neutral-200 dark:border-slate-700">Item Description</th>
                <th className="px-4 py-3 border-b border-neutral-200 dark:border-slate-700">Size</th>
                <th className="px-4 py-3 border-b border-neutral-200 dark:border-slate-700">Pattern</th>
                <th className="px-4 py-3 border-b border-neutral-200 dark:border-slate-700">Quantity</th>
                <th className="px-4 py-3 border-b border-neutral-200 dark:border-slate-700">Available Qty</th>
                <th className="px-4 py-3 border-b border-neutral-200 dark:border-slate-700">Unit Price</th>
                <th className="px-4 py-3 border-b border-neutral-200 dark:border-slate-700">Upload Photo</th>
                <th className="px-4 py-3 border-b border-neutral-200 dark:border-slate-700 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-slate-700">
              {specs.map((spec) => (
                <tr key={spec.id} className="hover:bg-neutral-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={spec.itemDescription}
                      onChange={(e) => updateRow(spec.id, "itemDescription", e.target.value)}
                      className={inputStyle}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={spec.size}
                      onChange={(e) => updateRow(spec.id, "size", e.target.value)}
                      className={inputStyle}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={spec.pattern}
                      onChange={(e) => updateRow(spec.id, "pattern", e.target.value)}
                      className={inputStyle}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={spec.quantity || ""}
                      onChange={(e) => updateRow(spec.id, "quantity", Number(e.target.value))}
                      className={inputStyle}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={spec.stockAvailable || ""}
                      onChange={(e) => updateRow(spec.id, "stockAvailable", Number(e.target.value))}
                      placeholder="Available"
                      className={inputStyle}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={spec.unitPrice || ""}
                      onChange={(e) => updateRow(spec.id, "unitPrice", Number(e.target.value))}
                      className={inputStyle}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <label className="cursor-pointer inline-flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition whitespace-nowrap max-w-[140px]">
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      <span className="truncate">{spec.photoName || "Select Photo"}</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => updateRow(spec.id, "photoName", e.target.files?.[0]?.name || "")}
                      />
                    </label>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <select
                        value={spec.productionType || "In House"}
                        onChange={(e) => updateRow(spec.id, "productionType", e.target.value)}
                        className="px-2.5 py-1.5 text-xs font-medium border rounded-md bg-white dark:bg-slate-800 border-neutral-300 dark:border-slate-600 text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
                      >
                        <option value="In House">In House</option>
                        <option value="Outsource">Outsource</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeRow(spec.id)}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Remove Row"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>\n\n\`;

const condDeliveryIndex = content.indexOf('{/* CONDITIONAL DELIVERY ADDRESS CONFIGURATION */}');
if (condDeliveryIndex !== -1) {
  content = content.slice(0, condDeliveryIndex) + garmentMatrix + content.slice(condDeliveryIndex);
}

// Ensure the Detailed specs table maps over detailedSpecs instead of specs
const detailedSpecTableStart = '<div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 overflow-hidden">';
// wait, the Detailed spec table might have been replaced already. Let's do string replacement for the detailed spec table internals.
content = content.replace('onClick={addRow}\\n            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-100 transition font-medium"\\n          >\\n            <Plus className="h-4 w-4" /> Add Row\\n          </button>\\n        </div>\\n\\n        <div className="w-full overflow-x-auto">\\n          <table className="w-full text-left border-collapse min-w-[800px]">\\n            <thead className="bg-neutral-50 dark:bg-slate-800">\\n              <tr className="text-xs uppercase text-neutral-500 dark:text-neutral-400 font-semibold tracking-wider">\\n                <th className="px-6 py-4 border-b border-neutral-200 dark:border-slate-700 w-24">Item Number</th>', 'onClick={addDetailedRow}\\n            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-100 transition font-medium"\\n          >\\n            <Plus className="h-4 w-4" /> Add Row\\n          </button>\\n        </div>\\n\\n        <div className="w-full overflow-x-auto">\\n          <table className="w-full text-left border-collapse min-w-[800px]">\\n            <thead className="bg-neutral-50 dark:bg-slate-800">\\n              <tr className="text-xs uppercase text-neutral-500 dark:text-neutral-400 font-semibold tracking-wider">\\n                <th className="px-6 py-4 border-b border-neutral-200 dark:border-slate-700 w-24">Item Number</th>');

content = content.replace('{specs.map((spec, index) => (', '{detailedSpecs.map((spec, index) => (');

// replace updateRow to updateDetailedRow for the DetailedSpecs block
const block1 = '<td className="px-6 py-4 font-medium text-neutral-900 dark:text-neutral-100">';
const detailedBlockStartIdx = content.indexOf('Detailed Specifications');
if (detailedBlockStartIdx !== -1) {
  let detailedBlockStr = content.slice(detailedBlockStartIdx);
  detailedBlockStr = detailedBlockStr.replace(/updateRow\(/g, 'updateDetailedRow(');
  detailedBlockStr = detailedBlockStr.replace(/removeRow\(/g, 'removeDetailedRow(');
  content = content.slice(0, detailedBlockStartIdx) + detailedBlockStr;
}

fs.writeFileSync(file, content, 'utf-8');
console.log("Restored Garment Specs and isolated Detailed Specs");
