// @ts-nocheck
import { Copy, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState } from 'react';

// ── Smart date range: "Jun 22–26, 2026" instead of "Jun 22 – Jun 26 — Jun 22, 2026 — Jun 26, 2026" ──
function formatDateRange(dep, ret) {
  if (!dep && !ret) return '';
  const df = { month: 'short', day: 'numeric', year: 'numeric' };
  const dD = dep ? new Date(dep + 'T00:00:00') : null;
  const dR = ret ? new Date(ret + 'T00:00:00') : null;
  if (!dD) return dR.toLocaleDateString('en-US', df);
  if (!dR) return dD.toLocaleDateString('en-US', df);
  // same month & year → "Jun 22–26, 2026"
  if (dD.getMonth() === dR.getMonth() && dD.getFullYear() === dR.getFullYear()) {
    const month = dD.toLocaleDateString('en-US', { month: 'short' });
    return `${month} ${dD.getDate()}–${dR.getDate()}, ${dD.getFullYear()}`;
  }
  // same year → "Jun 22 – Jul 5, 2026"
  if (dD.getFullYear() === dR.getFullYear()) {
    const mD = dD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const mR = dR.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${mD} – ${mR}, ${dD.getFullYear()}`;
  }
  return `${dD.toLocaleDateString('en-US', df)} – ${dR.toLocaleDateString('en-US', df)}`;
}

// ── Parse itinerary text into day-by-day sections ──
function parseItineraryDays(raw) {
  if (!raw?.trim()) return null;
  // Split on "Day" patterns like "Day 1", "Day 1 –", "DAY 1:", etc.
  const dayPattern = /(?:^|\n)(?=Day\s*\d+)/gi;
  const segments = raw.split(dayPattern).filter(Boolean);
  // If no day headers found, return as single block
  if (segments.length <= 1) {
    // Try to find any day-like structure
    const lines = raw.split('\n').filter(l => l.trim());
    if (lines.length === 0) return null;
    return [{ label: 'ITINERARY', body: lines.join('\n').trim() }];
  }
  return segments.map(s => {
    const sTrim = s.trim();
    const firstNewline = sTrim.indexOf('\n');
    const header = firstNewline > 0 ? sTrim.substring(0, firstNewline).trim() : sTrim;
    const body = firstNewline > 0 ? sTrim.substring(firstNewline + 1).trim() : '';
    return { label: header.toUpperCase(), body };
  });
}

// ── Format a collective/package into clean copy-paste text ──────────────────
export function formatPackageForCopy(pkg) {
  const parts = [];
  const na = 'N/A';

  const push = (label, value) => {
    if (value == null || value === '') {
      parts.push(`${label}:`);
      parts.push(na);
    } else {
      parts.push(`${label}:`);
      parts.push(String(value));
    }
    parts.push('');
  };

  // ── HEADER ──
  const name = pkg.name || pkg.package_name || pkg.destination || 'Unnamed Package';
  parts.push(`PACKAGE NAME: ${name.toUpperCase()}`);
  parts.push('');

  // ── BASIC INFO ──
  push('DESTINATION', pkg.destination);
  // PACKAGE CODE is filled in manually after pasting
  parts.push('PACKAGE CODE:');
  parts.push('');
  push('PACKAGE TYPE', pkg.travel_type === 'domestic' ? 'Domestic' : pkg.travel_type === 'international' ? 'International' : pkg.travel_type);

  // ── STATUS ──
  const statusLabels = {
    draft: 'Draft', open_booking: 'Open Booking', confirmed_departure: 'Confirmed Departure',
    ongoing: 'Ongoing', completed: 'Completed', cancelled: 'Cancelled'
  };
  push('STATUS', statusLabels[pkg.status] || pkg.status || 'Draft');
  push('TOTAL SLOTS', pkg.total_slots != null ? pkg.total_slots : null);
  push('AVAILABLE SLOTS', pkg.available_slots != null ? pkg.available_slots : null);

  // ── OPERATOR & CARRIER ──
  push('OPERATOR', pkg.operator_name);
  push('FLIGHT / AIRLINE', pkg.flight_details);
  push('HOTEL DETAILS', pkg.hotel_details);

  // ── TRAVEL DATES ──
  const tDates = pkg.travel_dates?.length
    ? pkg.travel_dates.map(d => {
        const label = d.label || '';
        const range = formatDateRange(d.departure_date, d.return_date);
        return label ? `${label}: ${range}` : range;
      }).filter(Boolean)
    : [];
  if (tDates.length > 0) {
    parts.push('TRAVEL DATES:');
    tDates.forEach(d => parts.push(d));
    parts.push('');
  } else {
    // fallback to single dates
    const range = formatDateRange(pkg.departure_date, pkg.return_date);
    if (range) { parts.push('TRAVEL DATES:'); parts.push(range); parts.push(''); }
  }

  // ── DEADLINES ──
  if (pkg.internal_deadline) push('INTERNAL DEADLINE', new Date(pkg.internal_deadline + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
  if (pkg.supplier_deadline) push('SUPPLIER DEADLINE', new Date(pkg.supplier_deadline + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));

  // ── PRICING ──
  const currency = pkg.base_price_currency || pkg.currency || 'PHP';
  const currMap = { PHP: '₱', USD: '$', EUR: '€', JPY: '¥', KRW: '₩', SGD: 'S$', HKD: 'HK$', AUD: 'A$' };
  const sym = currMap[currency] || currency;

  const baseForeign = Number(pkg.base_price_foreign || 0);
  const exRate = Number(pkg.exchange_rate || 1);
  const basePHP = Number(pkg.base_price_php || 0);
  const markup = Number(pkg.markup_amount || 0);
  const sellPrice = Number(pkg.selling_price || pkg.base_price || 0);

  if (baseForeign > 0 && currency !== 'PHP') push(`BASE PRICE (${currency})`, `${sym}${baseForeign.toLocaleString('en-US')}`);
  if (basePHP > 0 && currency !== 'PHP') push('BASE PRICE (PHP)', `₱${basePHP.toLocaleString('en-US')}`);
  if (exRate && currency !== 'PHP') push('EXCHANGE RATE', `1 ${currency} = ₱${exRate}`);
  if (markup > 0) push('MARKUP', `₱${markup.toLocaleString('en-US')}`);

  if (Number(pkg.commission_amount) > 0) push('COMMISSION', `₱${Number(pkg.commission_amount).toLocaleString('en-US')}`);
  push('DOWNPAYMENT', pkg.downpayment_required != null ? `₱${Number(pkg.downpayment_required).toLocaleString('en-US')}` : null);

  // ── OCCUPANCY RATES ──
  const rateFields = [
    ['TWIN (per pax)', pkg.rate_twin, pkg.rate_twin_age_min, pkg.rate_twin_age_max],
    ['TRIPLE (per pax)', pkg.rate_triple, pkg.rate_triple_age_min, pkg.rate_triple_age_max],
    ['QUAD (per pax)', pkg.rate_quad, pkg.rate_quad_age_min, pkg.rate_quad_age_max],
    ['SINGLE (per pax)', pkg.rate_single, pkg.rate_single_age_min, pkg.rate_single_age_max],
    ['SOLO', pkg.rate_solo, pkg.rate_solo_age_min, pkg.rate_solo_age_max],
    ['SINGLE SUPPLEMENT', pkg.rate_single_supplement],
    ['CHILD NO BED', pkg.rate_child_no_bed, pkg.rate_child_no_bed_age_min, pkg.rate_child_no_bed_age_max],
    ['CHILD WITH BED', pkg.rate_child, pkg.rate_child_age_min, pkg.rate_child_age_max],
    ['INFANT', pkg.rate_infant, pkg.rate_infant_age_min, pkg.rate_infant_age_max],
  ];

  let hasAnyRate = false;
  rateFields.forEach(([label, rate, min, max]) => {
    const num = Number(rate);
    if (num > 0) {
      hasAnyRate = true;
      let line = `₱${num.toLocaleString('en-US')}`;
      if (min != null || max != null) {
        const ageRange = [min != null ? `${min}y` : '', max != null ? `${max}y` : ''].filter(Boolean).join('–');
        if (ageRange) line += ` (Ages ${ageRange})`;
      }
      push(label, line);
    }
  });

  // (no fallback when no rates — skip silently)

  // ── CONTENT ──
  const bulletField = (label, raw) => {
    if (!raw?.trim()) { parts.push(`${label}:`); parts.push(na); parts.push(''); return; }
    parts.push(`${label}:`);
    raw.split('\n').forEach(line => {
      const t = line.trim();
      if (t) parts.push(t.startsWith('•') || t.startsWith('-') || t.startsWith('✔') || t.startsWith('✘') ? t : `• ${t}`);
    });
    parts.push('');
  };

  bulletField('PACKAGE INCLUSIONS', pkg.inclusions);
  bulletField('PACKAGE EXCLUSIONS', pkg.exclusions);
  bulletField('OPTIONAL TOURS', pkg.optional_tours);

  // ── ITINERARY ──
  const days = parseItineraryDays(pkg.itinerary);
  if (days) {
    days.forEach(d => {
      parts.push(d.label);
      if (d.body) parts.push(d.body);
      parts.push('');
    });
  } else {
    push('ITINERARY', null);
  }

  // ── OTHER CONTENT ──
  push('TERMS & CONDITIONS', pkg.terms_conditions);
  push('CANCELLATION POLICY', pkg.cancellation_policy);
  push('REMARKS', pkg.remarks);

  // ── SLOT FLAGS ──
  if (pkg.slots_for_confirmation) push('SLOT TYPE', 'For Confirmation (on-request)');
  if (pkg.guaranteed_departure) push('GUARANTEED DEPARTURE', 'Yes');

  return parts.join('\n').trim();
}

// ── Copy button component ────────────────────────────────────────────────────
export default function CopyPackageButton({ pkg, size, variant, className }) {
  const handleCopy = async () => {
    const text = formatPackageForCopy(pkg);
    await navigator.clipboard.writeText(text);
    toast.success('Package details copied successfully!', { duration: 2500 });
  };

  // iconSm is a tiny icon-only button (not a standard shadcn size)
  if (size === 'iconSm') {
    return (
      <button
        onClick={e => { e.stopPropagation(); handleCopy(); }}
        className={className}
        title="Copy package details"
      >
        <Copy className="w-3 h-3" />
      </button>
    );
  }

  return (
    <Button
      size={size || 'sm'}
      variant={variant || 'ghost'}
      className={className}
      onClick={handleCopy}
      title="Copy package details"
    >
      <Copy className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Copy</span>
    </Button>
  );
}

// ── Raw JSON Viewer toggle (for admin debug) ─────────────────────────────────
export function RawPackageJSON({ pkg }) {
  const [open, setOpen] = useState(false);
  if (!pkg) return null;
  const cleanPkg = { ...pkg };
  // Remove large internal fields if they're huge
  const json = JSON.stringify(cleanPkg, null, 2);

  return (
    <div className="mt-3 border-t border-border pt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
        {open ? 'Hide Raw JSON' : 'View Raw Package JSON'}
      </button>
      {open && (
        <pre className="mt-2 bg-muted/50 border border-border rounded-lg p-3 text-[10px] font-mono text-muted-foreground max-h-64 overflow-auto whitespace-pre-wrap">
          {json}
        </pre>
      )}
    </div>
  );
}