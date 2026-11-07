// Akun demo bersifat opsional: hanya tersedia lewat tombol di halaman Masuk.
export const DEMO_EMAIL = "pelanggan@cuci.test";
export const DEMO_PASSWORD = "password";

export function isDemoUser(email?: string | null): boolean {
  return email === DEMO_EMAIL;
}