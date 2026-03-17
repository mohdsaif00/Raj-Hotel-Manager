import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = `${process.env.EXPO_PUBLIC_DOMAIN || ""}/api`;

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem("token");
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data as T;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiFetch<{ user: User; token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    signup: (name: string, email: string, password: string) =>
      apiFetch<{ user: User; token: string }>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      }),
    me: () => apiFetch<User>("/auth/me"),
  },
  rooms: {
    list: () => apiFetch<Room[]>("/rooms"),
    get: (id: number) => apiFetch<Room>(`/rooms/${id}`),
    create: (data: Partial<Room>) =>
      apiFetch<Room>("/rooms", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Room>) =>
      apiFetch<Room>(`/rooms/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
      apiFetch<{ message: string }>(`/rooms/${id}`, { method: "DELETE" }),
  },
  bookings: {
    list: () => apiFetch<BookingWithDetails[]>("/bookings"),
    create: (roomId: number, checkIn: string, checkOut: string) =>
      apiFetch<Booking>("/book-room", {
        method: "POST",
        body: JSON.stringify({ roomId, checkIn, checkOut }),
      }),
    update: (id: number, status: string) =>
      apiFetch<Booking>(`/bookings/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),
  },
  payments: {
    list: () => apiFetch<PaymentWithDetails[]>("/payments"),
    create: (bookingId: number, amount: number, screenshotUrl?: string) =>
      apiFetch<Payment>("/payment", {
        method: "POST",
        body: JSON.stringify({ bookingId, amount, screenshotUrl }),
      }),
    update: (id: number, status: string) =>
      apiFetch<Payment>(`/payments/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),
  },
  orders: {
    list: () => apiFetch<Order[]>("/orders"),
    create: (itemName: string, price: number) =>
      apiFetch<Order>("/order-food", {
        method: "POST",
        body: JSON.stringify({ itemName, price }),
      }),
    update: (id: number, status: string) =>
      apiFetch<Order>(`/orders/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),
  },
  analytics: {
    get: () => apiFetch<AnalyticsData>("/analytics"),
  },
  upload: {
    image: (imageBase64: string, folder?: string) =>
      apiFetch<{ url: string }>("/upload-image", {
        method: "POST",
        body: JSON.stringify({ imageBase64, folder }),
      }),
  },
};

export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "customer";
  createdAt: string;
}

export interface Room {
  id: number;
  title: string;
  description: string;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  createdAt: string;
}

export interface Booking {
  id: number;
  userId: number;
  roomId: number;
  checkIn: string;
  checkOut: string;
  status: "pending" | "confirmed" | "rejected";
  createdAt: string;
}

export interface BookingWithDetails extends Booking {
  user: User;
  room: Room;
}

export interface Payment {
  id: number;
  bookingId: number;
  amount: number;
  screenshotUrl: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface PaymentWithDetails extends Payment {
  booking: BookingWithDetails;
}

export interface Order {
  id: number;
  userId: number;
  itemName: string;
  price: number;
  status: "pending" | "delivered";
  createdAt: string;
}

export interface AnalyticsData {
  totalBookings: number;
  totalRevenue: number;
  activeRooms: number;
  pendingPayments: number;
  monthlyRevenue: { month: string; revenue: number }[];
  bookingTrends: { month: string; count: number }[];
}
