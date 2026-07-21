// @ts-nocheck
// Supabase data layer — wraps REST API to match base44 entity interface.
// Usage: import { db } from '@/lib/db'
//        db.Collective.list('-created_date')
//        db.ChecklistTask.filter({ collective_id: id })
//        db.Notification.create({ title, message, ... })

const SUPABASE_URL = 'https://wuymgnqpkgxxxghvgcbq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_R5jGhsaREPJ427X1bRnpog_Iz7odR95';

const HEADERS = {
  apikey:            SUPABASE_KEY,
  Authorization:     `Bearer ${SUPABASE_KEY}`,
  'Content-Type':    'application/json',
  'Accept-Profile':  'public',
  'Content-Profile': 'public',
  Prefer:            'return=representation',
};

function makeEntity(table) {
  const base = `${SUPABASE_URL}/rest/v1/${table}`;

  return {
    // list('-created_date', 500) — orderBy prefix '-' means descending
    async list(orderBy = '-created_date', limit = 500) {
      const asc = !orderBy.startsWith('-');
      const col = orderBy.replace(/^-/, '');
      const url = `${base}?select=*&order=${col}.${asc ? 'asc' : 'desc'}&limit=${limit}`;
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) throw new Error(`${table}.list failed: ${res.status}`);
      return res.json();
    },

    // get(id) — returns single record or null
    async get(id) {
      const url = `${base}?id=eq.${encodeURIComponent(id)}&select=*`;
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) throw new Error(`${table}.get failed: ${res.status}`);
      const rows = await res.json();
      return rows[0] || null;
    },

    // filter({ collective_id: 'abc', department: 'marketing' }) — WHERE clause
    async filter(conditions) {
      const params = Object.entries(conditions)
        .map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`)
        .join('&');
      const url = `${base}?${params}&select=*&limit=2000`;
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) throw new Error(`${table}.filter failed: ${res.status}`);
      return res.json();
    },

    // create(payload) — returns the inserted record
    async create(payload) {
      const res = await fetch(base, {
        method:  'POST',
        headers: HEADERS,
        body:    JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`${table}.create failed: ${res.status}`);
      const rows = await res.json();
      return Array.isArray(rows) ? rows[0] : rows;
    },

    // update(id, payload) — returns the updated record
    async update(id, payload) {
      const res = await fetch(`${base}?id=eq.${encodeURIComponent(id)}`, {
        method:  'PATCH',
        headers: HEADERS,
        body:    JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`${table}.update failed: ${res.status}`);
      const rows = await res.json();
      return Array.isArray(rows) ? rows[0] : rows;
    },

    // delete(id)
    async delete(id) {
      const res = await fetch(`${base}?id=eq.${encodeURIComponent(id)}`, {
        method:  'DELETE',
        headers: { ...HEADERS, Prefer: 'return=minimal' },
      });
      if (!res.ok) throw new Error(`${table}.delete failed: ${res.status}`);
    },
  };
}

export const db = {
  Collective:     makeEntity('collectives'),
  ChecklistTask:  makeEntity('checklist_tasks'),
  MarketingAsset: makeEntity('marketing_assets'),
  Notification:   makeEntity('notifications'),
};
