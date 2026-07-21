"use client";

import React, { useState } from 'react';

export default function TextileSpecificationsPage() {
  const [rows, setRows] = useState([
    { id: 1, address: '', clothType1: '', quantity: 0, clothType2: '' },
    { id: 2, address: '', clothType1: '', quantity: 0, clothType2: '' },
    { id: 3, address: '', clothType1: '', quantity: 0, clothType2: '' },
  ]);

  const updateRow = (id: number, field: string, value: string | number) => {
    setRows(rows.map(row => (row.id === id ? { ...row, [field]: value } : row)));
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-neutral-50 dark:bg-card min-h-screen">
      <div className="bg-card rounded-xl shadow-sm border border-border p-8">
        <h1 className="text-3xl font-bold text-foreground mb-8 border-b pb-4">
          Textile Order Specifications
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Configuration Details Section */}
          <div className="lg:w-1/3">
            <div className="bg-neutral-50 dark:bg-card/50 rounded-lg p-6 border border-border">
              <h2 className="text-xl font-semibold text-card-foreground mb-4">
                Configuration Details
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-neutral-700 dark:text-neutral-300">
                <li>User History</li>
                <li>BOM Calculation (Shortages)</li>
                <li>Ready-ness Status</li>
                <li>Allocation & BOM Cal.</li>
                <li>Unfreeze material</li>
                <li>Cutting : allocated material list</li>
                <li>Approval Phase</li>
                <li>Languages</li>
              </ul>
            </div>
          </div>

          {/* Detailed Specifications Table */}
          <div className="lg:w-2/3">
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="bg-neutral-50 dark:bg-card/50 px-6 py-4 border-b border-border">
                <h2 className="text-xl font-semibold text-card-foreground">
                  Detailed Specifications
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-neutral-50 dark:bg-card border-b border-border">
                    <tr className="text-sm uppercase text-muted-foreground font-semibold">
                      <th className="px-6 py-4 border-r border-border w-24">Item Number</th>
                      <th className="px-6 py-4 border-r border-border">Address</th>
                      <th className="px-6 py-4 border-r border-border">Cloth Type</th>
                      <th className="px-6 py-4 border-r border-border w-32">Select/Quantity</th>
                      <th className="px-6 py-4">Cloth Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-slate-700">
                    {rows.map((row) => (
                      <tr key={row.id} className="hover:bg-neutral-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 border-r border-border font-medium text-foreground text-center">
                          {row.id}.
                        </td>
                        <td className="px-4 py-4 border-r border-border">
                          <input
                            type="text"
                            value={row.address}
                            onChange={(e) => updateRow(row.id, 'address', e.target.value)}
                            placeholder="Enter Address"
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-card"
                          />
                        </td>
                        <td className="px-4 py-4 border-r border-border">
                          <select
                            value={row.clothType1}
                            onChange={(e) => updateRow(row.id, 'clothType1', e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-card"
                          >
                            <option value="">Select Type</option>
                            <option value="Cotton">Cotton</option>
                            <option value="Polyester">Polyester</option>
                            <option value="Denim">Denim</option>
                            <option value="Linen">Linen</option>
                          </select>
                        </td>
                        <td className="px-4 py-4 border-r border-border">
                          <input
                            type="number"
                            min="0"
                            value={row.quantity}
                            onChange={(e) => updateRow(row.id, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-card"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <input
                            type="text"
                            value={row.clothType2}
                            onChange={(e) => updateRow(row.id, 'clothType2', e.target.value)}
                            placeholder="Details"
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-card"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
