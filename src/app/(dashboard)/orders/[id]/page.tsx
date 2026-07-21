"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, MapPin, Calendar, IndianRupee, CreditCard, Package } from 'lucide-react';
import Link from 'next/link';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('savedOrders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const found = parsed.find((o: any) => o.id === params.id);
        if (found) {
          setOrder(found);
        }
      } catch (e) {}
    }
  }, [params.id]);

  if (!order) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-neutral-500 mb-4">Order not found or loading...</p>
        <button onClick={() => router.push('/orders')} className="text-blue-600 hover:underline">Return to Orders</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/orders" className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Order Details: {order.poNumber || 'Unnamed PO'}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PO Info Card */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-3 text-card-foreground"><FileText className="h-5 w-5 text-blue-600" /> Purchase Order Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">PO Number</p>
              <p className="font-medium text-foreground">{order.poNumber || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Customer Name</p>
              <p className="font-medium text-foreground">{order.customerName || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">PO Date</p>
              <p className="font-medium text-foreground">{order.poDate ? order.poDate.split('T')[0] : '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Delivery Date</p>
              <p className="font-medium text-foreground">{order.deliveryDate ? order.deliveryDate.split('T')[0] : '-'}</p>
            </div>
          </div>
        </div>

        {/* Payment Info Card */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-3 text-card-foreground"><CreditCard className="h-5 w-5 text-green-600" /> Payment Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Payment Term</p>
              <p className="font-medium text-foreground">{order.paymentTerm || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Subtotal</p>
              <p className="font-medium text-foreground">₹{order.poAmount || '0.00'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Advance Amount</p>
              <p className="font-medium text-foreground">₹{order.advanceAmount || '0.00'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Amount</p>
              <p className="font-medium text-foreground font-bold text-blue-600">₹{order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Remaining Amount</p>
              <p className="font-medium text-foreground font-bold text-blue-600">₹{order.totalAmount ? Math.max(0, order.totalAmount - (order.advanceAmount || 0)).toFixed(2) : '0.00'}</p>
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-4 md:col-span-2">
          <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-3 text-card-foreground"><MapPin className="h-5 w-5 text-indigo-600" /> Addresses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-2">
              <h3 className="font-medium text-foreground">Billing Address</h3>
              <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-line">{order.billingAddress || '-'}</p>
              <div className="grid grid-cols-2 gap-2 mt-2 text-card-foreground">
                <div><span className="text-muted-foreground">PIN:</span> {order.billingPinCode || '-'}</div>
                <div><span className="text-muted-foreground">Contact:</span> {order.billingContact || '-'}</div>
                <div className="col-span-2"><span className="text-muted-foreground">Email:</span> {order.billingEmail || '-'}</div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-foreground">Delivery Address</h3>
              <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-line">{order.deliveryAddress || '-'}</p>
              <div className="grid grid-cols-2 gap-2 mt-2 text-card-foreground">
                <div><span className="text-muted-foreground">PIN:</span> {order.deliveryPinCode || '-'}</div>
                <div><span className="text-muted-foreground">Contact:</span> {order.deliveryContact || '-'}</div>
                <div className="col-span-2"><span className="text-muted-foreground">Email:</span> {order.deliveryEmail || '-'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Specifications */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-4 md:col-span-2 overflow-x-auto">
          <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-3 text-card-foreground"><Package className="h-5 w-5 text-purple-600" /> Order Specifications</h2>
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-neutral-50 dark:bg-card border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Design</th>
                <th className="px-4 py-3">Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
              {order.specs && order.specs.filter((s:any) => s.sku || s.size || s.design || s.quantity > 0).map((spec: any, i: number) => (
                <tr key={i} className="hover:bg-neutral-50/50 dark:hover:bg-slate-800 transition-colors text-foreground">
                  <td className="px-4 py-3 text-sm">{spec.sku || '-'}</td>
                  <td className="px-4 py-3 text-sm">{spec.size || '-'}</td>
                  <td className="px-4 py-3 text-sm">{spec.design || '-'}</td>
                  <td className="px-4 py-3 text-sm">{spec.quantity || 0}</td>
                </tr>
              ))}
              {(!order.specs || order.specs.filter((s:any) => s.sku || s.size || s.design || s.quantity > 0).length === 0) && (
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-sm text-center text-muted-foreground">No specifications found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
