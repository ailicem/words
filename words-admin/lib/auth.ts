// 简单的本地登录态管理（demo 用，数据仅存于 localStorage）
export type UserRole = "admin" | "user";

export type User = {
  name: string;
  email: string;
  role: UserRole;
};

const STORAGE_KEY = "words-admin-user";

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function setSession(
  user: Omit<User, "role"> & { role?: UserRole }
) {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ role: "admin", ...user })
  );
}

export function clearSession() {
  window.localStorage.removeItem(STORAGE_KEY);
}