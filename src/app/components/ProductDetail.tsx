import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Store, Package, Tag, Layers, Palette, Ruler, CheckCircle2, XCircle, FilePlus } from 'lucide-react';
import { useState } from 'react';
import { Garment } from './garmentsData';
import { useGarments } from '../context/GarmentsContext';
import { useTranslation } from 'react-i18next';


// ── Kids age tiers (used for all Kids-demographic items) ─────────────────────
const KIDS_AGE_TIERS = ['6M-1Y', '1Y-1.5Y', '1.5Y-2Y', '2Y-3Y', '3Y-4Y', '4Y-5Y'];

// ── Per-size stock map keyed by SKU ──────────────────────────────────────────
// stock > 0 = available, 0 = out of stock for that size
const SIZE_STOCK: Record<string, Record<string, number>> = {
  // Men
  '#TS110': { S: 12, M: 20, L: 10, XL: 42, XXL: 0 },
  '#FS422': { S: 0,  M: 1,  L: 3,  XL: 2,  XXL: 0 },
  '#DJ205': { S: 4,  M: 6,  L: 2,  XL: 0,  XXL: 0 },
  '#MC501': { '28': 8, '30': 15, '32': 5, '34': 0, '36': 3 },
  '#MC502': { '28': 0, '30': 0, '32': 12, '34': 0, '36': 0 },
  '#MT902': { '28': 0, '30': 0, '32': 0, '34': 0, '36': 0, '38': 0 },
  '#MT903': { '28': 0, '30': 0, '32': 0, '34': 0, '36': 0, '38': 0 },
  '#MB704': { S: 2,  M: 8,  L: 3,  XL: 0 },
  '#HS810': { XS: 0, S: 0, M: 0, L: 8, XL: 0, XXL: 0 },

  // Women
  '#SS150': { 'Free Size': 0 },
  '#WJ303': { '24': 5, '26': 8, '28': 18, '30': 4, '32': 0 },
  '#SD412': { XS: 1,  S: 4,  M: 0,  L: 0 },
  '#CK102': { XS: 7,  S: 10, M: 25, L: 8,  XL: 3 },
  '#HS809': { XS: 5,  S: 8,  M: 15, L: 7,  XL: 4, XXL: 0 },
  '#DS505': { '24': 3, '26': 7, '28': 2, '30': 0, '32': 0 },

  // Kids — keyed by age tier
  '#S0340': { '6M-1Y': 5,  '1Y-1.5Y': 8,  '1.5Y-2Y': 3, '2Y-3Y': 14, '3Y-4Y': 0, '4Y-5Y': 0 },
  '#KO109': { '6M-1Y': 0,  '1Y-1.5Y': 1,  '1.5Y-2Y': 5, '2Y-3Y': 0,  '3Y-4Y': 4, '4Y-5Y': 0 },
  '#KT221': { '6M-1Y': 10, '1Y-1.5Y': 12, '1.5Y-2Y': 8, '2Y-3Y': 5,  '3Y-4Y': 30, '4Y-5Y': 6 },
};

// ── Extra spec data keyed by SKU ─────────────────────────────────────────────
interface SpecEntry {
  material: string;
  colorsAvailable: string[];
  sizesAvailable: string[];
  description: string;
}

