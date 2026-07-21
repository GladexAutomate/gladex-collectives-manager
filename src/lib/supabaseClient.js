// @ts-nocheck
const SUPABASE_URL = 'https://wuymgnqpkgxxxghvgcbq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_R5jGhsaREPJ427X1bRnpog_Iz7odR95';

const BASE_HEADERS = {
  apikey:            SUPABASE_KEY,
  Authorization:     `Bearer ${SUPABASE_KEY}`,
  'Content-Type':    'application/json',
  'Accept-Profile':  'public',
  'Content-Profile': 'public',
};

export async function sbFetchEmployees() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/employees?select=*&order=name&limit=500`,
    { headers: BASE_HEADERS }
  );
  if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
  return res.json();
}

export async function sbFetchEmployeeByEmployeeId(employeeId) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/employees?employee_id=eq.${encodeURIComponent(employeeId.trim())}&select=*&limit=1`,
    { headers: BASE_HEADERS }
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] || null;
}

export async function sbSetEmployeeStatus(id, newStatus) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/employees?id=eq.${id}`,
    {
      method:  'PATCH',
      headers: { ...BASE_HEADERS, Prefer: 'return=minimal' },
      body:    JSON.stringify({ status: newStatus }),
    }
  );
  return res.ok;
}

export async function sbSetEmployeePassword(id, passwordHash, salt) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/employees?id=eq.${id}`,
    {
      method:  'PATCH',
      headers: { ...BASE_HEADERS, Prefer: 'return=minimal' },
      body:    JSON.stringify({ password_hash: passwordHash, password_salt: salt }),
    }
  );
  return res.ok;
}

export async function sbAddEmployee(payload) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/employees`,
    {
      method:  'POST',
      headers: { ...BASE_HEADERS, Prefer: 'return=representation' },
      body:    JSON.stringify(payload),
    }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => res.status);
    throw new Error(`Add employee failed: ${res.status} — ${text}`);
  }
  const rows = await res.json();
  return rows[0];
}

export async function sbUpdateEmployee(id, updates) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/employees?id=eq.${id}`,
    {
      method:  'PATCH',
      headers: { ...BASE_HEADERS, Prefer: 'return=minimal' },
      body:    JSON.stringify(updates),
    }
  );
  return res.ok;
}

export async function sbUploadAvatar(employeeId, file) {
  const ext  = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${employeeId}.${ext}`;
  const res  = await fetch(
    `${SUPABASE_URL}/storage/v1/object/avatars/${path}`,
    {
      method:  'POST',
      headers: {
        apikey:           SUPABASE_KEY,
        Authorization:    `Bearer ${SUPABASE_KEY}`,
        'Content-Type':   file.type || 'image/jpeg',
        'x-upsert':       'true',
      },
      body: file,
    }
  );
  if (!res.ok) throw new Error(`Avatar upload failed: ${res.status}`);
  return `${SUPABASE_URL}/storage/v1/object/public/avatars/${path}?t=${Date.now()}`;
}
