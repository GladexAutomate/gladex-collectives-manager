import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

//Create a client with authentication required
// In dev, Vite proxies /api → base44 backend (serverUrl: '').
// In production there is no proxy, so point directly to the base44 server.
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: import.meta.env.PROD ? (appBaseUrl || 'https://app.base44.com') : '',
  requiresAuth: false,
  appBaseUrl
});
