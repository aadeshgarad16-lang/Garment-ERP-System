export type ActionType = 'Created' | 'Updated' | 'Deleted' | 'Approved' | 'Rejected';

export interface SystemLog {
  id: string;
  orderNo: string;
  person: string;
  actionType: ActionType;
  changeDetails: string;
  timestamp: string;
}

export const addLog = (log: Omit<SystemLog, 'id' | 'timestamp'>) => {
  if (typeof window === 'undefined') return;
  const storedLogs = localStorage.getItem('systemLogs');
  const logs: SystemLog[] = storedLogs ? JSON.parse(storedLogs) : [];

  const newLog: SystemLog = {
    ...log,
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString()
  };

  logs.unshift(newLog); // Add to beginning
  localStorage.setItem('systemLogs', JSON.stringify(logs));
  window.dispatchEvent(new Event('systemLogsUpdated'));
};

const initialMockLogs: SystemLog[] = [
  { id: 'log-mock-1', orderNo: 'PO-1001', person: 'Arjun Mehta', actionType: 'Created', changeDetails: 'New garment order created for Polo T-Shirt', timestamp: '2026-06-10T09:15:00' },
  { id: 'log-mock-2', orderNo: 'PO-1001', person: 'Arjun Mehta', actionType: 'Updated', changeDetails: 'Quantity changed from 500 pcs to 750 pcs', timestamp: '2026-06-10T09:30:00' },
  { id: 'log-mock-3', orderNo: 'PO-1001', person: 'Rahul Sharma', actionType: 'Approved', changeDetails: 'Order approved and moved to Production Planning', timestamp: '2026-06-10T10:05:00' },
  { id: 'log-mock-4', orderNo: 'PO-1002', person: 'Priya Mehta', actionType: 'Created', changeDetails: 'New garment order created for Hooded Sweatshirt', timestamp: '2026-06-10T11:10:00' },
  { id: 'log-mock-5', orderNo: 'PO-1002', person: 'Priya Mehta', actionType: 'Updated', changeDetails: 'Delivery date changed from 25-Jun-2026 to 30-Jun-2026', timestamp: '2026-06-10T11:25:00' },
  { id: 'log-mock-6', orderNo: 'PO-1003', person: 'Neha Gupta', actionType: 'Updated', changeDetails: 'Garment color changed from Navy Blue to Black', timestamp: '2026-06-09T14:45:00' },
  { id: 'log-mock-7', orderNo: 'PO-1003', person: 'Neha Gupta', actionType: 'Updated', changeDetails: 'Size ratio updated (S-50, M-150, L-200, XL-100)', timestamp: '2026-06-09T15:10:00' },
  { id: 'log-mock-8', orderNo: 'PO-1004', person: 'Vikram Singh', actionType: 'Created', changeDetails: 'New garment order created for Round Neck T-Shirt', timestamp: '2026-06-09T16:20:00' },
  { id: 'log-mock-9', orderNo: 'PO-1004', person: 'Rahul Sharma', actionType: 'Updated', changeDetails: 'Fabric changed from 100% Cotton to Cotton Lycra', timestamp: '2026-06-09T16:50:00' },
  { id: 'log-mock-10', orderNo: 'PO-1005', person: 'Priya Mehta', actionType: 'Updated', changeDetails: 'Buyer changed from H&M to Zara', timestamp: '2026-06-08T10:15:00' },
  { id: 'log-mock-11', orderNo: 'PO-1005', person: 'Priya Mehta', actionType: 'Approved', changeDetails: 'Tech Pack approved by Merchandising Team', timestamp: '2026-06-08T11:30:00' },
  { id: 'log-mock-12', orderNo: 'PO-1006', person: 'Rahul Sharma', actionType: 'Updated', changeDetails: 'Printing requirement changed from Screen Print to DTF Print', timestamp: '2026-06-08T13:45:00' },
  { id: 'log-mock-13', orderNo: 'PO-1006', person: 'Rahul Sharma', actionType: 'Updated', changeDetails: 'Garment specification updated with new measurement chart', timestamp: '2026-06-08T14:20:00' },
  { id: 'log-mock-14', orderNo: 'PO-1007', person: 'Neha Gupta', actionType: 'Created', changeDetails: 'New garment order created for Jogger Pants', timestamp: '2026-06-07T09:40:00' },
  { id: 'log-mock-15', orderNo: 'PO-1007', person: 'Vikram Singh', actionType: 'Updated', changeDetails: 'Shipment mode changed from Sea Freight to Air Freight', timestamp: '2026-06-07T10:15:00' },
  { id: 'log-mock-16', orderNo: 'PO-1008', person: 'Karan Patel', actionType: 'Updated', changeDetails: 'Delivery type changed from Single Delivery Address to Multi Delivery Address', timestamp: '2026-06-07T11:20:00' },
  { id: 'log-mock-17', orderNo: 'PO-1008', person: 'Karan Patel', actionType: 'Updated', changeDetails: 'Added 3 delivery destinations for order distribution', timestamp: '2026-06-07T11:35:00' },
  { id: 'log-mock-18', orderNo: 'PO-1009', person: 'Rahul Sharma', actionType: 'Approved', changeDetails: 'Production order approved and released to factory', timestamp: '2026-06-06T14:10:00' },
  { id: 'log-mock-19', orderNo: 'PO-1010', person: 'Priya Mehta', actionType: 'Updated', changeDetails: 'PO Number updated from PO-2451 to PO-2451A', timestamp: '2026-06-06T15:05:00' },
  { id: 'log-mock-20', orderNo: 'PO-1011', person: 'Neha Gupta', actionType: 'Updated', changeDetails: 'Vendor changed from ABC Garments to XYZ Apparel Pvt Ltd', timestamp: '2026-06-05T10:50:00' },
  { id: 'log-mock-21', orderNo: 'PO-1012', person: 'Vikram Singh', actionType: 'Updated', changeDetails: 'Quantity reduced from 1200 pcs to 1000 pcs', timestamp: '2026-06-05T12:25:00' },
  { id: 'log-mock-22', orderNo: 'PO-1013', person: 'Rahul Sharma', actionType: 'Rejected', changeDetails: 'Order rejected due to missing garment specifications', timestamp: '2026-06-05T14:40:00' },
  { id: 'log-mock-23', orderNo: 'PO-1014', person: 'Karan Patel', actionType: 'Updated', changeDetails: 'Care label information updated as per buyer requirement', timestamp: '2026-06-04T11:15:00' },
  { id: 'log-mock-24', orderNo: 'PO-1015', person: 'Priya Mehta', actionType: 'Approved', changeDetails: 'Final order approved and moved to Dispatch Stage', timestamp: '2026-06-04T16:30:00' }
];

