// @ts-nocheck
import { useState, useRef } from 'react';
import { Printer, FileText, ChevronDown, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

function fmt(n) {
  if (!n && n !== 0) return '—';
  return `PHP ${Number(n).toLocaleString()}`;
}

function PosterDoc({ pkg }) {
  if (!pkg) return null;

  const dates = pkg.travel_dates || [];
  const hasMultipleRates = dates.some(d => d.use_custom_pricing && d.selling_price);

  // Group dates by selling price for display
  const rateGroups = [];
  if (hasMultipleRates) {
    const map = new Map();
    dates.forEach(d => {
      const price = d.selling_price || pkg.selling_price || 0;
      const key = String(price);
      if (!map.has(key)) map.set(key, { price, dates: [] });
      const label = d.label || d.departure_date || '';
      map.get(key).dates.push(label);
    });
    map.forEach(v => rateGroups.push(v));
  }

  const travelPeriod = dates.length
    ? dates.map(d => d.label || d.departure_date).join(' / ')
    : (pkg.departure_date || '');

  const basePrice = pkg.selling_price || pkg.rate_twin || 0;

  return (
    <div id="poster-content" className="bg-white text-black font-sans text-sm leading-relaxed">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-blue-800 leading-tight">
          {pkg.name || 'Package Name'}
        </h1>
        {basePrice > 0 && (
          <p className="text-2xl font-bold text-blue-700 mt-1">
            for as low as PHP {Number(basePrice).toLocaleString()} per pax
          </p>
        )}
      </div>

      {/* Travel Period */}
      {travelPeriod && (
        <div className="text-center mb-4">
          <p className="font-bold text-blue-800 text-base">TRAVEL PERIOD:</p>
          {rateGroups.length > 0 ? (
            rateGroups.map((g, i) => (
              <p key={i} className="text-blue-700 font-semibold text-sm">
                {g.dates.join(' / ')} {g.price !== basePrice ? `(+PHP ${Number(g.price - basePrice).toLocaleString()})` : ''}
              </p>
            ))
          ) : (
            <p className="text-blue-700 font-semibold text-sm">{travelPeriod}</p>
          )}
        </div>
      )}

      {/* Itinerary */}
      {pkg.itinerary && (
        <table className="w-full border-collapse mb-4 text-xs">
          <thead>
            <tr>
              <td colSpan={2} className="bg-blue-800 text-white text-center font-bold py-1.5 text-sm">
                ITINERARY
              </td>
            </tr>
          </thead>
          <tbody>
            {pkg.itinerary.split(/\n(?=Day \d+)/i).map((dayBlock, idx) => {
              const lines = dayBlock.trim().split('\n');
              const title = lines[0];
              const bullets = lines.slice(1).filter(l => l.trim());
              return (
                <tr key={idx}>
                  <td className="bg-blue-700 text-white font-bold py-1 px-2 align-top whitespace-nowrap text-[11px] border border-gray-300">
                    DAY {idx + 1}
                  </td>
                  <td className="border border-gray-300 px-3 py-1.5 align-top">
                    <p className="font-bold text-blue-800 text-[11px] uppercase">{title.replace(/^Day \d+\s*[–-]?\s*/i, '')}</p>
                    <ul className="mt-0.5 space-y-0.5">
                      {bullets.map((b, bi) => (
                        <li key={bi} className="flex gap-1.5 text-[11px]">
                          <span className="flex-shrink-0">•</span>
                          <span>{b.replace(/^[•\-\*]\s*/, '')}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Flight Details */}
      {pkg.flight_details && (
        <table className="w-full border-collapse mb-4 text-xs">
          <thead>
            <tr>
              <td className="bg-gray-200 text-center font-bold py-1.5 border border-gray-300">
                FLIGHT DETAILS
              </td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-4 py-3 text-center whitespace-pre-line text-[11px]">
                {pkg.flight_details}
              </td>
            </tr>
          </tbody>
        </table>
      )}

      {/* Rates box */}
      <div className="border-2 border-blue-800 rounded p-4 mb-4 text-center">
        {rateGroups.length > 0 ? (
          rateGroups.map((g, i) => (
            <div key={i} className="mb-2">
              <p className="font-bold text-blue-800 text-sm">{g.dates.join(' / ')}</p>
              <p className="text-sm">Adult & Child Rate: <strong>PHP {Number(g.price).toLocaleString()} per pax</strong></p>
            </div>
          ))
        ) : (
          <>
            {(pkg.selling_price || pkg.rate_twin) > 0 && (
              <p className="text-sm">Adult & Child Rate: <strong>{fmt(pkg.selling_price || pkg.rate_twin)} per pax</strong></p>
            )}
          </>
        )}
        {pkg.rate_single_supplement > 0 && (
          <p className="text-sm">Single Supplement: <strong>{fmt(pkg.rate_single_supplement)} per pax</strong></p>
        )}
        {pkg.rate_child_no_bed > 0 && (
          <p className="text-sm">Child w/o Bed: <strong>{fmt(pkg.rate_child_no_bed)} per pax</strong></p>
        )}
        {pkg.downpayment_required > 0 && (
          <p className="font-bold text-blue-800 mt-2">DOWN PAYMENT: {fmt(pkg.downpayment_required)} PER PAX</p>
        )}
        {pkg.commission_amount > 0 && (
          <p className="font-bold text-blue-800">COMMISSION: {fmt(pkg.commission_amount)}</p>
        )}
      </div>

      {/* Inclusions & Exclusions */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {pkg.inclusions && (
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <td className="bg-blue-800 text-white text-center font-bold py-1.5">INCLUSION</td>
              </tr>
            </thead>
            <tbody>
              {pkg.inclusions.split('\n').filter(l => l.trim()).map((line, i) => (
                <tr key={i}>
                  <td className="border border-gray-300 px-3 py-1 text-[11px]">
                    - {line.replace(/^[-•*]\s*/, '')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {pkg.exclusions && (
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <td className="bg-blue-800 text-white text-center font-bold py-1.5">EXCLUSION</td>
              </tr>
            </thead>
            <tbody>
              {pkg.exclusions.split('\n').filter(l => l.trim()).map((line, i) => (
                <tr key={i}>
                  <td className="border border-gray-300 px-3 py-1 text-[11px]">
                    - {line.replace(/^[-•*]\s*/, '')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Terms */}
      {pkg.terms_conditions && (
        <table className="w-full border-collapse mb-4 text-xs">
          <thead>
            <tr>
              <td className="bg-gray-200 text-center font-bold py-1.5 border border-gray-300">
                TERMS AND CONDITIONS
              </td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-3 py-2 whitespace-pre-line text-[11px]">
                {pkg.terms_conditions}
              </td>
            </tr>
          </tbody>
        </table>
      )}

      {/* Footer */}
      <div className="text-center text-[10px] text-gray-500 mt-6 border-t pt-3">
        <p className="font-bold">ALL RATES ARE EXCLUSIVE OF VAT</p>
        <p className="mt-1">GLADEX Tours — Generated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>
    </div>
  );
}

export default function CreatePoster({ collectives = [] }) {
  const [selectedId, setSelectedId] = useState('');
  const pkg = collectives.find(c => c.id === selectedId) || null;

  function handlePrint() {
    const content = document.getElementById('poster-content');
    if (!content) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${pkg?.name || 'Package Document'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 12px; color: #000; padding: 20px; }
          h1 { font-size: 28px; font-weight: bold; color: #1e40af; text-align: center; }
          h2 { font-size: 22px; font-weight: bold; color: #1e40af; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          td, th { border: 1px solid #ccc; padding: 4px 8px; font-size: 11px; }
          .bg-blue { background: #1e40af; color: white; text-align: center; font-weight: bold; padding: 6px; }
          .bg-gray { background: #e5e7eb; text-align: center; font-weight: bold; padding: 6px; }
          .rate-box { border: 2px solid #1e40af; border-radius: 4px; padding: 12px; text-align: center; margin-bottom: 12px; }
          .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
          ul { margin-left: 12px; }
          li { margin-bottom: 2px; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[220px] max-w-sm">
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Select a package to generate document…" />
            </SelectTrigger>
            <SelectContent>
              {collectives.map(c => (
                <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {pkg && (
          <Button size="sm" className="gradient-gold text-white border-0 gap-1.5 text-xs" onClick={handlePrint}>
            <Printer className="w-3.5 h-3.5" /> Print / Save as PDF
          </Button>
        )}
      </div>

      {/* Empty state */}
      {!pkg && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border-2 border-dashed border-border rounded-xl">
          <FileText className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-sm font-medium text-foreground">Select a package to preview the document</p>
          <p className="text-xs mt-1">Generates a formatted travel document ready to print or save as PDF</p>
        </div>
      )}

      {/* Document preview */}
      {pkg && (
        <div className="border border-border rounded-xl overflow-hidden shadow-sm">
          {/* Preview header */}
          <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-b border-border">
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Document Preview — {pkg.name}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Print → "Save as PDF" in your browser</span>
          </div>
          {/* White page preview */}
          <div className="bg-white p-8 overflow-auto max-h-[70vh]">
            <PosterDoc pkg={pkg} />
          </div>
        </div>
      )}
    </div>
  );
}