const EXTRA_SPECS: Record<string, SpecEntry> = {
  '#TS110': {
    material: 'Premium 100% Combed Cotton (180 GSM)',
    colorsAvailable: ['Charcoal Grey', 'White', 'Navy Blue', 'Olive Green'],
    sizesAvailable: ['S', 'M', 'L', 'XL', 'XXL'],
    description: 'A relaxed-fit everyday T-shirt crafted from soft combed cotton with reinforced stitching at the shoulders and hem.',
  },
  '#FS422': {
    material: 'Egyptian Cotton Poplin (100 TC)',
    colorsAvailable: ['White', 'Sky Blue', 'Light Grey', 'Pale Yellow'],
    sizesAvailable: ['S', 'M', 'L', 'XL', 'XXL'],
    description: 'A crisp formal shirt tailored for a slim silhouette. Features a spread collar, single-button cuffs, and mother-of-pearl buttons.',
  },
  '#DJ205': {
    material: '100% Selvedge Denim (12 oz)',
    colorsAvailable: ['Jet Black', 'Raw Indigo', 'Washed Blue'],
    sizesAvailable: ['S', 'M', 'L', 'XL', 'XXL'],
    description: 'A structured denim jacket with a vintage silhouette, chest pockets, and brass button closures. Built to last.',
  },
  '#MC501': {
    material: 'Premium Cotton-Twill Blend (98% Cotton / 2% Elastane)',
    colorsAvailable: ['Khaki', 'Olive', 'Stone', 'Sand'],
    sizesAvailable: ['28', '30', '32', '34', '36'],
    description: 'Slim-fit chinos offering a tailored look with just enough stretch for all-day comfort. Perfect for smart-casual settings.',
  },
  '#MC502': {
    material: 'Premium Cotton Blend (Alternative Edition)',
    colorsAvailable: ['Rust/Salmon Pink'],
    sizesAvailable: ['28', '30', '32', '34', '36'],
    description: 'A stylish alternative edition of our slim-fit chinos, featuring a unique rust/salmon pink colorway.',
  },
  '#MT902': {
    material: 'Wool-Polyester Blend (55% Wool / 45% Polyester)',
    colorsAvailable: ['Charcoal', 'Midnight Black', 'Dark Navy'],
    sizesAvailable: ['28', '30', '32', '34', '36', '38'],
    description: 'Flat-front formal trousers with a clean drape and pressed crease, designed for boardroom-ready style.',
  },
  '#MT903': {
    material: 'Premium Wool Blend',
    colorsAvailable: ['Khaki/Beige'],
    sizesAvailable: ['28', '30', '32', '34', '36', '38'],
    description: 'Alternative formal trousers in a crisp khaki/beige tone, perfect for professional and semi-formal wear.',
  },
  '#MB704': {
    material: 'Tweed Wool Blend with Satin Lining',
    colorsAvailable: ['Navy Blue', 'Charcoal Grey', 'Midnight Black'],
    sizesAvailable: ['S', 'M', 'L', 'XL'],
    description: 'A single-breasted party blazer with notch lapels, a two-button closure, and a structured shoulder for a commanding presence.',
  },
  '#SS150': {
    material: 'Pure Banarasi Raw Silk (Handwoven)',
    colorsAvailable: ['Crimson Red', 'Royal Purple', 'Gold', 'Teal'],
    sizesAvailable: ['Free Size'],
    description: 'An exquisite handwoven silk saree with zari border work, ideal for weddings and grand festive occasions.',
  },
  '#WJ303': {
    material: 'Stretch Denim (92% Cotton / 8% Spandex)',
    colorsAvailable: ['Classic Blue', 'Dark Wash', 'Light Grey'],
    sizesAvailable: ['24', '26', '28', '30', '32'],
    description: 'High-waisted slim-fit jeans that contour to the body with lasting shape retention and four-way stretch comfort.',
  },
  '#SD412': {
    material: '100% Lightweight Cotton Voile',
    colorsAvailable: ['Sunshine Yellow', 'Coral Pink', 'Mint Green', 'White'],
    sizesAvailable: ['XS', 'S', 'M', 'L'],
    description: 'A breezy, flowy sundress with an empire waist, adjustable straps, and a relaxed skirt — perfect for warm days.',
  },
  '#CK102': {
    material: 'Handloom Cotton (60s count)',
    colorsAvailable: ['Indigo Blue', 'Earthy Beige', 'Emerald Green', 'Off White'],
    sizesAvailable: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'A classic straight-cut kurta with intricate block-print detailing, side slits, and three-quarter sleeves.',
  },
  '#HS809': {
    material: 'Heavyweight Fleece Blend (80% Cotton / 20% Polyester)',
    colorsAvailable: ['Jet Black', 'Charcoal', 'Dusty Rose', 'Cream'],
    sizesAvailable: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    description: 'A cozy pullover hoodie with a kangaroo pocket, adjustable drawstring hood, and brushed fleece interior for warmth.',
  },
  '#HS810': {
    material: 'Premium Cotton Blend',
    colorsAvailable: ['Black'],
    sizesAvailable: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    description: 'A premium black hooded sweatshirt offering unmatched comfort and a sleek, versatile look.',
  },
  '#DS505': {
    material: '100% Distressed Denim (10 oz)',
    colorsAvailable: ['Light Blue', 'Medium Wash', 'Raw White'],
    sizesAvailable: ['24', '26', '28', '30', '32'],
    description: 'Trendy high-rise denim shorts with intentional fraying, faded washes, and a relaxed-through-thigh fit.',
  },
  '#S0340': {
    material: 'Soft Cotton-Polyester Blend (60/40)',
    colorsAvailable: ['Pink', 'Lilac', 'Sky Blue', 'Peach'],
    sizesAvailable: KIDS_AGE_TIERS,
    description: 'A sweet polka-dot dress with a ruffled hem, smocked waist, and bow back tie — great for special occasions.',
  },
  '#KO109': {
    material: 'Soft Stretch Denim (95% Cotton / 5% Elastane)',
    colorsAvailable: ['Classic Denim', 'Light Wash', 'Dark Wash'],
    sizesAvailable: KIDS_AGE_TIERS,
    description: 'Durable bib overalls with adjustable shoulder straps, bib pockets, and a roomy fit ideal for active play.',
  },
  '#KT221': {
    material: '100% Organic Ring-Spun Cotton (160 GSM)',
    colorsAvailable: ['Red', 'Blue', 'Yellow', 'White'],
    sizesAvailable: KIDS_AGE_TIERS,
    description: 'A fun, vibrant cartoon-print T-shirt with soft-touch fabric, tagless collar, and a durable screen-print graphic.',
  },
};

