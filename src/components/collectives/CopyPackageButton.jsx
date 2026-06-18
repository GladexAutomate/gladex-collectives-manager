import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// ── Format a collective/package into clean copy-paste text ──────────────────
export function formatPackageForCopy(pkg) {
  const parts = [];

  // Name
  const name = pkg.name || pkg.destination || 'Unnamed Package';
  parts.push(`PACKAGE NAME: ${name.toUpperCase()}`);
  parts.push('');

  // Destination
  if (pkg.destination) {
    parts.push(`DESTINATION:`);
    parts.push(pkg.destination);
    parts.push('');
  }

  // Travel Dates – prefer travel_dates array, fallback to single dates
  const dates = pkg.travel_dates?.length
    ? pkg.travel_dates.map(d => {
        const label = d.label || '';
        const dep = d.departure_date ? new Date(d.departure_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
        const ret = d.return_date ? new Date(d.return_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
        return [label, dep, ret].filter(Boolean).join(' — ') || [dep, ret].filter(Boolean).join('–');
      }).filter(Boolean)
    : [];
  if (dates.length) {
    parts.push(`TRAVEL DATES:`);
    dates.forEach(d => parts.push(d));
    parts.push('');
  } else {
    const dep = pkg.departure_date
      ? new Date(pkg.departure_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '';
    const ret = pkg.return_date
      ? new Date(pkg.return_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '';
    if (dep || ret) {
      parts.push(`TRAVEL DATES:`);
      parts.push(`${dep}${ret ? ' – ' + ret : ''}`);
      parts.push('');
    }
  }

  // Operator / Airline
  if (pkg.operator_name) {
    parts.push(pkg.travel_type === 'domestic' ? `OPERATOR:` : `OPERATOR:`);
    parts.push(pkg.operator_name);
    parts.push('');
  }
  if (pkg.flight_details) {
    parts.push(`FLIGHT / AIRLINE:`);
    parts.push(pkg.flight_details);
    parts.push('');
  }

  // Hotel
  if (pkg.hotel_details) {
    parts.push(`HOTEL:`);
    parts.push(pkg.hotel_details);
    parts.push('');
  }

  // Currency
  const currency = pkg.base_price_currency || pkg.currency || 'PHP';
  const currMap = { PHP: '₱', USD: '$', EUR: '€', JPY: '¥', KRW: '₩', SGD: 'S$', HKD: 'HK$', AUD: 'A$' };

  // Price
  const price = Number(pkg.selling_price || pkg.base_price || pkg.base_price_php || 0);
  if (price > 0) {
    const sym = currMap[currency] || currency;
    parts.push(`PRICE:`);
    parts.push(`${sym} ${price.toLocaleString('en-US')} per person`);
    parts.push('');
  }

  // Commission
  const commission = Number(pkg.commission_amount || pkg.commission_per_pax || 0);
  if (commission > 0) {
    parts.push(`COMMISSION:`);
    parts.push(`₱ ${commission.toLocaleString('en-US')}`);
    parts.push('');
  }

  // Downpayment
  const dp = Number(pkg.downpayment_required || 0);
  if (dp > 0) {
    parts.push(`DOWNPAYMENT:`);
    parts.push(`₱ ${dp.toLocaleString('en-US')}`);
    parts.push('');
  }

  // Inclusions
  if (pkg.inclusions?.trim()) {
    parts.push(`PACKAGE INCLUSIONS:`);
    pkg.inclusions.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed) parts.push(trimmed.startsWith('•') || trimmed.startsWith('-') ? trimmed : `• ${trimmed}`);
    });
    parts.push('');
  }

  // Exclusions
  if (pkg.exclusions?.trim()) {
    parts.push(`PACKAGE EXCLUSIONS:`);
    pkg.exclusions.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed) parts.push(trimmed.startsWith('•') || trimmed.startsWith('-') ? trimmed : `• ${trimmed}`);
    });
    parts.push('');
  }

  // Optional Tours
  if (pkg.optional_tours?.trim()) {
    parts.push(`OPTIONAL TOURS:`);
    pkg.optional_tours.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed) parts.push(trimmed.startsWith('•') || trimmed.startsWith('-') ? trimmed : `• ${trimmed}`);
    });
    parts.push('');
  }

  // Cancellation
  if (pkg.cancellation_policy?.trim()) {
    parts.push(`CANCELLATION POLICY:`);
    parts.push(pkg.cancellation_policy.trim());
    parts.push('');
  }

  // Remarks
  if (pkg.remarks?.trim()) {
    parts.push(`REMARKS:`);
    parts.push(pkg.remarks.trim());
    parts.push('');
  }

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