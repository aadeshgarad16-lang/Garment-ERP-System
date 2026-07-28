import { useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, Search, Plus, Store, Trash2, ChevronDown, Archive, ShoppingCart, User, LogOut, Package, Sun, Moon, LayoutDashboard, Shirt, Scissors, Settings, Database } from 'lucide-react';
import { TopHeader } from './TopHeader';
import { useMemo, useState } from 'react';
import { useGarments } from '../context/GarmentsContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
export function ReadyMadeCatalog() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showProfile, setShowProfile] = useState(false);

  const { garments: garmentsList, softDeleteGarment } = useGarments();
  const { addToCart, cartItems } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  // Filter states from URL
  const searchQuery = searchParams.get('q') || '';
  const filterCategory = searchParams.get('category') || 'All Categories';
  const filterSize = searchParams.get('size') || 'All Sizes';
  const filterFabric = searchParams.get('fabric') || 'All Fabrics';

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'All Categories' && value !== 'All Sizes' && value !== 'All Fabrics') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const filteredGarments = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return garmentsList.filter((item) => {
      // Search text match
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.color.toLowerCase().includes(q);

      // Dropdown matches
      const matchesCategory = filterCategory === 'All Categories' || item.category === filterCategory;
      const matchesSize = filterSize === 'All Sizes' || item.size.includes(filterSize);
      const matchesFabric = filterFabric === 'All Fabrics' || item.fabric === filterFabric;

      return matchesSearch && matchesCategory && matchesSize && matchesFabric;
    });
  }, [garmentsList, searchQuery, filterCategory, filterSize, filterFabric]);

  const handleDelete = (id: number) => {
    softDeleteGarment(id);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-slate-900 font-sans pb-12 transition-colors">
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <TopHeader>
          {/* Back + Title */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/store')}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <Store className="w-6 h-6 text-slate-700 dark:text-slate-300 stroke-[2.25]" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight hidden sm:block">{t('store')}</h1>
            </div>
          </div>

          {/* Search input */}
          <div className="relative w-full max-w-xs md:max-w-md mx-2 md:mx-6 flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t('search_garments')}
              value={searchQuery}
              onChange={(e) => updateParam('q', e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">


            {/* Archive button */}
            <button
              onClick={() => navigate('/ready-made/archive')}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm font-semibold transition-colors"
            >
              <Archive className="w-4 h-4" /> <span>{t('archive')}</span>
            </button>

            {/* Add Item button */}
            <button
              onClick={() => navigate('/ready-made/add')}
              className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2 bg-[#1766e6] hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> <span className="hidden md:inline">{t('add_item')}</span>
            </button>
          </div>
        </TopHeader>

        {/* Bottom Row: Filters */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 shrink-0 shadow-sm transition-colors py-3 px-6 z-30 relative">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 mr-1 hidden sm:block">{t('filter_by')}</span>
            {/* Category */}
            <div className="relative">
              <select
                value={filterCategory}
                onChange={(e) => updateParam('category', e.target.value)}
                className="appearance-none bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 pl-3 pr-8 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              >
                <option value="All Categories">{t('all_categories')}</option>
                <option value="Shirt">{t('Shirt')}</option>
                <option value="T-Shirt">{t('T-Shirt')}</option>
                <option value="Jacket">{t('Jacket')}</option>
                <option value="Chinos">{t('Chinos')}</option>
                <option value="Trousers">{t('Trousers')}</option>
                <option value="Saree">{t('Saree')}</option>
                <option value="Dress">{t('Dress')}</option>
                <option value="Hoodie">{t('Hoodie')}</option>
                <option value="Shorts">{t('Shorts')}</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            </div>
            {/* Size */}
            <div className="relative">
              <select
                value={filterSize}
                onChange={(e) => updateParam('size', e.target.value)}
                className="appearance-none bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 pl-3 pr-8 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              >
                <option value="All Sizes">{t('all_sizes')}</option>
                <option>S</option>
                <option>M</option>
                <option>L</option>
                <option>XL</option>
                <option>XXL</option>
                <option>28</option>
                <option>32</option>
                <option>34</option>
                <option>4Y</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            </div>
            {/* Fabric */}
            <div className="relative">
              <select
                value={filterFabric}
                onChange={(e) => updateParam('fabric', e.target.value)}
                className="appearance-none bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 pl-3 pr-8 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              >
                <option value="All Fabrics">{t('all_fabrics')}</option>
                <option value="Cotton">{t('Cotton')}</option>
                <option value="Denim">{t('Denim')}</option>
                <option value="Silk">{t('Silk')}</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            </div>

            {/* Sasons ERP Button */}
            <a
              href="http://localhost:3000/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold py-1.5 px-4 border border-indigo-200 dark:border-indigo-800 rounded-lg shadow-sm text-sm transition-colors"
            >
              <Database className="w-4 h-4" />
              <span>{t('sasons_erp')}</span>
            </a>
          </div>
        </div>

      {/* ── Page body ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto pb-12">
        <main className="max-w-7xl mx-auto px-6 mt-8">

        {/* Section heading */}
        <div className="border-b border-slate-200 pb-0 mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight inline-block border-b-2 border-slate-800 dark:border-slate-100 pb-2.5 -mb-px">
            {t('all_prestitched_garments')}
          </h2>
          <span className="text-sm text-slate-500 font-medium pb-2.5">
            {t(filteredGarments.length === 1 ? 'showing_items_one' : 'showing_items_other', { count: filteredGarments.length })}
          </span>
        </div>

        {/* ── Product grid ─────────────────────────────────────────────────── */}
        {filteredGarments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGarments.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
                {/* Image */}
                <div className="relative bg-slate-50 dark:bg-slate-900/50 aspect-[4/3] overflow-hidden border-b border-slate-100 dark:border-slate-700">
                  <img
                    src={item.image}
                    alt={t(item.name)}
                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                  />
                  {/* Status badge */}
                  <span className={`absolute bottom-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded text-white shadow-sm ${item.badgeColor}`}>
                    {t(item.status)}
                  </span>
                </div>

                {/* Card body */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-snug hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {t(item.name)}
                      </h3>
                      <span className="font-bold text-lg text-slate-800 dark:text-slate-100">₹{item.price}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5 mb-3">{item.sku}</p>

                    {/* Metrics row */}
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600/50 rounded-lg px-2.5 py-2 mb-4">
                      <span>{t('size')} <strong className="text-slate-700 dark:text-slate-300">{item.size}</strong></span>
                      <span className="text-slate-300 dark:text-slate-600">|</span>
                      <span>{t('color')} <strong className="text-slate-700 dark:text-slate-300">{t(item.color)}</strong></span>
                      <span className="text-slate-300 dark:text-slate-600">|</span>
                      <span>{t('stock')} <strong className="text-slate-700 dark:text-slate-300">{item.stock}</strong></span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex items-center justify-center gap-1 py-1.5 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800/50 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> {t('delete')}
                    </button>
                    <button
                      onClick={() => {
                        const isLowOrOut = item.status === 'Low Stock' || item.status === 'Out of Stock';
                        if (isLowOrOut) {
                          navigate(`/ready-made/order/${item.id}`);
                          return;
                        }

                        const isNewItem = item.id >= 16;
                        if (isNewItem && item.thirdButton.text === 'Details') {
                          window.open(`/product/${item.id}`, '_blank', 'noopener,noreferrer');
                        } else {
                          navigate(`/product/${item.id}`);
                        }
                      }}
                      className={`py-1.5 text-xs font-bold rounded-lg text-center transition-colors bg-[#1766e6] hover:bg-blue-700 text-white`}
                    >
                      {t('details')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 max-w-md mx-auto mt-12 shadow-sm">
            <Store className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="font-semibold text-slate-700">{t('no_garments_found')}</p>
            <p className="text-sm mt-1">{t('try_modifying_search')}</p>
          </div>
        )}
        </main>
      </div>
    </div>
  );
}
