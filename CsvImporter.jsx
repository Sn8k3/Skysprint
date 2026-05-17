import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Upload, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';

const ENTITIES = [
  { label: 'Buildings', value: 'Building' },
  { label: 'Runs', value: 'Run' },
  { label: 'Videos', value: 'Video' },
  { label: 'Events', value: 'Event' },
  { label: 'Groups', value: 'Group' },
];

function parseCsv(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    // handle quoted commas
    const values = [];
    let cur = '', inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === ',' && !inQuote) { values.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    values.push(cur.trim());
    const obj = {};
    headers.forEach((h, i) => {
      const v = (values[i] || '').replace(/^"|"$/g, '');
      if (v !== '') obj[h] = v;
    });
    return obj;
  }).filter(r => Object.keys(r).length > 0);
}

export default function CsvImporter() {
  const [entity, setEntity] = useState('Building');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = parseCsv(ev.target.result);
      setHeaders(rows.length > 0 ? Object.keys(rows[0]) : []);
      setPreview(rows.slice(0, 5));
    };
    reader.readAsText(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const rows = parseCsv(ev.target.result);
      let success = 0, failed = 0;
      for (const row of rows) {
        // coerce numeric-looking fields
        const coerced = {};
        for (const [k, v] of Object.entries(row)) {
          coerced[k] = isNaN(v) || v === '' ? v : Number(v);
        }
        await base44.entities[entity].create(coerced);
        success++;
      }
      setResult({ success, failed });
      toast.success(`Imported ${success} ${entity} records!`);
      setImporting(false);
    };
    reader.readAsText(file);
  };

  const reset = () => {
    setFile(null);
    setPreview([]);
    setHeaders([]);
    setResult(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <h3 className="font-heading text-sm font-bold tracking-wider text-primary">CSV IMPORT</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-1 block">Target Entity</Label>
          <Select value={entity} onValueChange={v => { setEntity(v); reset(); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ENTITIES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-1 block">CSV File</Label>
          <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-lg px-4 py-2.5 text-sm text-muted-foreground hover:border-primary/50 transition-colors">
            <Upload className="w-4 h-4" />
            <span>{file ? file.name : 'Choose CSV file…'}</span>
            <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
          </label>
        </div>
      </div>

      {/* Column hint */}
      {headers.length > 0 && (
        <div className="rounded-lg border border-border bg-secondary/30 p-3">
          <p className="text-xs text-muted-foreground mb-1">Detected columns:</p>
          <div className="flex flex-wrap gap-1">
            {headers.map(h => (
              <span key={h} className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-mono">{h}</span>
            ))}
          </div>
        </div>
      )}

      {/* Preview table */}
      {preview.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Preview (first {preview.length} rows)</p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead className="bg-secondary/50">
                <tr>
                  {headers.map(h => <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {preview.map((row, i) => (
                  <tr key={i}>
                    {headers.map(h => (
                      <td key={h} className="px-3 py-2 truncate max-w-[160px]">{row[h] ?? '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`flex items-center gap-2 p-3 rounded-lg border text-sm ${result.failed === 0 ? 'border-primary/30 bg-primary/5 text-primary' : 'border-destructive/30 bg-destructive/5 text-destructive'}`}>
          {result.failed === 0
            ? <><CheckCircle2 className="w-4 h-4" /> {result.success} records imported successfully.</>
            : <><AlertCircle className="w-4 h-4" /> {result.success} imported, {result.failed} failed.</>
          }
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={handleImport} disabled={!file || importing} className="gap-2">
          <Upload className="w-4 h-4" />
          {importing ? 'Importing…' : `Import into ${entity}`}
        </Button>
        {file && (
          <Button variant="ghost" onClick={reset} className="gap-2">
            <X className="w-4 h-4" /> Clear
          </Button>
        )}
      </div>
    </div>
  );
}
