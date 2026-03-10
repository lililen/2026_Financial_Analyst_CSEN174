export type StoredUser = {
  email: string;
  password: string;
};

const USERS_KEY = "fh_users";
const CURRENT_USER_KEY = "fh_currentUserEmail";

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getUsers(): StoredUser[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(USERS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (u) => typeof u === "object" && typeof u.email === "string" && typeof u.password === "string"
      );
    }
    return [];
  } catch {
    return [];
  }
}

export function saveUsers(users: StoredUser[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function setCurrentUser(email: string) {
  if (!isBrowser()) return;
  window.localStorage.setItem(CURRENT_USER_KEY, email);
}

export function getCurrentUser(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(CURRENT_USER_KEY);
}

export function clearAuthData() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(USERS_KEY);
  window.localStorage.removeItem(CURRENT_USER_KEY);
}

