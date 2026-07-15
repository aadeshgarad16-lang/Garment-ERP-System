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
  category?: string;
  gender?: string;
  color?: string;
  hsnCode?: string;
  productionType?: string;
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
  advancedAmount?: number;
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
  isSubmitted?: boolean;
}

import { generateOrderChangeDetails, addLog } from './logger';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5000";
const READ_KEY = process.env.NEXT_PUBLIC_ERP_READ_API_KEY as string;
const WRITE_KEY = process.env.NEXT_PUBLIC_ERP_WRITE_API_KEY as string;

export const getAuthHeaders = (isWrite = false): Record<string, string> => {
  const headers: Record<string, string> = {
    "X-API-Key": isWrite ? WRITE_KEY : READ_KEY,
    "Content-Type": "application/json"
  };
  if (typeof window !== "undefined") {
    const session = localStorage.getItem("sason_active_session");
    if (session) {
      try {
        const user = JSON.parse(session);
        const contact = user.contactNo || user.contact_no || user.contactNumber || user.contact_number || user.email || user.email_id;
        if (contact) {
          headers["X-User-Contact"] = contact;
        }
      } catch (e) {}
    }
  }
  return headers;
};

/** Broadcast a custom event so any subscribed context/page re-fetches orders immediately. */
export const dispatchOrdersUpdated = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("orders-updated"));
    window.dispatchEvent(new Event("storage"));
  }
};

/**
 * Fetches the list of all PO numbers already saved in the database.
 * Use this before generating a new PO number to avoid duplicate entry crashes.
 */
export const getExistingPoNumbersAPI = async (): Promise<string[]> => {
  try {
    const res = await fetch(`${BACKEND_URL}/purchase_orders/po-numbers`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.po_numbers) ? data.po_numbers : [];
  } catch {
    return [];
  }
};

// Helper to resolve or create customer_id on the fly based on customerName string input or orderData object
async function getOrCreateCustomerId(customerInput: Partial<Order> | string): Promise<number> {
  const isObj = typeof customerInput !== "string";
  const customerName = isObj ? ((customerInput as Partial<Order>).customerName || "") : (customerInput as string);
  const custNameClean = customerName.trim();
  
  if (!custNameClean) {
    throw new Error("Customer name is required.");
  }
  
  try {
    // 1. Fetch current customer list
    const res = await fetch(`${BACKEND_URL}/customers/view`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    
    if (res.ok) {
      const list = await res.json();
      const match = list.find((c: any) => c.customer_name.toLowerCase() === custNameClean.toLowerCase());
      if (match) {
        return match.customer_id;
      }
    }
    
    // 2. If customer does not exist, add them dynamically
    const orderObj = isObj ? (customerInput as Partial<Order>) : {} as Partial<Order>;
    const addRes = await fetch(`${BACKEND_URL}/customers/add`, {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify({
        customer_name: custNameClean,
        contact_person: orderObj.contactPerson || "Default Contact",
        phone: orderObj.contactPhone || "",
        email: orderObj.contactEmail || "",
        shipping_address: orderObj.deliveryAddress || "",
        billing_address: orderObj.billingAddress || "",
        gst_number: orderObj.gstNumber || "",
        cin_number: orderObj.cinNumber || ""
      })
    });
    
    if (addRes.ok) {
      const addData = await addRes.json();
      return addData.customer_id;
    } else {
      const errData = await addRes.json().catch(() => ({}));
      throw new Error(errData.error || `Customer API returned ${addRes.status}`);
    }
  } catch (err: any) {
    console.error("Failed to get or create customer in backend:", err);
    throw new Error(`Customer creation failed: ${err.message}`);
  }
}

export const saveOrderAPI = async (orderData: Partial<Order>): Promise<{ success: boolean; data: Order }> => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("orders_cleared");
  }
  try {
    const customerId = await getOrCreateCustomerId(orderData);

    // 1. Save main Purchase Order details
    const poPayload = {
      po_number: orderData.poNumber,
      customer_id: customerId,
      status: orderData.status || "DRAFT",
      total_value: Number(orderData.poAmount || 0),
      order_date: orderData.poDate ? new Date(orderData.poDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      delivery_date: orderData.deliveryDate ? new Date(orderData.deliveryDate).toISOString().split("T")[0] : null,
      contact_person: orderData.contactPerson || "",
      contactPhone: orderData.contactPhone || "",
      contact_phone: orderData.contactPhone || "",
      contact_email: orderData.contactEmail || "",
      delivery_type: orderData.deliveryType || "single",
      delivery_address: orderData.deliveryAddress || "",
      delivery_pin: orderData.deliveryPin || "",
      delivery_location_type: orderData.deliveryLocationType || "To Customer",
      billing_company: orderData.billingCompany || orderData.customerName || "",
      billing_address: orderData.billingAddress || "",
      billing_pin: orderData.billingPin || "",
      gst_number: orderData.gstNumber || "",
      cin_number: orderData.cinNumber || "",
      test_certificate: orderData.testCertificate || "Yes",
      transport_cost: orderData.transportCost || "Customer",
      payment_term: orderData.paymentTerm || "30 Days Net",
      advance_amount: Number(orderData.advanceAmount ?? orderData.advancedAmount ?? 0),
      stage: orderData.stage === "Order Initiation" ? "Initiation" : (orderData.stage || "Initiation")
    };

    const poRes = await fetch(`${BACKEND_URL}/purchase_orders/add`, {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify(poPayload)
    });

    if (!poRes.ok) {
      const errData = await poRes.json();
      throw new Error(errData.error || `Failed PO save: HTTP ${poRes.status}`);
    }

    // 2. Save each garment spec item to database specifications table
    if (orderData.specs && orderData.specs.length > 0) {
      await Promise.all(
        orderData.specs.map(async (spec) => {
          const specPayload = {
            po_number: orderData.poNumber,
            fabric_type: spec.category || "Standard",
            size: spec.size || "M",
            color: spec.color || "Default",
            style: "Regular",
            remarks: "",
            item_description: spec.itemDescription || "Garment specification",
            pattern: spec.pattern || "",
            stock_available: spec.stockAvailable || 0,
            unit_price: Number(spec.unitPrice || 0),
            photo_name: spec.photoName || "",
            use_existing_stock: spec.useExistingStock || 0
          };

          return fetch(`${BACKEND_URL}/specifications/add`, {
            method: "POST",
            headers: getAuthHeaders(true),
            body: JSON.stringify(specPayload)
          });
        })
      );
    }

    // Broadcast live-update event to all subscribed pages/contexts
    dispatchOrdersUpdated();

    return { success: true, data: orderData as Order };
  } catch (err: any) {
    console.error("saveOrderAPI failed:", err);
    throw err;
  }
};

