import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Upload, ClipboardPaste, Loader2, CheckCircle, AlertCircle, X, FileText } from 'lucide-react';
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
    try {
      const parsed = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert travel package data extractor for a Philippine travel agency system called GLADEX.

Analyze the following raw input (which could be a pasted itinerary, quotation, hotel breakdown, package description, or any travel-related text) and extract all relevant package data.

INPUT:
${content}

Extract and return ONLY a valid JSON object with these fields (use null for fields not found, never guess):
{
  "name": "package name/title",
  "destination": "destination country/city",
  "travel_type": "domestic or international",
  "operator_name": "tour operator or DMC name",
  "departure_date": "YYYY-MM-DD format if found",
  "return_date": "YYYY-MM-DD format if found",
  "total_slots": number or null,
  "selling_price": number in PHP or null,
  "base_price": number or null,
  "currency": "PHP or other currency code",
  "commission_amount": number or null,
  "downpayment_required": number or null,
  "flight_details": "airline, routes, schedules as text",
  "hotel_details": "hotel names and categories as text",
  "inclusions": "bullet list of inclusions",
  "exclusions": "bullet list of exclusions",
  "terms_conditions": "terms and conditions text",
  "cancellation_policy": "cancellation policy text",
  "optional_tours": "optional tour activities",
  "remarks": "any additional notes or marketing description",
  "guaranteed_departure": true or false,
  "status": "draft"
}

Important rules:
- For Philippine peso prices: ₱65,000 = 65000
- Duration like "4D3N" means 4 days 3 nights - use it to estimate dates if possible
- If destination mentions Korea, Japan, etc. it's international; if Philippines it's domestic
- Extract hotel names into hotel_details field
- Extract itinerary items into inclusions
- Be smart about extracting prices - look for ₱ symbols, "per pax", "per person", rates tables`,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            destination: { type: "string" },
            travel_type: { type: "string" },
            operator_name: { type: "string" },
            departure_date: { type: "string" },
            return_date: { type: "string" },
            total_slots: { type: "number" },
            selling_price: { type: "number" },
            base_price: { type: "number" },
            currency: { type: "string" },
            commission_amount: { type: "number" },
            downpayment_required: { type: "number" },
            flight_details: { type: "string" },
            hotel_details: { type: "string" },
            inclusions: { type: "string" },
            exclusions: { type: "string" },
            terms_conditions: { type: "string" },
            cancellation_policy: { type: "string" },
            optional_tours: { type: "string" },
            remarks: { type: "string" },
            guaranteed_departure: { type: "boolean" },
            status: { type: "string" },
          }
        }
      });
      // Clean nulls
      const clean = Object.fromEntries(Object.entries(parsed).filter(([, v]) => v !== null && v !== undefined && v !== ''));
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg gradient-gold flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">AI Smart Import</p>
          <p className="text-xs text-muted-foreground">Paste any package details and AI fills all fields</p>
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
          placeholder="Paste package details here...

Example:
Korea Autumn 2026 – 4D3N
Incheon · Nami Island · Everland · Lotte World
Lotte Hotel Seoul (3 nights)
₱65,000 per pax (twin sharing)
Inclusions: Airfare, Airport transfers, Breakfast...
Terms: 50% DP required..."
          className="w-full h-44 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 p-3 resize-none focus:outline-none"
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
          {parsing ? 'Parsing...' : 'Parse with AI'}
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
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">AI Parsed Successfully</p>
            </div>
            <button onClick={() => setResult(null)} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {result.name && <div><span className="text-muted-foreground">Package:</span> <span className="font-medium text-foreground">{result.name}</span></div>}
            {result.destination && <div><span className="text-muted-foreground">Destination:</span> <span className="font-medium text-foreground">{result.destination}</span></div>}
            {result.selling_price && <div><span className="text-muted-foreground">Price:</span> <span className="font-medium text-amber-600">₱{Number(result.selling_price).toLocaleString()}</span></div>}
            {result.departure_date && <div><span className="text-muted-foreground">Departure:</span> <span className="font-medium text-foreground">{result.departure_date}</span></div>}
            {result.operator_name && <div><span className="text-muted-foreground">Operator:</span> <span className="font-medium text-foreground">{result.operator_name}</span></div>}
            {result.total_slots && <div><span className="text-muted-foreground">Slots:</span> <span className="font-medium text-foreground">{result.total_slots}</span></div>}
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {Object.keys(result).filter(k => result[k] !== null && result[k] !== undefined).map(k => (
              <span key={k} className="text-[10px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded">
                {k.replace(/_/g, ' ')}
              </span>
            ))}
          </div>

          <Button size="sm" className="w-full gradient-gold text-white border-0 gap-2" onClick={applyAndClose}>
            <FileText className="w-3.5 h-3.5" /> Apply to Form Fields
          </Button>
        </div>
      )}
    </div>
  );
}