export type Role = "admin" | "pelanggan";

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
}

export interface OliProduct {
  id: number;
  name: string;
  brand: string | null;
  description: string | null;
  price: number;
  stock: number;
  unit: string;
  image_url: string | null;
  is_active: boolean;
  created_at?: string;
}

export type OrderStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface OrderItem {
  id: number;
  item_type: "service" | "oli";
  oli_product_id: number | null;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Payment {
  id: number | null;
  amount: number;
  method: string | null;
  status: "unpaid" | "paid" | null;
  paid_at: string | null;
}

export interface OrderCustomer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
}

export interface Order {
  id: number;
  order_number: string;
  resi_number: string | null;
  status: OrderStatus;
  vehicle_type: string;
  vehicle_brand: string | null;
  vehicle_plate: string | null;
  vehicle_criteria: string | null;
  notes: string | null;
  subtotal: number;
  total: number;
  confirmed_at: string | null;
  completed_at: string | null;
  created_at: string;
  customer?: OrderCustomer;
  items?: OrderItem[];
  payment?: Payment;
}

export interface Paginated<T> {
  data: T[];
  links: unknown;
  meta: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
}