// ── StatusBadge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Garment['status'] }) {
  const { t } = useTranslation();
  const map: Record<string, string> = {
    'In Stock':  'bg-emerald-100 text-emerald-700 border border-emerald-200',
    'Low Stock': 'bg-amber-100 text-amber-700 border border-amber-200',
    'Out of Stock':  'bg-red-100 text-red-700 border border-red-200',
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === 'In Stock' ? 'bg-emerald-500' : status === 'Low Stock' ? 'bg-amber-500' : 'bg-red-500'
      }`} />
      {t(status)}
    </span>
  );
}

// ── Interactive Size Selector ────────────────────────────────────────────────
function SizeSelector({
  sizes,
  stockMap,
  isKids,
  selected,
  setSelected,
}: {
  sizes: string[];
  stockMap: Record<string, number>;
  isKids: boolean;
  selected: string | null;
  setSelected: (s: string) => void;
}) {
  const { t } = useTranslation();
  const selectedStock = selected !== null ? (stockMap[selected] ?? 0) : null;
  const isAvailable = selectedStock !== null && selectedStock > 0;

  return (
    <div>
      {/* Size grid */}
      <div className="flex flex-wrap gap-2 mb-3">
        {sizes.map((s) => {
          const stock = stockMap[s] ?? 0;
          const soldOut = stock === 0;
          const isActive = selected === s;

          return (
            <button
              key={s}
              type="button"
              onClick={() => setSelected(s)}
              className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all duration-150 relative ${
                isActive
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md scale-105'
                  : soldOut
                  ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 line-through'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {s}
              {/* Tiny sold-out dot indicator */}
              {soldOut && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Availability feedback */}
      {selected !== null && (
        <div className={`flex items-center gap-2 text-sm font-semibold rounded-lg px-3 py-2 border ${
          isAvailable
            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
            : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50'
        }`}>
          {isAvailable ? (
            <>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>✓ Available — In Stock ({selectedStock} unit{selectedStock !== 1 ? 's' : ''} remaining)</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 shrink-0" />
              <span>✕ Unavailable — This size is out of stock</span>
            </>
          )}
        </div>
      )}

      {/* Helper hint when nothing selected */}
      {selected === null && (
        <p className="text-xs text-slate-400 italic">
          {t('Select a size above to check availability.')}
        </p>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2.5 text-[10px] text-slate-400 font-medium">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-slate-900 inline-block" /> {t('Selected')}</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-white border border-slate-200 inline-block" /> {t('Available')}</span>
        <span className="flex items-center gap-1 line-through"><span className="w-2.5 h-2.5 rounded-sm bg-slate-100 inline-block" /> {t('Out of Stock')}</span>
      </div>
    </div>
  );
}

// ── Interactive Color Selector ───────────────────────────────────────────────
function ColorSelector({
  colors,
  selected,
  setSelected,
}: {
  colors: string[];
  selected: string | null;
  setSelected: (c: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {colors.map((c) => {
          const isActive = selected === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setSelected(c)}
              className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all duration-150 ${
                isActive
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md scale-105'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {t(c)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export function ProductDetail() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();

  const { garments } = useGarments();

  const product: Garment | undefined = garments.find((g) => String(g.id) === id);

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center font-sans">
        <div className="text-center">
          <Store className="w-14 h-14 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <p className="text-xl font-bold text-slate-700 dark:text-slate-200">Product not found</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 mb-6">No garment matches ID: {id}</p>
          <button
            onClick={() => navigate('/ready-made')}
            className="px-5 py-2 bg-[#1766e6] hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors"
          >
            Back to Store
          </button>
        </div>
      </div>
    );
  }

  const specs = EXTRA_SPECS[product.sku];
  const stockMap = SIZE_STOCK[product.sku] ?? {};
  const isKids = product.demographic === 'Kids';
  const displaySizes = isKids ? KIDS_AGE_TIERS : (specs?.sizesAvailable ?? []);
  const displayColors = specs?.colorsAvailable ?? [product.color];

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(displayColors.length === 1 ? displayColors[0] : null);

  const handleCreatePO = () => {
    if (!selectedSize) {
      alert("Please select a size first.");
      return;
    }
    if (!selectedColor) {
      alert("Please select a color first.");
      return;
    }
    navigate('/create-purchase-order', {
      state: {
        garment: product,
        size: selectedSize,
        color: selectedColor
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-16 transition-colors">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 shadow-sm transition-colors">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/ready-made')}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>

          <Store className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          <span
            className="text-sm text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
            onClick={() => navigate('/ready-made')}
          >
            {t('Store')}
          </span>
          <span className="text-slate-300 dark:text-slate-600 text-sm">/</span>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{product.name}</span>
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-6 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

          {/* LEFT — Hero Image */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="aspect-[4/3.5] overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-500"
              />
            </div>
            {/* Tags strip */}
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Category:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold border border-blue-100 dark:border-blue-800/50">
                {product.demographic}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700">
                {product.category}
              </span>
              {isKids && (
                <span className="px-2.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs font-bold border border-violet-200 dark:border-violet-800/50">
                  Age-Tiered Sizing
                </span>
              )}
            </div>
          </div>

          {/* RIGHT — Details Panel */}
          <div className="space-y-6">

            {/* Title + SKU + Status */}
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">{product.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">{product.sku}</span>
                <StatusBadge status={product.status as Garment['status']} />
              </div>
              {specs && (
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-4">{specs.description}</p>
              )}
            </div>

            {/* Stock + Base size summary cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{t('Total Stock')}</p>
                  <p className="text-xl font-extrabold text-slate-900 dark:text-white">{product.stock}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center gap-3">
                <div className="p-2 bg-violet-50 dark:bg-violet-900/30 rounded-lg">
                  <Tag className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{t('Size Range')}</p>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                    {isKids ? '6M – 5Y' : product.size.split(',')[0].trim() + ' – ' + product.size.split(',').at(-1)?.trim()}
                  </p>
                </div>
              </div>
            </div>

            {/* Tech Spec Cards */}
            {specs ? (
              <div className="space-y-4">

                {/* Material */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                      <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t('MATERIAL USED')}</h3>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{specs.material}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{t('Fabric type:')} {product.fabric}</p>
                </div>

                {/* Colors */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-rose-50 dark:bg-rose-900/30 rounded-lg">
                      <Palette className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t('AVAILABLE COLORS')}</h3>
                  </div>
                  <ColorSelector
                    colors={displayColors}
                    selected={selectedColor}
                    setSelected={setSelectedColor}
                  />
                </div>

                {/* ── Interactive Size / Age Selector ─────────────────────── */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                      <Ruler className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      {t('SIZES AVAILABLE — SELECT TO CHECK AVAILABILITY')}
                    </h3>
                  </div>
                  <SizeSelector
                    sizes={displaySizes}
                    stockMap={stockMap}
                    isKids={isKids}
                    selected={selectedSize}
                    setSelected={setSelectedSize}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-5 text-sm text-slate-400 dark:text-slate-500">
                Detailed specifications are not available for this item yet.
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => navigate('/ready-made')}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
              >
                {t('— Back to Store')}
              </button>
              <button
                onClick={handleCreatePO}
                className="flex-1 py-3 font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm bg-[#1766e6] dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 text-white hover:shadow-md"
              >
                <FilePlus className="w-4 h-4" />
                {t('Create Purchase Order')}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
