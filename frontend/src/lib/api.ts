const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

const TOKEN_KEY = "cuci_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  query?: Record<string, string | number | undefined>;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, query } = options;

  const url = new URL(`${API_URL}${path}`);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    });
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = (data as { message?: string }).message ?? "Terjadi kesalahan.";
    const errors = (data as { errors?: Record<string, string[]> }).errors;
    if (res.status === 401) clearToken();
    throw new ApiError(res.status, message, errors);
  }

  return data as T;
}

/**
 * Membuka resi PDF di tab baru dengan menyertakan token via blob.
 */
export async function openResi(orderId: number): Promise<void> {
  const token = getToken();
  const res = await fetch(`${API_URL}/orders/${orderId}/resi`, {
    headers: {
      Accept: "application/pdf",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    throw new ApiError(res.status, "Gagal memuat resi PDF.");
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  window.open(objectUrl, "_blank");
  // Bersihkan setelah beberapa saat
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

export { API_URL };
