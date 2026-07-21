// @ts-nocheck
// PBKDF2-based password hashing using Web Crypto API (no external library needed)

const ITERATIONS = 100000;
const SESSION_KEY = 'gladex_employee_session';

async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial, 256
  );
  return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function hashPassword(password, salt) {
  return deriveKey(password, salt);
}

export async function verifyPassword(password, salt, storedHash) {
  const hash = await deriveKey(password, salt);
  return hash === storedHash;
}

export function generateSalt() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function setSession(employee) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    id: employee.id,
    employee_id: employee.employee_id,
    name: `${employee.first_name || ''} ${employee.last_name || ''}`.trim(),
    department: employee.department_name || '',
    email: employee.email || '',
    role: employee.role || '',
  }));
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
