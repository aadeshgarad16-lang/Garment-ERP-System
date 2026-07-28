import { ArrowLeft, ShoppingCart, Trash2, Plus, Minus, CheckCircle, PackageSearch, AlertCircle, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';

export function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, orders, placeOrder, cancelOrder } = useCart();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'cart' | 'orders'>('cart');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [cancelModalOrder, setCancelModalOrder] = useState<string | null>(null);

  // Auto-hide toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const gstAmount = cartTotal * 0.05; // 5% GST
  const finalTotal = cartTotal + gstAmount;

  const handlePlaceOrder = () => {
    placeOrder();
    setActiveTab('orders');
    setToastMessage('Order Placed Successfully!');
  };

  const handleConfirmCancel = () => {
    if (cancelModalOrder) {
      cancelOrder(cancelModalOrder);
      setCancelModalOrder(null);
      setToastMessage('Order Cancelled Successfully');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans pb-12 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-xl flex items-center gap-2 animate-slide-in">
          <CheckCircle className="w-4 h-4" />
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Cancellation Modal */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Cancel Order?</h3>
            <p className="text-slate-500 text-sm mb-6">Are you sure you want to cancel this order? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setCancelModalOrder(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
              >
                No, Keep Order
              </button>
              <button 
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Back + Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/ready-made')}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-slate-800">
              <ShoppingCart className="w-6 h-6 text-slate-700" />
              <h1 className="text-2xl font-bold tracking-tight">Your Cart</h1>
            </div>
          </div>
          
          {/* Create PO Button */}
          <button
            onClick={() => navigate('/ready-made/purchase-order')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-colors shadow-sm flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            Create Purchase Order
          </button>
        </div>
        
        {/* Tabs inside Header */}
        <div className="max-w-7xl mx-auto px-6 pt-4 flex gap-6">
          <button 
            onClick={() => setActiveTab('cart')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors relative ${activeTab === 'cart' ? 'border-[#1766e6] text-[#1766e6]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Shopping Cart
            {cartItems.length > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors relative ${activeTab === 'orders' ? 'border-[#1766e6] text-[#1766e6]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Order History
            {orders.length > 0 && (
              <span className="ml-2 bg-slate-200 text-slate-600 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                {orders.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 mt-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Side: Items or Orders */}
        <div className="flex-1">
          {/* CART TAB */}
          {activeTab === 'cart' && (
            cartItems.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-slate-500 space-y-4">
                <ShoppingCart className="w-16 h-16 text-slate-300" />
                <p className="text-lg font-medium">Your cart is empty.</p>
                <button 
                  onClick={() => navigate('/ready-made')}
                  className="px-6 py-2 bg-blue-50 text-blue-600 rounded-lg font-semibold hover:bg-blue-100 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-100">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-slate-800 text-lg leading-tight">{item.name}</h3>
                          <p className="font-bold text-slate-800 text-lg">₹{Number((item.price || 0) * (item.quantity || 1)).toFixed(2)}</p>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">{item.sku} | ₹{Number(item.price || 0).toFixed(2)} each</p>
                        
                        <div className="flex items-center gap-2 mt-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          <span className="bg-slate-100 px-2 py-1 rounded">Size: {item.size}</span>
                          <span className="bg-slate-100 px-2 py-1 rounded">Color: {item.color}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-3 py-1.5 hover:bg-slate-200 text-slate-600 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-4 py-1.5 text-sm font-semibold bg-white border-x border-slate-200">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-3 py-1.5 hover:bg-slate-200 text-slate-600 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-md transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            orders.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-slate-500 space-y-4">
                <PackageSearch className="w-16 h-16 text-slate-300" />
                <p className="text-lg font-medium">No past orders yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{order.id}</p>
                        <p className="text-xs text-slate-500 uppercase font-semibold mt-1">
                          {new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                        order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        order.status === 'Processing' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="p-6 flex flex-col gap-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover border border-slate-100" />
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800">{item.name}</p>
                            <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-sm font-bold text-slate-800">₹{Number((item.price || 0) * (item.quantity || 1)).toFixed(2)}</p>
                        </div>
                      ))}
                      
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-2">
                        <div>
                          <p className="text-sm text-slate-500 font-semibold">Total Paid</p>
                          <p className="text-lg font-extrabold text-slate-900">₹{Number(order.total || 0).toFixed(2)}</p>
                        </div>
                        {order.status === 'Processing' && (
                          <button
                            onClick={() => setCancelModalOrder(order.id)}
                            className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            Cancel Order
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Right Side: Order Summary (Only shows on Cart tab with items) */}
        {activeTab === 'cart' && cartItems.length > 0 && (
          <div className="w-full lg:w-[380px] flex-shrink-0">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm sticky top-48">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Order Summary</h3>
              <div className="space-y-3 mb-6 text-sm font-semibold">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-800">₹{Number(cartTotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (5%)</span>
                  <span className="font-bold text-slate-800">₹{Number(gstAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span className="font-bold text-emerald-600">Free</span>
                </div>
                <div className="flex justify-between items-end pt-4 border-t border-slate-100 mt-4">
                  <span className="text-base font-bold text-slate-800">Total Price</span>
                  <span className="text-2xl font-extrabold text-slate-900">₹{Number(finalTotal || 0).toFixed(2)}</span>
                </div>
              </div>
              
              <button 
                onClick={handlePlaceOrder}
                className="w-full bg-[#1766e6] hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Package className="w-5 h-5" />
                Place Order Now
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