export const getLogs = (): SystemLog[] => {
  if (typeof window === 'undefined') return [];
  const storedLogs = localStorage.getItem('systemLogs');
  if (!storedLogs || JSON.parse(storedLogs).length === 0) {
    localStorage.setItem('systemLogs', JSON.stringify(initialMockLogs));
    return initialMockLogs;
  }
  return JSON.parse(storedLogs);
};

export const generateOrderChangeDetails = (oldOrder: any, newOrder: any): string => {
  if (!oldOrder) return "Order created with initial details.";

  const changes: string[] = [];

  if (oldOrder.status !== newOrder.status) {
    changes.push(`Status changed from "${oldOrder.status || 'None'}" to "${newOrder.status || 'None'}"`);
  }

  if (oldOrder.stage !== newOrder.stage) {
    changes.push(`Workflow Stage updated to "${newOrder.stage || 'None'}"`);
  }

  if (oldOrder.deliveryDate !== newOrder.deliveryDate) {
    changes.push(`Delivery Date changed to ${newOrder.deliveryDate || 'None'}`);
  }

  if (oldOrder.poAmount !== newOrder.poAmount) {
    changes.push(`PO Amount changed to ${newOrder.poAmount}`);
  }

  // Compare specs array length (Garment specifications)
  const oldSpecsLen = oldOrder.specs ? oldOrder.specs.length : 0;
  const newSpecsLen = newOrder.specs ? newOrder.specs.length : 0;
  if (oldSpecsLen !== newSpecsLen) {
    changes.push(`Garment specifications modified (${newSpecsLen} items)`);
  } else if (JSON.stringify(oldOrder.specs) !== JSON.stringify(newOrder.specs)) {
    changes.push("Garment specifications updated");
  }

  // Check detailed allocations
  if (JSON.stringify(oldOrder.detailedAllocations) !== JSON.stringify(newOrder.detailedAllocations)) {
    changes.push("Delivery details and allocations updated");
  }

  // Fallback if no specific high-level diff matched but we know it was an update
  if (changes.length === 0) {
    return "Order information modified.";
  }

  return changes.join(" | ");
};

// Unified helper to apply changes, diff them, and log
export const updateOrderAndLog = (
  poNumber: string,
  person: string,
  actionType: ActionType,
  customDetails: string | null,
  updateFn: (orders: any[]) => any[]
) => {
  if (typeof window === 'undefined') return;
  const stored = localStorage.getItem('savedOrders');
  const orders = stored ? JSON.parse(stored) : [];

  const oldOrder = orders.find((o: any) => o.poNumber === poNumber);

  // Apply update
  const updatedOrders = updateFn(orders);
  localStorage.setItem('savedOrders', JSON.stringify(updatedOrders));
  window.dispatchEvent(new Event('storage'));

  const newOrder = updatedOrders.find((o: any) => o.poNumber === poNumber);

  let details = customDetails;
  if (!details) {
    // Determine automatically
    if (!oldOrder && newOrder) details = "Order initially created";
    else if (oldOrder && !newOrder) details = "Order deleted";
    else details = generateOrderChangeDetails(oldOrder, newOrder);
  }

  addLog({
    orderNo: poNumber,
    person: person || 'System User',
    actionType,
    changeDetails: details
  });
};
