"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import {
  CreditCard,
  FileText,
  MapPin,
  Plus,
  Save,
  Trash2,
  Upload,
  ShoppingBag,
  X,
  Package,
} from "lucide-react";
import WorkflowIndicator from "@/components/WorkflowIndicator";

interface GarmentSpec {
  id: string;
  itemDescription: string;
  size: string;
  pattern: string;
  quantity: number;
  stockAvailable: number;
  unitPrice: number;
  photoName: string | null;
}

export default function OrdersPage() {
  const router = useRouter();

  const [poNumber, setPoNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [poDate, setPoDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const inputStyle =
    "w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white text-gray-900 placeholder:text-neutral-400 caret-black focus:outline-none focus:ring-2 focus:ring-blue-500";

  const [specs, setSpecs] = useState<GarmentSpec[]>([
    {
      id: "1",
      itemDescription: "",
      size: "",
      pattern: "",
      quantity: 0,
      stockAvailable: 0,
      unitPrice: 0,
      photoName: null,
    },
  ]);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [poAmount, setPoAmount] = useState<number>(0);
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);

  const subtotal = poAmount;
  const tax = 0;
  const totalAmount = subtotal + tax;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setUploadedFile(file);
  };

  const removeFile = () => {
    setUploadedFile(null);
  };

  const addRow = () => {
    setSpecs([
      ...specs,
      {
        id: Math.random().toString(),
        itemDescription: "",
        size: "",
        pattern: "",
        quantity: 0,
        stockAvailable: 0,
        unitPrice: 0,
        photoName: null,
      },
    ]);
  };

  const removeRow = (id: string) => {
    if (specs.length > 1) {
      setSpecs(specs.filter((spec) => spec.id !== id));
    }
  };

  const updateRow = (
    id: string,
    field: keyof GarmentSpec,
    value: string | number,
  ) => {
    setSpecs(
      specs.map((spec) =>
        spec.id === id ? { ...spec, [field]: value } : spec,
      ),
    );
  };

  const handleSaveDraft = () => {
    alert("Draft Saved Successfully");
  };

  const handleViewDrafts = () => {
    window.location.href = "/drafts";
  };

  const handleSubmitOrder = () => {
    const newOrder = {
      id: Date.now().toString(),
      poNumber,
      customerName,
      poDate,
      deliveryDate,
      poAmount,
      totalAmount,
      specs,
      status: "Submitted",
      stage: "Stock Check",
      date: new Date().toISOString(),
    };

    const existingOrders = JSON.parse(
      localStorage.getItem("savedOrders") || "[]",
    );

    existingOrders.push(newOrder);

    localStorage.setItem("savedOrders", JSON.stringify(existingOrders));

    alert("Order Submitted Successfully");
  };

  const handleStockCalculation = () => {
    window.location.href = "/stock-calculation";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <WorkflowIndicator currentStep="Order Initiation" />
      {/* HEADER */}

      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-blue-600" />
            Order Initiation
          </h1>

          <p className="text-sm text-neutral-500 mt-1">
            Create and manage purchase orders
          </p>
        </div>
      </div>

      {/* MAIN GRID */}

      <div className="space-y-6">
        {/* LEFT SIDE */}

        <div className="w-full space-y-6">
          {/* PURCHASE ORDER */}

          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-visible">
            <div className="border-b border-neutral-200 px-6 py-4 bg-neutral-50/50">
              <h2 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                <FileText className="h-5 w-5 text-neutral-500" />
                Purchase Order Information
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* PO NUMBER + CUSTOMER */}

              {/* PURCHASE ORDER DETAILS */}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                {/* 1. PO ORDER NUMBER */}

                <div>
                  <label className="text-sm font-medium text-neutral-700">
                    PO Order Number <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    placeholder="e.g. PO-2026-001"
                    style={{ color: "#111827" }}
                    className={inputStyle}
                  />
                </div>

                {/* 2. PO DATE */}

                <div>
                  <label className="text-sm font-medium text-neutral-700">
                    PO Date <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="date"
                    value={poDate}
                    onChange={(e) => setPoDate(e.target.value)}
                    style={{ color: "#111827" }}
                    className={`${inputStyle} h-[48px]`}
                  />
                </div>

                {/* 3. DELIVERY ADDRESS */}

                <div>
                  <label className="text-sm font-medium text-neutral-700">
                    Delivery Date <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    style={{ color: "#111827" }}
                    className={`${inputStyle} h-[48px]`}
                  />
                </div>

                {/* 4. CUSTOMER NAME */}

                <div>
                  <label className="text-sm font-medium text-neutral-700">
                    Customer Name <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    style={{ color: "#111827" }}
                    className={inputStyle}
                  />
                </div>

                {/* DELIVERY DATE */}
              </div>

              {/* CUSTOMER CONTACT */}

              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5">
                <h3 className="text-base font-semibold text-neutral-800 mb-4">
                  Customer Contact Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-700">
                      Contact Person Name
                    </label>

                    <input
                      type="text"
                      placeholder="Contact person"
                      style={{ color: "#111827" }}
                      className={inputStyle}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-neutral-700">
                      Phone Number
                    </label>

                    <input
                      type="tel"
                      placeholder="Phone number"
                      style={{ color: "#111827" }}
                      className={inputStyle}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-neutral-700">
                      Email ID
                    </label>

                    <input
                      type="email"
                      placeholder="Email address"
                      style={{ color: "#111827" }}
                      className={inputStyle}
                    />
                  </div>
                </div>
              </div>

              {/* DELIVERY */}

              {/* DELIVERY ADDRESS */}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* DELIVERY ADDRESS */}

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Delivery Address <span className="text-red-500">*</span>
                  </label>

                  <textarea
                    placeholder="Enter complete delivery address"
                    style={{ color: "#111827" }}
                    className={`${inputStyle} min-h-[120px]`}
                  />
                </div>

                {/* PIN CODE */}

                <div>
                  <label className="text-sm font-medium text-neutral-700">
                    PIN Code <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. 422001"
                    style={{ color: "#111827" }}
                    className={`${inputStyle} h-[48px]`}
                  />
                </div>
              </div>

              {/* BILLING */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Bill / Invoice To */}
                <div>
                  <label className="text-sm font-medium text-neutral-700">
                    Bill / Invoice To <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    placeholder="Company name"
                    style={{ color: "#111827" }}
                    className={inputStyle}
                  />
                </div>

                {/* Billing Address PIN */}
                <div>
                  <label className="text-sm font-medium text-neutral-700">
                    Billing Address (PIN)
                  </label>

                  <input
                    type="text"
                    placeholder="Billing PIN"
                    style={{ color: "#111827" }}
                    className={inputStyle}
                  />
                </div>

                {/* Billing Address */}
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-neutral-700">
                    Billing Address
                  </label>

                  <textarea
                    placeholder="Billing address"
                    style={{ color: "#111827" }}
                    className={`${inputStyle} min-h-[100px]`}
                  />
                </div>
              </div>

              {/* GST + CIN */}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div>
                  <label className="text-sm font-medium text-neutral-700">
                    GST Reg No <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    placeholder="GST Number"
                    style={{ color: "#111827" }}
                    className={inputStyle}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-700">
                    CIN <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    placeholder="CIN Number"
                    style={{ color: "#111827" }}
                    className={inputStyle}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-700">
                    Test Certificate Required
                  </label>

                  <select style={{ color: "#111827" }} className={inputStyle}>
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-700">
                    Transport Cost
                  </label>

                  <select style={{ color: "#111827" }} className={inputStyle}>
                    <option>Paid by Customer</option>
                    <option>Paid by Sasons</option>
                  </select>
                </div>
              </div>

              {/* FILE */}

              <div>
                <label className="text-sm font-medium text-neutral-700">
                  PO File <span className="text-red-500">*</span>
                </label>

                {!uploadedFile ? (
                  <label className="mt-3 border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center bg-neutral-50 cursor-pointer hover:bg-neutral-100 transition block">
                    <Upload className="h-10 w-10 mx-auto text-neutral-400" />

                    <p className="mt-3 text-sm text-blue-600 font-medium">
                      Upload PO File
                    </p>

                    <p className="text-xs text-neutral-500 mt-1">
                      PDF, DOC, XLS, PNG, JPG up to 10MB
                    </p>

                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                ) : (
                  <div className="mt-3 flex items-center justify-between border border-neutral-200 rounded-xl p-4">
                    <p className="font-medium text-neutral-900">
                      {uploadedFile.name}
                    </p>

                    <button
                      onClick={removeFile}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* GARMENT SPECIFICATIONS */}

          {/* PAYMENT */}
          {/* PAYMENT */}

          <div className="w-full">
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
              <div className="border-b border-neutral-200 px-6 py-4 bg-neutral-50/50">
                <h2 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-neutral-500" />
                  Payment Details
                </h2>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="text-sm font-medium text-neutral-700">
                    Payment Term
                  </label>

                  <select style={{ color: "#111827" }} className={inputStyle}>
                    <option>Select term...</option>
                    <option>Within 30 Days</option>
                    <option>Within 60 Days</option>
                    <option>Within 90 Days</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-700">
                    PO Amount <span className="text-red-500">*</span>
                  </label>

                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                      ₹
                    </span>

                    <input
                      type="number"
                      value={poAmount || ""}
                      onChange={(e) => setPoAmount(Number(e.target.value))}
                      style={{ color: "#111827" }}
                      className={`${inputStyle} pl-10`}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-700">
                    Advance Amount
                  </label>

                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                      ₹
                    </span>

                    <input
                      type="number"
                      value={advanceAmount || ""}
                      onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                      style={{ color: "#111827" }}
                      className={`${inputStyle} pl-10`}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="border-t border-neutral-200 pt-5 mt-2 space-y-2">
                  <div className="flex justify-between text-sm text-neutral-500">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-sm text-neutral-500">
                    <span>Tax (0%)</span>
                    <span>₹{tax.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-end pt-4 mt-4 border-t border-neutral-200 text-lg font-bold">
                    <span className="text-blue-600">
                      ₹{totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* GARMENT SPECIFICATIONS */}

          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-800 overflow-hidden">
            <div className="border-b border-neutral-200 dark:border-slate-800 px-6 py-4 bg-neutral-50/50 dark:bg-slate-800/50 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                <Package className="h-5 w-5 text-neutral-500" />
                Garment Specifications
              </h2>

              <button
                onClick={addRow}
                className="px-4 py-2 bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-100 transition"
              >
                <Plus className="h-4 w-4" />
                Add Row
              </button>
            </div>

            <div className="w-full">
              <table className="w-full text-left border-collapse">
                <thead className="bg-neutral-50 dark:bg-slate-800/50">
                  <tr className="text-xs uppercase text-neutral-500 dark:text-neutral-400 font-medium">
                    <th className="px-4 py-3 border-b border-neutral-200 dark:border-slate-700">
                      Item Description
                    </th>

                    <th className="px-4 py-3 border-b border-neutral-200 dark:border-slate-700">
                      Size
                    </th>

                    <th className="px-4 py-3 border-b border-neutral-200 dark:border-slate-700">
                      Pattern
                    </th>

                    <th className="px-4 py-3 border-b border-neutral-200 dark:border-slate-700">
                      Quantity
                    </th>

                    <th className="px-4 py-3 border-b border-neutral-200 dark:border-slate-700">
                      Available Quantity
                    </th>

                    <th className="px-4 py-3 border-b border-neutral-200 dark:border-slate-700">
                      Unit Price
                    </th>

                    <th className="px-4 py-3 border-b border-neutral-200 dark:border-slate-700">
                      Upload Photo
                    </th>

                    <th className="px-4 py-3 border-b border-neutral-200 dark:border-slate-700 text-center">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
                  {specs.map((spec) => (
                    <tr
                      key={spec.id}
                      className="hover:bg-neutral-50/50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* ITEM DESCRIPTION */}

                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={spec.itemDescription}
                          onChange={(e) =>
                            updateRow(
                              spec.id,
                              "itemDescription",
                              e.target.value,
                            )
                          }
                          className={inputStyle}
                        />
                      </td>

                      {/* SIZE */}

                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={spec.size}
                          onChange={(e) =>
                            updateRow(spec.id, "size", e.target.value)
                          }
                          className={inputStyle}
                        />
                      </td>

                      {/* PATTERN */}

                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={spec.pattern}
                          onChange={(e) =>
                            updateRow(spec.id, "pattern", e.target.value)
                          }
                          className={inputStyle}
                        />
                      </td>

                      {/* QUANTITY */}

                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={spec.quantity}
                          onChange={(e) =>
                            updateRow(
                              spec.id,
                              "quantity",
                              Number(e.target.value),
                            )
                          }
                          className={inputStyle}
                        />
                      </td>

                      {/* AVAILABLE QUANTITY */}

                      <td className="px-4 py-3">
                        <input
                          type="number"
                          placeholder="Available Qty"
                          className={inputStyle}
                        />
                      </td>

                      {/* UNIT PRICE */}

                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={spec.unitPrice}
                          onChange={(e) =>
                            updateRow(
                              spec.id,
                              "unitPrice",
                              Number(e.target.value),
                            )
                          }
                          className={inputStyle}
                        />
                      </td>

                      {/* PHOTO */}

                      <td className="px-4 py-3">
                        <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg text-sm hover:bg-blue-100 transition whitespace-nowrap">
                          <Upload className="h-4 w-4 mr-2" />

                          <span className="truncate max-w-[100px]">
                            {spec.photoName || "Select Photo"}
                          </span>

                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) =>
                              updateRow(
                                spec.id,
                                "photoName",
                                e.target.files?.[0]?.name || "",
                              )
                            }
                          />
                        </label>
                      </td>

                      {/* DELETE */}

                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => removeRow(spec.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* BOTTOM ACTION BUTTONS */}

          <div className="w-full flex justify-end mt-6 border-t border-neutral-200 pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => alert("Draft Saved Successfully")}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition"
              >
                Save as Draft
              </button>

              <button
                onClick={() => router.push("/drafts")}
                className="px-5 py-2.5 border border-neutral-300 bg-white rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition"
              >
                View Drafts
              </button>

              <button
                onClick={handleSubmitOrder}
                className="px-5 py-2.5 bg-blue-600 ..."
              >
                Submit Order
              </button>

              <button
                onClick={() => router.push("/stock-calculation")}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition"
              >
                Go to Stock Calculation →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}