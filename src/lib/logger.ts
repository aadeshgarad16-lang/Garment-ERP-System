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

export const getLogs = (): SystemLog[] => {
  if (typeof window === 'undefined') return [];
  const storedLogs = localStorage.getItem('systemLogs');
  if (!storedLogs) {
    return [];
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
