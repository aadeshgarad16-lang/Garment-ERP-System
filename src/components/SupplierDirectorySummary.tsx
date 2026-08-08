import React from 'react';
import { Building2, Star, Mail, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function SupplierDirectorySummary() {
  const { t } = useTranslation();

  const suppliers = [
    { name: 'Apex Textiles Ltd.', materials: 'Cotton, Threads', leadTime: '3 Days', performance: 92, status: 'Active', contact: 'contact@apex.com', preferred: true },
    { name: 'Sumeet Trims & Accessories', materials: 'Buttons, Zippers', leadTime: '5 Days', performance: 88, status: 'Review', contact: 'sales@sumeet.in', preferred: false },
    { name: 'Vardhaman Threads & Fabrics', materials: 'Polyester, Elastics', leadTime: '4 Days', performance: 95, status: 'Active', contact: 'info@vardhaman.com', preferred: true },
    { name: 'Royal Garments & Weaving', materials: 'Denim, Twill', leadTime: '7 Days', performance: 81, status: 'Review', contact: 'hello@royal.com', preferred: false },
    { name: 'Global Trims Corp', materials: 'Labels, Tags', leadTime: '2 Days', performance: 98, status: 'Active', contact: 'orders@globaltrims.com', preferred: true }
  ];

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="border-b border-border px-6 py-5 bg-neutral-50/50 dark:bg-card/30">
        <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          {t('procurement.supplierSummary') || 'Supplier Directory Summary'}
        </h2>
      </div>
      <div className="w-full">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-card border-b border-neutral-100 dark:border-border text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              <th className="px-4 py-3 w-[22%] break-words">{t('bom.customer') || 'Supplier Name'}</th>
              <th className="px-4 py-3 w-[25%] break-words">{t('inventoryVal.materialsHeader') || 'Materials Supplied'}</th>
              <th className="px-4 py-3 w-[15%] break-words">{t('leadTime') || 'Lead Time'}</th>
              <th className="px-4 py-3 w-[18%] break-words">{t('performance') || 'Rating'}</th>
              <th className="px-4 py-3 w-[20%] break-words">{t('dashboard.recentOrders.headers.status') || 'Status & Contact'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
            {suppliers.map((supplier, idx) => (
              <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3 break-words">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground flex items-center gap-1 flex-wrap">
                      {supplier.name}
                      {supplier.preferred && <span title={t('procurement.preferredSupplier') || 'Preferred Supplier'}><Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" /></span>}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[13px] text-muted-foreground break-words">{supplier.materials}</td>
                <td className="px-4 py-3 text-[13px] text-muted-foreground break-words">{supplier.leadTime}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col xl:flex-row items-start xl:items-center gap-2">
                    <div className="w-full max-w-[40px] xl:max-w-[60px] bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${supplier.performance >= 95 ? 'bg-emerald-500' : supplier.performance >= 90 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${supplier.performance}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{supplier.performance}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-2 text-sm">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider whitespace-normal text-center ${supplier.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {supplier.status === 'Active' ? (t('dashboard.stockAlerts.severity.low') || 'Active') : (t('dashboard.stockAlerts.severity.low') || 'Under Review')}
                    </span>
                    <div className="flex gap-1.5 text-neutral-400 mt-1 xl:mt-0">
                      <button className="hover:text-blue-600 transition-colors" title={`Email ${supplier.contact}`}><Mail className="h-3.5 w-3.5" /></button>
                      <button className="hover:text-blue-600 transition-colors" title="Call Supplier"><Phone className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
