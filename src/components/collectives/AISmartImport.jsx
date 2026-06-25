// @ts-nocheck
import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Upload, Loader2, CheckCircle, AlertCircle, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AISmartImport({ onParsed, onClose }) {
  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const handleParse = async (inputText) => {
    const content = inputText || text;
    if (!content.trim()) return;
    setParsing(true);
    setError(null);
    setResult(null);
    const today = new Date().toISOString().split('T')[0];
    try {
      const parsed = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert travel package data extractor for a Philippine travel agency system called GLADEX.
Today's date is ${today}.

Analyze the following raw input (itinerary, quotation, hotel breakdown, package description, or any travel-related text) and extract ALL relevant package data.

INPUT:
${content}

Return ONLY a valid JSON object with these exact fields (use null for fields not found — never guess):

BASIC INFO:
- name: package name/title (string)
- destination: destination country/city (string)
- travel_type: "domestic" if Philippines destination, "international" otherwise (string)
- operator_name: tour operator or DMC name (string)
- nights: number of nights (number, e.g. 4D3N → 3)

DATES:
- departure_date: YYYY-MM-DD. If a specific date is mentioned use it. If only duration is given (e.g. "4D3N"), estimate based on today (${today}) plus reasonable lead time (about 3 months). (string)
- return_date: YYYY-MM-DD. departure_date + nights. (string)

PRICING:
- currency: currency code — PHP if prices shown in ₱, USD if $, KRW if ₩, JPY if ¥, etc. (string)
- base_price: base cost price as a plain number, no symbols (number)
- selling_price: selling/retail price per pax as a plain number (number)
- commission_amount: commission value as a plain number (number)
- downpayment_required: downpayment amount as a plain number (number)
- rate_twin: twin-sharing rate per pax (number)
- rate_triple: triple-sharing rate per pax (number)
- rate_quad: quad-sharing rate per pax (number)
- rate_single: single room rate per pax (number)
- rate_child_no_bed: child no bed rate (number)
- rate_infant: infant rate (number)
- rate_single_supplement: single supplement add-on (number)

LOGISTICS:
- total_slots: total available slots/pax (number)
- guaranteed_departure: true if "guaranteed departure" or "GD" is mentioned (boolean)
- flight_details: airline codes, flight numbers, routes, schedules as text (string)
- hotel_details: hotel names, star ratings, check-in/out, room types as text (string)

CONTENT:
- inclusions: bullet list of what is INCLUDED (NOT the daily itinerary — only package inclusions like airfare, hotel, meals, etc.) (string)
- exclusions: bullet list of what is NOT included (string)
- itinerary: complete day-by-day itinerary formatted as:
  "Day 1 – [Title]\\n• Activity 1\\n• Activity 2\\n\\nDay 2 – [Title]\\n• Activity 1\\n..."
  Extract ALL days. Do NOT put this in inclusions. (string)
- optional_tours: optional add-on tours or activities (string)
- cancellation_policy: cancellation and refund terms (string)
- terms_conditions: booking terms, payment terms, general conditions (string)
- remarks: marketing description or additional notes (string)

RULES:
- Philippine peso: ₱65,000 = 65000 (no commas, no symbols)
- "4D3N" = 4 days, 3 nights → nights = 3
- Korea/Japan/Europe/etc = international; Philippines = domestic
- Keep inclusions SEPARATE from itinerary — inclusions are amenities (airfare, hotel, meals), itinerary is the day-by-day schedule
- For prices: look for ₱, $, "per pax", "per person", rate tables
- If a field genuinely cannot be determined from the text, return null — do not fabricate`,

        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            destination: { type: "string" },
            travel_type: { type: "string" },
            operator_name: { type: "string" },
            nights: { type: "number" },
            departure_date: { type: "string" },
            return_date: { type: "string" },
            currency: { type: "string" },
            base_price: { type: "number" },
            selling_price: { type: "number" },
            commission_amount: { type: "number" },
            downpayment_required: { type: "number" },
            rate_twin: { type: "number" },
            rate_triple: { type: "number" },
            rate_quad: { type: "number" },
            rate_single: { type: "number" },
            rate_child_no_bed: { type: "number" },
            rate_infant: { type: "number" },
            rate_single_supplement: { type: "number" },
            total_slots: { type: "number" },
            guaranteed_departure: { type: "boolean" },
            flight_details: { type: "string" },
            hotel_details: { type: "string" },
            inclusions: { type: "string" },
            exclusions: { type: "string" },
            itinerary: { type: "string" },
            optional_tours: { type: "string" },
            cancellation_policy: { type: "string" },
            terms_conditions: { type: "string" },
            remarks: { type: "string" },
          }
        }
      });

      const clean = Object.fromEntries(
        Object.entries(parsed).filter(([, v]) => v !== null && v !== undefined && v !== '')
      );
      setResult(clean);
    } catch (e) {
      setError('AI parsing failed. Please try again.');
    }
    setParsing(false);
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setParsing(true);
    setError(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            raw_text: { type: "string", description: "All text content from the document" }
          }
        }
      });
      const rawText = extracted?.output?.raw_text || JSON.stringify(extracted?.output || '');
      setText(rawText);
      await handleParse(rawText);
    } catch (e) {
      setError('File parsing failed. Try pasting the text directly.');
      setParsing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const applyAndClose = () => {
    if (result) { onParsed(result); onClose(); }
  };

  const PREVIEW_FIELDS = [
    { key: 'name', label: 'Package' },
    { key: 'destination', label: 'Destination' },
    { key: 'departure_date', label: 'Departure' },
    { key: 'return_date', label: 'Return' },
    { key: 'nights', label: 'Nights' },
    { key: 'currency', label: 'Currency' },
    { key: 'selling_price', label: 'Price', format: v => `₱${Number(v).toLocaleString()}` },
    { key: 'rate_twin', label: 'Twin Rate', format: v => `₱${Number(v).toLocaleString()}` },
    { key: 'operator_name', label: 'Operator' },
    { key: 'total_slots', label: 'Slots' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg gradient-gold flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">AI Smart Import</p>
          <p className="text-xs text-muted-foreground">Paste any package details — AI fills all fields including itinerary, rates, and dates</p>
        </div>
      </div>

      {/* Drop zone + textarea */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-colors",
          dragOver ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20" : "border-border hover:border-amber-300"
        )}
      >
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={`Paste package details here — itinerary, quotation, hotel list, anything.\n\nExample:\nKorea Autumn 2026 – 4D3N\nDeparture: October 15, 2026\nLotte Hotel Seoul (3 nights)\n₱65,000/pax twin sharing · ₱75,000 single\n\nInclusions: Airfare, Hotel, Breakfast\nExclusions: Visa, Personal expenses\n\nDay 1 – Arrival Seoul\n• Airport pickup, check-in hotel\n• Welcome dinner at Myeongdong\n\nDay 2 – Nami Island + Petite France\n• Everland theme park\n...`}
          className="w-full h-52 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 p-3 resize-none focus:outline-none"
        />
        {dragOver && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-amber-50/80 dark:bg-amber-950/40">
            <p className="text-sm font-medium text-amber-600">Drop file here</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <input ref={fileRef} type="file" accept=".pdf,.docx,.xlsx,.csv,.txt" className="hidden" onChange={e => handleFileUpload(e.target.files[0])} />
        <Button size="sm" variant="outline" className="text-xs gap-1.5 flex-1" onClick={() => fileRef.current?.click()} disabled={parsing}>
          <Upload className="w-3.5 h-3.5" /> Upload File
        </Button>
        <Button size="sm" className="gradient-gold text-white border-0 text-xs gap-1.5 flex-1" onClick={() => handleParse()} disabled={parsing || !text.trim()}>
          {parsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {parsing ? 'Extracting all fields...' : 'Parse with AI'}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/20 rounded-lg border border-rose-200 dark:border-rose-900">
          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <p className="text-xs text-rose-600">{error}</p>
        </div>
      )}

      {/* Result preview */}
      {result && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                AI Parsed — {Object.keys(result).length} fields extracted
              </p>
            </div>
            <button onClick={() => setResult(null)} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Key fields preview */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            {PREVIEW_FIELDS.map(({ key, label, format }) =>
              result[key] != null ? (
                <div key={key} className="flex gap-1.5">
                  <span className="text-muted-foreground flex-shrink-0">{label}:</span>
                  <span className="font-medium text-foreground truncate">
                    {format ? format(result[key]) : String(result[key])}
                  </span>
                </div>
              ) : null
            )}
          </div>

          {/* Extracted field tags */}
          <div className="flex items-center gap-1 flex-wrap">
            {Object.keys(result).map(k => (
              <span key={k} className={cn(
                "text-[10px] px-1.5 py-0.5 rounded font-medium",
                ['itinerary', 'inclusions', 'exclusions', 'terms_conditions', 'cancellation_policy'].includes(k)
                  ? "bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400"
                  : ['departure_date', 'return_date', 'nights'].includes(k)
                  ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400"
                  : ['selling_price', 'rate_twin', 'rate_triple', 'rate_quad', 'rate_single', 'base_price'].includes(k)
                  ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400"
                  : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
              )}>
                ✓ {k.replace(/_/g, ' ')}
              </span>
            ))}
          </div>

          {result.itinerary && (
            <div className="bg-white dark:bg-background/40 rounded-lg border border-emerald-200 p-3">
              <p className="text-[10px] font-semibold text-emerald-700 mb-1">Itinerary Preview</p>
              <p className="text-[11px] text-muted-foreground whitespace-pre-line line-clamp-6">{result.itinerary}</p>
            </div>
          )}

          <Button size="sm" className="w-full gradient-gold text-white border-0 gap-2" onClick={applyAndClose}>
            <FileText className="w-3.5 h-3.5" /> Apply All Fields to Form
          </Button>
        </div>
      )}
    </div>
  );
}
