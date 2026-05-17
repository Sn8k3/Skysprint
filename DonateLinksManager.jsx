import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Coffee, Heart, Zap, Save } from 'lucide-react';
import { toast } from 'sonner';

const FIELDS = [
  { key: 'buymeacoffee_url', label: 'Buy Me a Coffee', icon: Coffee, placeholder: 'https://buymeacoffee.com/yourname' },
  { key: 'paypal_url', label: 'PayPal', icon: Heart, placeholder: 'https://paypal.me/yourname' },
  { key: 'kofi_url', label: 'Ko-fi', icon: Zap, placeholder: 'https://ko-fi.com/yourname' },
];

export default function DonateLinksManager() {
  const [record, setRecord] = useState(null);
  const [form, setForm] = useState({ buymeacoffee_url: '', paypal_url: '', kofi_url: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const all = await base44.entities.DonateLinks.list();
      if (all.length > 0) {
        setRecord(all[0]);
        setForm({
          buymeacoffee_url: all[0].buymeacoffee_url || '',
          paypal_url: all[0].paypal_url || '',
          kofi_url: all[0].kofi_url || '',
        });
      }
    })();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    if (record) {
      await base44.entities.DonateLinks.update(record.id, form);
    } else {
      const created = await base44.entities.DonateLinks.create(form);
      setRecord(created);
    }
    toast.success('Donation links saved!');
    setLoading(false);
  };

  return (
    <div className="space-y-4 max-w-lg">
      <p className="text-sm text-muted-foreground">Set the URLs for your donation pages. These will appear on the public Donate page.</p>
      {FIELDS.map(({ key, label, icon: Icon, placeholder }) => (
        <div key={key}>
          <Label className="flex items-center gap-2 mb-1"><Icon className="w-4 h-4" />{label}</Label>
          <Input
            value={form[key]}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            placeholder={placeholder}
          />
        </div>
      ))}
      <Button onClick={handleSave} disabled={loading} className="gap-2">
        <Save className="w-4 h-4" />
        {loading ? 'Saving...' : 'Save Links'}
      </Button>
    </div>
  );
}
