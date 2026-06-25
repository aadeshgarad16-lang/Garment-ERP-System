export interface GarmentSpec {
  id: string;
  itemDescription: string;
  size: string;
  pattern: string;
  quantity: number;
  stockAvailable: number;
  unitPrice: number;
  photoName: string | null;
  useExistingStock?: number;
}

export interface Order {
  id: string;
  poNumber: string;
  customerName: string;
  poDate: string;
  deliveryDate: string;
  
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  deliveryType?: "single" | "multi";
  deliveryAddress?: string;
  deliveryPin?: string;
  deliveryLocationType?: string;
  deliveryAddresses?: any[];
  parentPoNumber?: string;
  detailedAllocations?: any[];
  billingCompany?: string;
  billingPin?: string;
  billingAddress?: string;
  gstNumber?: string;
  cinNumber?: string;
  testCertificate?: string;
  transportCost?: string;
  paymentTerm?: string;
  advanceAmount?: number;
  poImageName?: string;
  poImageBase64?: string;
  
  poAmount: number;
  totalAmount: number;
  specs: GarmentSpec[];
  status: "DRAFT" | "SUBMITTED";
  stage: string;
  current_stage?: string;
  currentStage?: number;
  date: string;
  productionStages?: any[];
  qualityStages?: any[];
  logisticsStep?: number;
  logisticsCompletedSteps?: number[];
  orderArchived?: boolean;
}

import { generateOrderChangeDetails, addLog } from './logger';

// Simulated network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const saveOrderAPI = async (orderData: Partial<Order>): Promise<{ success: boolean; data: Order }> => {
  await delay(800); // Simulate network request
  
  const existingOrdersStr = localStorage.getItem("savedOrders");
  let orders: Order[] = existingOrdersStr ? JSON.parse(existingOrdersStr) : [];
  
  let savedOrder: Order;
  
  const existingIndex = orders.findIndex(o => o.id === orderData.id);
  if (existingIndex !== -1) {
    // Update existing
    orders[existingIndex] = { ...orders[existingIndex], ...orderData } as Order;
    savedOrder = orders[existingIndex];
  } else {
    // Create new
    savedOrder = {
      ...orderData,
      id: orderData.id || "PO-" + Date.now(),
      date: new Date().toISOString(),
    } as Order;
    orders.push(savedOrder);
  }

  localStorage.setItem("savedOrders", JSON.stringify(orders));
  
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"));
  }
  
  const actionType = existingIndex !== -1 ? 'Updated' : 'Created';
  const changeDetails = generateOrderChangeDetails(
    existingIndex !== -1 ? JSON.parse(existingOrdersStr || "[]").find((o:any)=>o.id === orderData.id) : null,
    savedOrder
  );
  addLog({
    orderNo: savedOrder.poNumber || 'Unknown PO',
    person: 'System User', // The auth hook isn't accessible here, but we will rely on client components passing the user context down for custom logs if needed
    actionType,
    changeDetails
  });
  
  return { success: true, data: savedOrder };
};

export const getDraftsAPI = async (): Promise<Order[]> => {
  await delay(500);
  const existingOrdersStr = localStorage.getItem("savedOrders");
  const orders: Order[] = existingOrdersStr ? JSON.parse(existingOrdersStr) : [];
  return orders.filter(o => o.status === "DRAFT");
};

export const getAllOrdersAPI = async (): Promise<Order[]> => {
  await delay(500);
  const existingOrdersStr = localStorage.getItem("savedOrders");
  return existingOrdersStr ? JSON.parse(existingOrdersStr) : [];
};

export const deleteOrderAPI = async (id: string): Promise<{ success: boolean }> => {
  await delay(500);
  const existingOrdersStr = localStorage.getItem("savedOrders");
  if (existingOrdersStr) {
    let orders: Order[] = JSON.parse(existingOrdersStr);
    const orderToDelete = orders.find(o => o.id === id);
    if (orderToDelete) {
      orders = orders.filter(o => o.id !== id);
      localStorage.setItem("savedOrders", JSON.stringify(orders));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
      }
      
      addLog({
        orderNo: orderToDelete.poNumber || 'Unknown PO',
        person: 'System User',
        actionType: 'Deleted',
        changeDetails: `Order deleted from system`
      });
    }
  }
  return { success: true };
};

