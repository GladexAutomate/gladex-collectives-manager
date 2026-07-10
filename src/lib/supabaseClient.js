// @ts-nocheck
const SUPABASE_URL = 'https://wuymgnqpkgxxxghvgcbq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_R5jGhsaREPJ427X1bRnpog_Iz7odR95';

const BASE_HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Accept-Profile': 'public',
  'Content-Profile': 'public',
};

export async function sbFetchEmployees() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/employee?select=*&limit=1000&order=id`,
    { headers: BASE_HEADERS }
  );
  if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
  return res.json();
}

export async function sbSetEmployeeStatus(recordId, currentData, newStatus) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/employee?id=eq.${recordId}`,
    {
      method: 'PATCH',
      headers: { ...BASE_HEADERS, Prefer: 'return=minimal' },
      body: JSON.stringify({ data: { ...currentData, status: newStatus } }),
    }
  );
  return res.ok;
}
