import { useNavigate } from 'react-router';
import { ArrowLeft, Save, X, Plus, Upload, Check } from 'lucide-react';
import { useState, useRef } from 'react';
import { Garment } from './garmentsData';
import { useGarments } from '../context/GarmentsContext';
import { TopHeader } from './TopHeader';

export function AddItemForm() {
  const navigate = useNavigate();
  const { addGarment } = useGarments();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State variables
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [fabric, setFabric] = useState('Cotton');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [color, setColor] = useState('');
  const [stock, setStock] = useState<number>(10);
  const [price, setPrice] = useState<number>(0);
  const [imageUrl, setImageUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Constants
  const fabricsList = ['Cotton', 'Denim', 'Silk', 'Linen', 'Polyester', 'Wool', 'Cotton Blend'];
  const sizesList = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

  // Handle size checkbox selections
  const handleSizeToggle = (sz: string) => {
    if (selectedSizes.includes(sz)) {
      setSelectedSizes(selectedSizes.filter(s => s !== sz));
    } else {
      setSelectedSizes([...selectedSizes, sz]);
    }
  };

  // Form Submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation checks
    if (!name.trim()) {
      setErrorMsg('Garment Name is required.');
      return;
    }
    if (!sku.trim()) {
      setErrorMsg('Item Code / SKU is required.');
      return;
    }
    if (selectedSizes.length === 0) {
      setErrorMsg('Please select at least one available size.');
      return;
    }
    if (!color.trim()) {
      setErrorMsg('Color is required.');
      return;
    }
    if (stock < 0) {
      setErrorMsg('Initial Stock Quantity cannot be negative.');
      return;
    }
    if (price < 0) {
      setErrorMsg('Price cannot be negative.');
      return;
    }

    // Determine default apparel image if none provided
    let finalImageUrl = imageUrl.trim();
    if (!finalImageUrl) {
      if (fabric === 'Denim') {
        finalImageUrl = 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&auto=format&fit=crop';
      } else if (fabric === 'Silk') {
        finalImageUrl = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop';
      } else if (fabric === 'Linen') {
        finalImageUrl = 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&auto=format&fit=crop';
      } else {
        finalImageUrl = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format&fit=crop';
      }
    }

    // Format category based on name keywords
    let category = 'Apparel';
    const lowerName = name.toLowerCase();
    if (lowerName.includes('kurta')) category = 'Kurta';
    else if (lowerName.includes('jacket')) category = 'Jacket';
    else if (lowerName.includes('saree')) category = 'Saree';
    else if (lowerName.includes('dress')) category = 'Dress';
    else if (lowerName.includes('shirt')) category = 'Shirt';
    else if (lowerName.includes('t-shirt') || lowerName.includes('tee')) category = 'T-Shirt';
    else if (lowerName.includes('jeans') || lowerName.includes('pants')) category = 'Pants';
    else if (lowerName.includes('shorts')) category = 'Shorts';
    else if (lowerName.includes('sweatshirt') || lowerName.includes('hoodie')) category = 'Sweatshirt';

    // Format dynamic sizes text representation
    const sizeString = selectedSizes.join(', ');

    // Calculate stock status, badges, and primary action buttons
    let status: "In Stock" | "Low Stock" | "Out of Stock" = 'In Stock';
    let badgeColor = 'bg-[#48bb78]'; // Green
    let thirdButtonText = 'Details';
    let thirdButtonColor = 'bg-[#1766e6] hover:bg-blue-700 text-white font-medium';

    if (stock === 0) {
      status = 'Out of Stock';
      badgeColor = 'bg-[#e53e3e]'; // Red
      thirdButtonText = 'Restock';
      thirdButtonColor = 'bg-[#e53e3e] hover:bg-red-700 text-white font-medium';
    } else if (stock <= 5) {
      status = 'Low Stock';
      badgeColor = 'bg-[#ed8936]'; // Orange
      thirdButtonText = 'Pack';
      thirdButtonColor = 'bg-[#1766e6] hover:bg-blue-700 text-white font-medium';
    }

    // Construct the new Garment object
    const newGarment: Garment = {
      id: Date.now(), // will be reassigned by context if needed
      name: name.trim(),
      sku: sku.trim().toUpperCase().startsWith('#') ? sku.trim().toUpperCase() : `#${sku.trim().toUpperCase()}`,
      image: finalImageUrl,
      size: sizeString,
      color: color.trim(),
      stock,
      price,
      demographic: 'Men', // Hardcoded as field was removed
      category,
      fabric,
      status,
      badgeColor,
      thirdButton: {
        text: thirdButtonText,
        color: thirdButtonColor
      }
    };

    // Save and redirect
    addGarment(newGarment);
    navigate('/ready-made');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans pb-16">
      
      {/* Header controls */}
      <TopHeader>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/ready-made')}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mr-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <StoreIcon className="w-6 h-6 text-slate-700 dark:text-slate-300 stroke-[2.25]" />
            <h1 className="text-xl font-bold tracking-tight">Add New Garment</h1>
          </div>
        </div>
        <div className="flex-1"></div>
        <button
          onClick={() => navigate('/ready-made')}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </TopHeader>

      {/* Form Container */}
      <main className="max-w-4xl mx-auto px-6 mt-8">
        
        {/* Error notification banner */}
        {errorMsg && (
          <div className="mb-6 bg-red-50 border border-red-200/60 rounded-xl p-4 flex items-start gap-3 text-red-700 text-sm font-medium animate-slide-in">
            <span className="w-2.5 h-2.5 bg-[#e53e3e] rounded-full mt-1.5 shadow-sm shrink-0"></span>
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row gap-8 p-6 md:p-8">
          
          {/* Left panel: File Upload Placeholder Zone */}
          <div className="flex-1 space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Product Image
              </label>
              
              {/* File Picker Zone */}
              <div 
                className="border-2 border-dashed border-slate-200 hover:border-blue-400/80 transition-colors rounded-xl p-6 bg-slate-50/50 hover:bg-slate-50 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] relative overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
              >
                {imageUrl && imageUrl.startsWith('data:image') ? (
                  <img src={imageUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <>
                    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-3 mb-3 text-slate-400">
                      <Upload className="w-6 h-6 text-[#1766e6]" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">Click to upload product image</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Supports PNG, JPG, or WEBP.</p>
                  </>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload}
                />
              </div>
            </div>

            {/* URL Paste field for mock demonstration */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Paste Image URL (For Mockups)
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-... or local path"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800"
              />
              <p className="text-[10px] text-slate-400 mt-1.5 leading-normal">
                If left blank, a beautiful, high-resolution clothing image matching the selected fabric type will be automatically assigned.
              </p>
            </div>
          </div>

          {/* Right panel: Garment Metadata Details */}
          <div className="flex-[1.25] space-y-5">
            
            {/* Grid Row 1: Name and SKU */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Garment Name <span className="text-[#e53e3e]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cotton Kurta"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Item Code / SKU <span className="text-[#e53e3e]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. #CK102"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-800"
                />
              </div>
            </div>


            {/* Fabric Type Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Material / Fabric Type
              </label>
              <select
                value={fabric}
                onChange={(e) => setFabric(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-800"
              >
                {fabricsList.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Checkbox badge selector for available sizes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Available Sizes <span className="text-[#e53e3e]">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {sizesList.map((sz) => {
                  const isSelected = selectedSizes.includes(sz);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => handleSizeToggle(sz)}
                      className={`px-4 py-2 border rounded-lg text-xs font-bold tracking-wide transition-all ${
                        isSelected
                          ? 'border-[#1766e6] bg-blue-50 text-[#1766e6] shadow-sm'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color and Stock */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Color <span className="text-[#e53e3e]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Blue"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Initial Stock Quantity <span className="text-[#e53e3e]">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-800"
                />
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Price <span className="text-[#e53e3e]">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                value={price}
                onChange={(e) => setPrice(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-800"
              />
            </div>

            {/* Action buttons footer */}
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate('/ready-made')}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#1766e6] hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all shadow-sm hover:shadow flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Product</span>
              </button>
            </div>

          </div>

        </form>

      </main>

    </div>
  );
}

// Simple storefront inline visual helper icon
function StoreIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m2 7 4.41-3.67A2 2 0 0 1 7.73 2.8H16.3a2 2 0 0 1 1.32.53L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M7 12v-1a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1" />
      <path d="M13 12v-1a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1" />
      <path d="M2 7h20" />
    </svg>
  );
}