export const getOrderByIdAPI = async (id: string): Promise<Order | null> => {
  await delay(300);
  const existingOrdersStr = localStorage.getItem("savedOrders");
  const orders: Order[] = existingOrdersStr ? JSON.parse(existingOrdersStr) : [];
  return orders.find(o => o.id === id) || null;
};

export const getLatestPoSequenceAPI = async (): Promise<number> => {
  await delay(300);
  const existingOrdersStr = localStorage.getItem("savedOrders");
  const orders: Order[] = existingOrdersStr ? JSON.parse(existingOrdersStr) : [];
  
  const currentYear = new Date().getFullYear();
  let maxNumber = 0;
  
  orders.forEach(order => {
    if (order.poNumber && order.poNumber.startsWith(`PO-${currentYear}-`)) {
      const parts = order.poNumber.split('-');
      if (parts.length === 3) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }
  });
  
  return maxNumber + 1;
};

// --- CUSTOMER ADDRESSES MOCK DATABASE ---
export interface CustomerAddress {
  id: string;
  address: string;
  pinCode: string;
}

const SEED_CUSTOMER_ADDRESSES: Record<string, CustomerAddress[]> = {
  "John Doe": [
    { id: "jd-1", address: "123 Maple Street, Apartment 4B, New York, NY 10001", pinCode: "10001" },
    { id: "jd-2", address: "789 Broadway Ave, Business Suite 200, New York, NY 10003", pinCode: "10003" }
  ],
  "Sarah Jenkins": [
    { id: "sj-1", address: "456 Oak Lane, Austin, TX 78701", pinCode: "78701" }
  ],
  "Arjun Mehta": [
    { id: "am-1", address: "Flat 402, Royal Residency, Baner, Pune 411045", pinCode: "411045" },
    { id: "am-2", address: "Plot 12, Phase 3, Hinjewadi IT Park, Pune 411057", pinCode: "411057" }
  ],
  "Zara India": [
    { id: "zara-1", address: "Zara Retail Store, Palladium Mall, Lower Parel, Mumbai", pinCode: "400013" },
    { id: "zara-2", address: "Zara Logistics Hub, Khasra 382, Bilaspur, Gurugram", pinCode: "122413" }
  ],
  "Reliance Trends": [
    { id: "rt-1", address: "Reliance Trends Hub, Whitefield Main Road, Bangalore", pinCode: "560066" },
    { id: "rt-2", address: "Trends Depot, Ghansoli, Navi Mumbai", pinCode: "400701" }
  ],
  "Acme Corp": [
    { id: "acme-1", address: "Acme Headquarters, Connaught Place, New Delhi", pinCode: "110001" },
    { id: "acme-2", address: "Acme Industrial Area, Phase II, Noida", pinCode: "201301" }
  ]
};

export const getCustomerAddressesAPI = async (customerName: string): Promise<CustomerAddress[]> => {
  await delay(200);
  if (typeof window === "undefined") return [];
  
  const stored = localStorage.getItem("customerAddresses");
  const db = stored ? JSON.parse(stored) : { ...SEED_CUSTOMER_ADDRESSES };
  
  // Ensure newly added seeds are in the db
  let updated = false;
  Object.keys(SEED_CUSTOMER_ADDRESSES).forEach(k => {
    if (!db[k]) {
      db[k] = SEED_CUSTOMER_ADDRESSES[k];
      updated = true;
    }
  });
  if (updated || !stored) {
    localStorage.setItem("customerAddresses", JSON.stringify(db));
  }
  
  const key = Object.keys(db).find(k => k.toLowerCase() === customerName.toLowerCase());
  return key ? db[key] : [];
};

export const saveCustomerAddressAPI = async (customerName: string, address: string, pinCode: string): Promise<{ success: boolean; data: CustomerAddress }> => {
  await delay(300);
  if (typeof window === "undefined") return { success: false, data: {} as any };
  
  const stored = localStorage.getItem("customerAddresses");
  const db = stored ? JSON.parse(stored) : { ...SEED_CUSTOMER_ADDRESSES };
  
  const key = Object.keys(db).find(k => k.toLowerCase() === customerName.toLowerCase()) || customerName;
  const existing = db[key] || [];
  
  const newAddr: CustomerAddress = {
    id: "addr-" + Date.now(),
    address: address.trim(),
    pinCode: pinCode.trim()
  };
  
  db[key] = [...existing, newAddr];
  localStorage.setItem("customerAddresses", JSON.stringify(db));
  
  return { success: true, data: newAddr };
};

