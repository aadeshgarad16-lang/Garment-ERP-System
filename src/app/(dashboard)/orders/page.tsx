"use client";

import React, { useState } from 'react';
import {
  Building2,
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
  MapPin,
  Package,
  Plus,
  Save,
  Trash2,
  Upload,
  User,
  ShoppingBag,
  Box,
  Calculator,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import WorkflowIndicator from '@/components/WorkflowIndicator';
import { useLanguage } from '@/contexts/language-context';

interface GarmentSpec {
  id: string;
  sku: string;
  size: string;
  design: string;
  quantity: number;
  stockAvailable: number;
  useExistingStock: number;
}

export default function OrdersPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [specs, setSpecs] = useState<GarmentSpec[]>([
    { id: '1', sku: '', size: '', design: '', quantity: 0, stockAvailable: 0, useExistingStock: 0 }
  ]);

  const isValidRow = (spec: GarmentSpec) => {
    return spec.useExistingStock <= spec.stockAvailable && spec.useExistingStock <= spec.quantity;
  };

  const isFormValid = specs.every(isValidRow);
  const totalQuantity = specs.reduce((sum, spec) => sum + (spec.quantity || 0), 0);
  const totalStockUsed = specs.reduce((sum, spec) => sum + (spec.useExistingStock || 0), 0);
  const totalProductionRequired = specs.reduce((sum, spec) => sum + Math.max(0, (spec.quantity || 0) - (spec.useExistingStock || 0)), 0);
  const partialFulfillmentPercentage = totalQuantity > 0 ? Math.round((totalStockUsed / totalQuantity) * 100) : 0;

  const addRow = () => {
    setSpecs([
      ...specs,
      { id: Math.random().toString(36).substring(7), sku: '', size: '', design: '', quantity: 0, stockAvailable: 0, useExistingStock: 0 }
    ]);
  };

  const removeRow = (id: string) => {
    if (specs.length > 1) {
      setSpecs(specs.filter(spec => spec.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof GarmentSpec, value: string | number) => {
    setSpecs(specs.map(spec => spec.id === id ? { ...spec, [field]: value } : spec));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8 font-sans pb-8">
      <WorkflowIndicator currentStep={t('orderInitiation.tracker.orderInitiation')} />

      {/* ----------------- ORDER INITIATION SECTION ----------------- */}
      <section className="space-y-6">
        {/* Form Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-blue-600" />
              {t('orderInitiation.header.title')}
            </h1>
            <p className="text-neutral-500 text-sm mt-1">{t('orderInitiation.header.description')}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-4 md:mt-0">
            <button className="w-full sm:w-auto px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-lg shadow-sm hover:bg-neutral-50 transition-colors font-medium text-sm">
              {t('orderInitiation.header.cancel')}
            </button>
            <button className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors font-medium text-sm flex items-center justify-center gap-2">
              <Save className="h-4 w-4" />
              {t('orderInitiation.header.saveOrder')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Purchase Order Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
              <div className="border-b border-neutral-200 px-6 py-4 bg-neutral-50/50">
                <h2 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-neutral-500" />
                  {t('orderInitiation.purchaseOrderInfo.title')}
                </h2>
              </div>

              <div className="p-4 sm:p-5 lg:p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-neutral-400" />
                      {t('orderInitiation.purchaseOrderInfo.poNumber')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-white border border-neutral-300 text-neutral-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                      placeholder="e.g. PO-2023-001"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
                      <User className="h-4 w-4 text-neutral-400" />
                      {t('orderInitiation.purchaseOrderInfo.customerName')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-white border border-neutral-300 text-neutral-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                      placeholder="Enter customer name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-neutral-400" />
                      {t('orderInitiation.purchaseOrderInfo.officeAddress')}
                    </label>
                    <textarea
                      className="w-full px-3 py-2 bg-white border border-neutral-300 text-neutral-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow min-h-[80px]"
                      placeholder={t('orderInitiation.purchaseOrderInfo.officeAddressPlaceholder') as string}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-neutral-400" />
                      {t('orderInitiation.purchaseOrderInfo.deliveryAddress')} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className="w-full px-3 py-2 bg-white border border-neutral-300 text-neutral-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow min-h-[80px]"
                      placeholder={t('orderInitiation.purchaseOrderInfo.deliveryAddressPlaceholder') as string}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-neutral-400" />
                      {t('orderInitiation.purchaseOrderInfo.poDate')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 bg-white border border-neutral-300 text-neutral-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-neutral-400" />
                      {t('orderInitiation.purchaseOrderInfo.deliveryDate')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 bg-white border border-neutral-300 text-neutral-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-sm font-medium text-neutral-700 block mb-2">{t('orderInitiation.purchaseOrderInfo.uploadPoFile')}</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-neutral-300 border-dashed rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors cursor-pointer group">
                    <div className="space-y-2 text-center">
                      <div className="mx-auto h-12 w-12 text-neutral-400 group-hover:text-blue-500 transition-colors flex items-center justify-center bg-white rounded-full shadow-sm border border-neutral-200">
                        <Upload className="h-6 w-6" />
                      </div>
                      <div className="flex text-sm text-neutral-600 justify-center">
                        <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                          <span>{t('orderInitiation.purchaseOrderInfo.uploadInstructions').split(' ')[0]} {t('orderInitiation.purchaseOrderInfo.uploadInstructions').split(' ')[1]}</span>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                        </label>
                        <p className="pl-1">{t('orderInitiation.purchaseOrderInfo.uploadInstructions').substring(t('orderInitiation.purchaseOrderInfo.uploadInstructions').indexOf(' ') + 1)}</p>
                      </div>
                      <p className="text-xs text-neutral-500">{t('orderInitiation.purchaseOrderInfo.uploadConstraints')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Sidebar Form Column */}
          <div className="space-y-6">

            {/* Payment Details Card */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden sticky top-6">
              <div className="border-b border-neutral-200 px-6 py-4 bg-neutral-50/50">
                <h2 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-neutral-500" />
                  {t('orderInitiation.paymentDetails.title')}
                </h2>
              </div>

              <div className="p-4 sm:p-5 lg:p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral-700 block">{t('orderInitiation.paymentDetails.paymentTerm')}</label>
                  <select className="w-full px-3 py-2 bg-white border border-neutral-300 text-neutral-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow appearance-none">
                    <option value="">{t('orderInitiation.paymentDetails.selectTerm')}</option>
                    <option value="net30">Net 30 Days</option>
                    <option value="net60">Net 60 Days</option>
                    <option value="upon_receipt">Due Upon Receipt</option>
                    <option value="advance">50% Advance, 50% on Delivery</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-neutral-400" />
                    {t('orderInitiation.paymentDetails.poAmount')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-neutral-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full pl-7 pr-3 py-2 bg-white border border-neutral-300 text-neutral-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-neutral-400" />
                    {t('orderInitiation.paymentDetails.advanceAmount')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-neutral-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full pl-7 pr-3 py-2 bg-white border border-neutral-300 text-neutral-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-neutral-100">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-500">{t('orderInitiation.paymentDetails.subtotal')}</span>
                    <span className="font-medium text-neutral-900">$0.00</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-500">{t('orderInitiation.paymentDetails.tax')}</span>
                    <span className="font-medium text-neutral-900">$0.00</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold mt-4 pt-4 border-t border-neutral-100">
                    <span className="text-neutral-900">{t('orderInitiation.paymentDetails.totalAmount')}</span>
                    <span className="text-blue-600">$0.00</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Garment Specifications Card - Full Width Below */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden mt-6">
          <div className="border-b border-neutral-200 px-6 py-4 bg-neutral-50/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
              <Package className="h-5 w-5 text-neutral-500" />
              {t('orderInitiation.garmentSpecifications.title')}
            </h2>
            <button
              onClick={addRow}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              {t('orderInitiation.garmentSpecifications.addRow')}
            </button>
          </div>

          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[600px]">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-xs uppercase tracking-wider text-neutral-500 font-medium">
                  <th className="px-4 py-3 min-w-[120px]">{t('orderInitiation.garmentSpecifications.table.sku')}</th>
                  <th className="px-4 py-3 min-w-[100px]">{t('orderInitiation.garmentSpecifications.table.size')}</th>
                  <th className="px-4 py-3 min-w-[150px]">{t('orderInitiation.garmentSpecifications.table.design')}</th>
                  <th className="px-4 py-3 min-w-[120px]">{t('orderInitiation.garmentSpecifications.table.quantity')}</th>
                  <th className="px-4 py-3 min-w-[120px]">{t('orderInitiation.garmentSpecifications.table.stockAvail')}</th>
                  <th className="px-4 py-3 min-w-[120px]">{t('orderInitiation.garmentSpecifications.table.useStock')}</th>
                  <th className="px-4 py-3 min-w-[120px]">{t('orderInitiation.garmentSpecifications.table.prodReq')}</th>
                  <th className="px-4 py-3 w-16 text-center">{t('orderInitiation.garmentSpecifications.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {specs.map((spec) => (
                  <tr key={spec.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={spec.sku}
                        onChange={(e) => updateRow(spec.id, 'sku', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-neutral-300 text-neutral-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="e.g. TS-001"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={spec.size}
                        onChange={(e) => updateRow(spec.id, 'size', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-neutral-300 text-neutral-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="e.g. M, L, XL"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={spec.design}
                        onChange={(e) => updateRow(spec.id, 'design', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-neutral-300 text-neutral-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="e.g. V-Neck Logo"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        value={spec.quantity || ''}
                        onChange={(e) => updateRow(spec.id, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-white border border-neutral-300 text-neutral-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        value={spec.stockAvailable || ''}
                        onChange={(e) => updateRow(spec.id, 'stockAvailable', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-white border border-neutral-300 text-neutral-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          min="0"
                          value={spec.useExistingStock || ''}
                          onChange={(e) => updateRow(spec.id, 'useExistingStock', parseInt(e.target.value) || 0)}
                          className={`w-full px-3 py-1.5 bg-white border ${!isValidRow(spec) ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : 'border-neutral-300 focus:ring-blue-500 focus:border-blue-500'} text-neutral-900 rounded-md focus:outline-none focus:ring-2 text-sm transition-colors`}
                          placeholder="0"
                        />
                        {!isValidRow(spec) && (
                          <span className="text-[10px] text-red-500 font-medium leading-tight max-w-[120px]">Invalid allocation</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-medium text-neutral-900">{Math.max(0, (spec.quantity || 0) - (spec.useExistingStock || 0))}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => removeRow(spec.id)}
                        disabled={specs.length === 1}
                        className={`p-1.5 rounded-md transition-colors ${specs.length === 1 ? 'text-neutral-300 cursor-not-allowed' : 'text-neutral-400 hover:text-red-600 hover:bg-red-50'}`}
                        title="Remove row"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-neutral-50 px-6 py-3 border-t border-neutral-200 flex justify-between items-center text-sm">
            <span className="text-neutral-500">{t('orderInitiation.garmentSpecifications.summary.totalItems')}: <span className="font-medium text-neutral-900">{specs.length}</span></span>
            <span className="text-neutral-500 hidden sm:inline-block italic text-xs">{t('orderInitiation.garmentSpecifications.summary.formula')}</span>
            <span className="text-neutral-500">{t('orderInitiation.garmentSpecifications.summary.totalQuantity')}: <span className="font-medium text-neutral-900">{totalQuantity}</span></span>
          </div>
        </div>

        {/* Stock Calculation Card */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden mt-6">
          <div className="border-b border-neutral-200 px-6 py-4 bg-neutral-50/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
              <Box className="h-5 w-5 text-neutral-500" />
              {t('orderInitiation.stockCalculation.title')}
            </h2>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm font-medium text-blue-800 mb-1">{t('orderInitiation.stockCalculation.totalRequirement')}</p>
                <p className="text-2xl font-bold text-blue-900">{totalQuantity}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                <p className="text-sm font-medium text-emerald-800 mb-1">{t('orderInitiation.stockCalculation.stockAllocated')}</p>
                <p className="text-2xl font-bold text-emerald-900">{totalStockUsed}</p>
                <p className="text-xs text-emerald-700 mt-1">{t('orderInitiation.stockCalculation.partialFulfillment')}: {partialFulfillmentPercentage}%</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-sm font-medium text-amber-800 mb-1">{t('orderInitiation.stockCalculation.newProduction')}</p>
                <p className="text-2xl font-bold text-amber-900">{totalProductionRequired}</p>
                <p className="text-xs text-amber-700 mt-1">{t('orderInitiation.stockCalculation.unitsToBeManufactured')}</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-neutral-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex-1">
                {!isFormValid && (
                  <p className="text-sm text-red-600 font-medium flex items-center gap-1.5"><AlertCircle className="h-4 w-4" /> Please resolve stock allocation errors before proceeding.</p>
                )}
                {isFormValid && totalProductionRequired === 0 && totalQuantity > 0 && (
                  <p className="text-sm text-emerald-600 font-medium flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Order can be fulfilled entirely using existing stock.</p>
                )}
              </div>
              <button
                onClick={() => router.push('/bom-calculation')}
                disabled={!isFormValid || totalProductionRequired === 0 || totalQuantity === 0}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-lg shadow-sm font-medium text-sm flex items-center justify-center gap-2 transition-colors ${!isFormValid || totalProductionRequired === 0 || totalQuantity === 0
                    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
              >
                {t('orderInitiation.stockCalculation.calculateBom')}
                <Calculator className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