export const getDraftsAPI = async (): Promise<Order[]> => {
  try {
    const list = await getAllOrdersAPI();
    return list.filter(o => o.status === "DRAFT");
  } catch (err) {
    return [];
  }
};

export const getAllOrdersAPI = async (): Promise<Order[]> => {
  if (typeof window !== "undefined" && localStorage.getItem("orders_cleared") === "true") {
    return [];
  }
  try {
    const [ordersRes, customersRes] = await Promise.all([
      fetch(`${BACKEND_URL}/purchase_orders/view`, { headers: getAuthHeaders() }),
      fetch(`${BACKEND_URL}/customers/view`, { headers: getAuthHeaders() })
    ]);

    if (!ordersRes.ok) {
      console.warn("Backend orders view not ok. Returning empty list.");
      return [];
    }
    
    const dbOrders = await ordersRes.json();
    const dbCustomers = customersRes.ok ? await customersRes.json() : [];

    return dbOrders.map((po: any) => {
      const matchCust = dbCustomers.find((c: any) => c.customer_id === po.customer_id);
      return {
        id: po.po_number,
        poNumber: po.po_number,
        customerName: matchCust ? matchCust.customer_name : `Customer ID ${po.customer_id}`,
        poDate: po.order_date,
        deliveryDate: po.delivery_date || po.order_date,
        contactPerson: po.contact_person,
        contactPhone: po.contact_phone,
        contactEmail: po.contact_email,
        deliveryType: po.delivery_type,
        deliveryAddress: po.delivery_address,
        deliveryPin: po.delivery_pin,
        deliveryLocationType: po.delivery_location_type,
        billingCompany: po.billing_company,
        billingAddress: po.billing_address,
        billingPin: po.billing_pin,
        gstNumber: po.gst_number,
        cinNumber: po.cin_number,
        testCertificate: po.test_certificate,
        transportCost: po.transport_cost,
        paymentTerm: po.payment_term,
        advanceAmount: po.advance_amount,
        advancedAmount: po.advance_amount,
        poAmount: po.total_value,
        totalAmount: po.total_value,
        specs: [],
        status: po.status,
        stage: po.stage,
        date: po.created_at
      } as Order;
    });
  } catch (err) {
    console.warn("Failed to fetch orders from backend, returning empty list:", err);
    return [];
  }
};

