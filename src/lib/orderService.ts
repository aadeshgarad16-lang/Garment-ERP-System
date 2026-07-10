const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5000";

const READ_KEY = process.env.NEXT_PUBLIC_ERP_READ_API_KEY as string;
const WRITE_KEY = process.env.NEXT_PUBLIC_ERP_WRITE_API_KEY as string;

export interface Customer {
  customer_id: number;
  customer_name: string;
  contact_person: string;
  phone: string;
  email: string;
  shipping_address?: string;
  billing_address?: string;
}

export interface InventoryItem {
  material_id?: number;
  id?: number;
  material_name: string;
  current_stock: number;
  unit_price: number;
}

export interface InitiateOrderPayload {
  customer_id: number;
  product_id: number;
  quantity: number;
  shipping_address: string;
}

export interface InitiateOrderResponse {
  success: boolean;
  message: string;
  order_id: number;
}

/**
 * Handle fetch errors and parse responses cleanly
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.error) {
        errorMessage = errorJson.error;
      }
    } catch {
      try {
        const text = await response.text();
        if (text) errorMessage = text;
      } catch {}
    }
    throw new Error(errorMessage);
  }
  return response.json() as Promise<T>;
}

/**
 * Handle network/connection errors and return a standardized message
 */
function handleNetworkError(error: any): never {
  console.error("API Service Network Error:", error);
  if (error instanceof Error) {
    if (error.message.includes("Failed to fetch") || error.message.includes("network error") || error.message.includes("fetch failed")) {
      throw new Error("Connection Refused: Please verify that your backend server is running and CORS is enabled.");
    }
    throw error;
  }
  throw new Error("An unexpected error occurred while communicating with the server.");
}

/**
 * Fetch all customers from the backend database
 */
export async function fetchCustomersAPI(): Promise<Customer[]> {
  try {
    const res = await fetch(`${BASE_URL}/customers/view`, {
      method: "GET",
      headers: {
        "X-API-Key": READ_KEY,
      },
    });
    return await handleResponse<Customer[]>(res);
  } catch (err) {
    return handleNetworkError(err);
  }
}

/**
 * Fetch inventory items to be used as products
 */
export async function fetchInventoryAPI(): Promise<InventoryItem[]> {
  try {
    const res = await fetch(`${BASE_URL}/inventory/view`, {
      method: "GET",
      headers: {
        "X-API-Key": READ_KEY,
      },
    });
    return await handleResponse<InventoryItem[]>(res);
  } catch (err) {
    return handleNetworkError(err);
  }
}

/**
 * POST Order Initiation request to the backend
 */
export async function initiateOrderAPI(payload: InitiateOrderPayload): Promise<InitiateOrderResponse> {
  try {
    const res = await fetch(`${BASE_URL}/orders/initiate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": WRITE_KEY,
      },
      body: JSON.stringify(payload),
    });
    return await handleResponse<InitiateOrderResponse>(res);
  } catch (err) {
    return handleNetworkError(err);
  }
}
