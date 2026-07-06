// @ts-nocheck
import { Copy, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState } from 'react';
import { pkgCodeStore } from '@/lib/packageCodeStore';

// ── Short date for grouping header: "SEP 10-14, 2026" ──
function formatShortDateRange(dep, ret) {
  if (!dep) return '';
  const dD = new Date(dep + 'T00:00:00');
  const dR = ret ? new Date(ret + 'T00:00:00') : null;
  const mo = (d) => d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const dd = (d) => String(d.getDate()).padStart(2, '0');
  if (!dR) return `${mo(dD)} ${dd(dD)}, ${dD.getFullYear()}`;
  if (dD.getMonth() === dR.getMonth() && dD.getFullYear() === dR.getFullYear()) {
    return `${mo(dD)} ${dd(dD)}-${dd(dR)}, ${dD.getFullYear()}`;
  }
  return `${mo(dD)} ${dd(dD)}-${mo(dR)} ${dd(dR)}, ${dD.getFullYear()}`;
}

// ── Get effective rates for a travel_date (falls back to package-level) ──
function getEffectiveRates(d, pkg) {
  const uc = !!d.use_custom_pricing;
  const n = (v) => Number(v) || 0;
  return {
    adult: n(d.selling_price) || n(uc ? d.rate_twin : pkg.rate_twin),
    triple: n(uc ? d.rate_triple : pkg.rate_triple),
    quad: n(uc ? d.rate_quad : pkg.rate_quad),
    single: n(uc ? d.rate_single : pkg.rate_single),
    solo: n(uc ? d.rate_solo : pkg.rate_solo),
    single_supplement: n(uc ? d.rate_single_supplement : pkg.rate_single_supplement),
    child_no_bed: n(uc ? d.rate_child_no_bed : pkg.rate_child_no_bed),
    child_no_bed_age_min: pkg.rate_child_no_bed_age_min,
    child_no_bed_age_max: pkg.rate_child_no_bed_age_max,
    child: n(uc ? d.rate_child : pkg.rate_child),
    child_age_min: pkg.rate_child_age_min,
    child_age_max: pkg.rate_child_age_max,
    infant: n(uc ? d.rate_infant : pkg.rate_infant),
    infant_age_min: pkg.rate_infant_age_min,
    infant_age_max: pkg.rate_infant_age_max,
  };
}

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
export function formatPackageForCopy(pkg, packageCode = '') {
  const parts = [];

  // Inline push: LABEL: value on one line (no emoji on individual lines)
  const line = (label, value) => {
    if (value == null || value === '' || value === 0 || value === '0') return;
    parts.push(`${label}: ${String(value)}`);
  };

  // Section divider — emoji only here
  const divider = (emoji, title) => {
    parts.push('');
    parts.push(`${emoji} ━━━━━━━━━━━━━━ ${title} ━━━━━━━━━━━━━━`);
  };

  // ── HEADER ──
  const name = pkg.name || pkg.package_name || pkg.destination || 'Unnamed Package';
  parts.push('╔══════════════════════════════════════╗');
  parts.push(`  ✈️  ${name.toUpperCase()}`);
  parts.push('╚══════════════════════════════════════╝');
  parts.push('');

  // ── BASIC INFO ──
  divider('📋', 'PACKAGE DETAILS');
  parts.push('');
  line('DESTINATION', pkg.destination);
  if (packageCode) parts.push(`PACKAGE CODE: ${packageCode}`);
  line('PACKAGE TYPE', pkg.travel_type === 'domestic' ? 'Domestic' : pkg.travel_type === 'international' ? 'International' : pkg.travel_type);
  const statusLabels = { draft: 'Draft', open_booking: 'Open Booking', confirmed_departure: 'Confirmed Departure', ongoing: 'Ongoing', completed: 'Completed', cancelled: 'Cancelled' };
  line('STATUS', statusLabels[pkg.status] || pkg.status || 'Draft');
  if (pkg.nights) line('DURATION', `${pkg.nights} nights`);
  if (pkg.guaranteed_departure) parts.push('GUARANTEED DEPARTURE: Yes');
  if (pkg.slots_for_confirmation) parts.push('SLOT TYPE: For Confirmation (on-request)');
  if (Number(pkg.downpayment_required) > 0) {
    const dpAmt = Number(pkg.downpayment_required);
    parts.push(`DOWNPAYMENT: ₱${dpAmt.toLocaleString()} per pax`);
  }

  // ── TRAVEL DATES & RATES (grouped by rate set) ──
  if (pkg.travel_dates?.length > 0) {
    const groups = new Map();
    const groupOrder = [];
    pkg.travel_dates.forEach(d => {
      const r = getEffectiveRates(d, pkg);
      const key = [r.adult, r.triple, r.quad, r.single, r.solo, r.single_supplement, r.child_no_bed, r.child, r.infant].join('|');
      if (!groups.has(key)) { groups.set(key, { r, dates: [] }); groupOrder.push(key); }
      groups.get(key).dates.push(formatShortDateRange(d.departure_date, d.return_date));
    });

    divider('📅', 'TRAVEL DATES & RATES');
    parts.push('');

    const fmtAmt = v => `₱${Number(v).toLocaleString('en-US')}`;
    const ageTag = (mn, mx) => {
      const hasMin = mn !== null && mn !== undefined && mn !== '' && !isNaN(Number(mn));
      const hasMax = mx !== null && mx !== undefined && mx !== '' && !isNaN(Number(mx));
      if (!hasMin && !hasMax) return '';
      const r2 = [hasMin ? `${Number(mn)}` : '', hasMax ? `${Number(mx)}` : ''].filter(Boolean).join('-');
      return ` (${r2} yrs old)`;
    };

    groupOrder.forEach(key => {
      const { r, dates } = groups.get(key);
      parts.push(`🔸 ${dates.join(' / ')}`);
      parts.push('');
      if (r.adult > 0) parts.push(`   Adult Rate: ${fmtAmt(r.adult)} per pax`);
      if (r.triple > 0) parts.push(`   Triple Sharing: ${fmtAmt(r.triple)} per pax`);
      if (r.quad > 0) parts.push(`   Quad Sharing: ${fmtAmt(r.quad)} per pax`);
      if (r.single > 0) parts.push(`   Single Occupancy: ${fmtAmt(r.single)} per pax`);
      if (r.solo > 0) parts.push(`   Solo Rate: ${fmtAmt(r.solo)} per pax`);
      if (r.single_supplement > 0) parts.push(`   Single Supplement: ${fmtAmt(r.single_supplement)} per pax`);
      if (r.child_no_bed > 0) parts.push(`   Child W/o Bed${ageTag(r.child_no_bed_age_min, r.child_no_bed_age_max)}: ${fmtAmt(r.child_no_bed)} per pax`);
      if (r.child > 0) parts.push(`   Child W/ Bed${ageTag(r.child_age_min, r.child_age_max)}: ${fmtAmt(r.child)} per pax`);
      if (r.infant > 0) parts.push(`   Infant Fee${ageTag(r.infant_age_min, r.infant_age_max)}: ${fmtAmt(r.infant)} per pax`);
      parts.push('');
    });
  } else {
    // No travel_dates — old format: separate dates then rates
    const singleRange = formatDateRange(pkg.departure_date, pkg.return_date);
    if (singleRange) {
      divider('📅', 'TRAVEL DATES');
      parts.push('');
      parts.push(`  ${singleRange}`);
    }

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
    const rateLines = [];
    rateFields.forEach(([label, rate, min, max]) => {
      const num = Number(rate);
      if (num > 0) {
        let val = `₱${num.toLocaleString('en-US')}`;
        const hasMin = min !== null && min !== undefined && min !== '' && !isNaN(Number(min));
        const hasMax = max !== null && max !== undefined && max !== '' && !isNaN(Number(max));
        if (hasMin || hasMax) {
          const ageRange = [hasMin ? `${Number(min)}` : '', hasMax ? `${Number(max)}` : ''].filter(Boolean).join('–');
          if (ageRange) val += ` (Ages ${ageRange})`;
        }
        rateLines.push(`${label}: ${val}`);
      }
    });
    if (rateLines.length > 0) {
      divider('🛏️', 'PACKAGE RATES');
      parts.push('');
      rateLines.forEach(r => parts.push(r));
    }
  }

  // ── DEADLINES ──
  if (pkg.internal_deadline || pkg.supplier_deadline) {
    parts.push('');
    if (pkg.internal_deadline) line('INTERNAL DEADLINE', new Date(pkg.internal_deadline + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
    if (pkg.supplier_deadline) line('SUPPLIER DEADLINE', new Date(pkg.supplier_deadline + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
  }

  // ── CONTENT ──
  const bulletSection = (emoji, title, raw) => {
    if (!raw?.trim()) return;
    divider(emoji, title);
    parts.push('');
    raw.split('\n').forEach(l => {
      const t = l.trim();
      if (t) parts.push(t.startsWith('•') || t.startsWith('-') || t.startsWith('✔') || t.startsWith('✘') ? t : `• ${t}`);
    });
  };

  bulletSection('✈️', 'FLIGHT DETAILS', pkg.flight_details);
  bulletSection('🏨', 'HOTEL DETAILS', pkg.hotel_details);
  bulletSection('✅', 'PACKAGE INCLUSIONS', pkg.inclusions);
  bulletSection('❌', 'PACKAGE EXCLUSIONS', pkg.exclusions);
  bulletSection('🎯', 'OPTIONAL TOURS', pkg.optional_tours);

  // ── ITINERARY ──
  const days = parseItineraryDays(pkg.itinerary);
  if (days) {
    divider('🗺️', 'ITINERARY');
    parts.push('');
    days.forEach(d => {
      parts.push(d.label);
      if (d.body) parts.push(d.body);
      parts.push('');
    });
  }

  // ── OTHER CONTENT ──
  if (pkg.terms_conditions?.trim()) { divider('📜', 'TERMS & CONDITIONS'); parts.push(''); parts.push(pkg.terms_conditions.trim()); }
  if (pkg.cancellation_policy?.trim()) { divider('⚠️', 'CANCELLATION POLICY'); parts.push(''); parts.push(pkg.cancellation_policy.trim()); }
  if (pkg.remarks?.trim()) { divider('📝', 'REMARKS'); parts.push(''); parts.push(pkg.remarks.trim()); }

  parts.push('');
  parts.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return parts.join('\n').trim();
}

// ── Copy button component ────────────────────────────────────────────────────
export default function CopyPackageButton({ pkg, size, variant, className }) {
  const handleCopy = async () => {
    const code = pkg?.package_code || pkgCodeStore.get(pkg?.id) || '';
    const text = formatPackageForCopy(pkg, code);
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