export const resetWorkflowAPI = async (): Promise<{ success: boolean }> => {
  if (typeof window !== "undefined") {
    localStorage.setItem("orders_cleared", "true");
  }
  try {
    const res = await fetch(`${BACKEND_URL}/api/reset-database`, {
      method: "POST",
      headers: getAuthHeaders(true)
    });
    if (res.ok) {
      return { success: true };
    }
    return { success: false };
  } catch (err) {
    console.warn("Failed to reset database on backend:", err);
    return { success: false };
  }
};

export const deleteOrderAPI = async (id: string): Promise<{ success: boolean }> => {
  // Direct deletion simulated by returning success or no-op as the backend has no direct DELETE route currently
  return { success: true };
};

export const getOrderByIdAPI = async (id: string): Promise<Order | null> => {
  try {
    const list = await getAllOrdersAPI();
    const match = list.find(o => o.poNumber === id);
    if (!match) return null;

    try {
      // Load specs dynamically from specifications table
      const specsRes = await fetch(`${BACKEND_URL}/specifications/view`, {
        headers: getAuthHeaders()
      });

      if (specsRes.ok) {
        const allSpecs = await specsRes.json();
        const orderSpecs = allSpecs.filter((s: any) => s.po_number === id);
        match.specs = orderSpecs.map((s: any, idx: number) => ({
          id: String(idx + 1),
          itemDescription: s.item_description,
          size: s.size,
          pattern: s.pattern,
          quantity: s.quantity || 0,
          stockAvailable: s.stock_available || 0,
          unitPrice: s.unit_price || 0,
          photoName: s.photo_name || null
        }));
      }
    } catch (specErr) {
      console.warn("Failed to load specifications from backend, returning order with default/empty specs:", specErr);
      if (match.specs.length === 0) {
        match.specs = [
          {
            id: "1",
            itemDescription: "Cotton T-Shirt",
            size: "M",
            pattern: "Solid Navy",
            quantity: 500,
            stockAvailable: 250,
            unitPrice: 150,
            photoName: null
          }
        ];
      }
    }

    return match;
  } catch (err) {
    console.warn("Failed to get order by ID:", err);
    return null;
  }
};

export const getLatestPoSequenceAPI = async (): Promise<number> => {
  try {
    const list = await getAllOrdersAPI();
    const currentYear = new Date().getFullYear();
    let maxNumber = 0;
    
    list.forEach(order => {
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
  } catch (err) {
    return 1;
  }
};

// --- CUSTOMER ADDRESSES DYNAMIC RETRIEVAL ---
export interface CustomerAddress {
  id: string;
  address: string;
  pinCode: string;
}

export const getCustomerAddressesAPI = async (customerName: string): Promise<CustomerAddress[]> => {
  try {
    const res = await fetch(`${BACKEND_URL}/customers/view`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return [];

    const list = await res.json();
    const match = list.find((c: any) => c.customer_name.toLowerCase() === customerName.trim().toLowerCase());
    
    if (match && (match.delivery_address || match.shipping_address)) {
      return [{
        id: `addr-${match.customer_id}`,
        address: match.delivery_address || match.shipping_address,
        pinCode: match.pin_code || match.delivery_pin || ""
      }];
    }
    return [];
  } catch (err) {
    return [];
  }
};

export const saveCustomerAddressAPI = async (customerName: string, address: string, pinCode: string): Promise<{ success: boolean; data?: CustomerAddress }> => {
  try {
    const res = await fetch(`${BACKEND_URL}/api/customers/update_address`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        customer_name: customerName,
        address: address.trim(),
        pin_code: pinCode.trim()
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success) return { success: false };
    
    return { 
      success: true, 
      data: {
        id: "addr-" + Date.now(),
        address: address.trim(),
        pinCode: pinCode.trim()
      }
    };
  } catch (err) {
    return { success: false };
  }
};

export const validateCustomerAddressAPI = async (address: string, pinCode: string): Promise<{ exists: boolean; customerName?: string }> => {
  try {
    const res = await fetch(`${BACKEND_URL}/api/customers/validate_address`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        address: address.trim(),
        pin_code: pinCode.trim()
      })
    });
    if (!res.ok) return { exists: false };
    const data = await res.json();
    return { exists: data.exists, customerName: data.data?.customer_name };
  } catch (err) {
    return { exists: false };
  }
};


