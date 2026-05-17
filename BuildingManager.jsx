import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, MapPin, Search } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const EMPTY_FORM = {
  name: '', description: '', latitude: '', longitude: '',
  city: '', country: '', floors: '', height_meters: '',
  difficulty: 'intermediate', image_url: '', status: 'active',
};

export default function BuildingManager({ buildings }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [addressSearch, setAddressSearch] = useState('');
  const [addressResults, setAddressResults] = useState([]);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const queryClient = useQueryClient();

  const searchAddress = async () => {
    if (!addressSearch.trim()) return;
    setSearchingAddress(true);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressSearch)}&format=json&limit=5&addressdetails=1`);
    const data = await res.json();
    setAddressResults(data);
    setSearchingAddress(false);
  };

  const pickAddress = (result) => {
    setForm(f => ({
      ...f,
      latitude: parseFloat(result.lat).toFixed(6),
      longitude: parseFloat(result.lon).toFixed(6),
      city: result.address?.city || result.address?.town || result.address?.village || f.city,
      country: result.address?.country || f.country,
    }));
    setAddressResults([]);
    setAddressSearch('');
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (b) => {
    setEditing(b);
    setForm({
      name: b.name || '', description: b.description || '',
      latitude: b.latitude?.toString() || '', longitude: b.longitude?.toString() || '',
      city: b.city || '', country: b.country || '',
      floors: b.floors?.toString() || '', height_meters: b.height_meters?.toString() || '',
      difficulty: b.difficulty || 'intermediate', image_url: b.image_url || '',
      status: b.status || 'active',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = {
      ...form,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      floors: form.floors ? parseInt(form.floors) : undefined,
      height_meters: form.height_meters ? parseFloat(form.height_meters) : undefined,
    };
    if (editing) {
      await base44.entities.Building.update(editing.id, data);
      toast.success('Building updated!');
    } else {
      await base44.entities.Building.create(data);
      toast.success('Building created!');
    }
    queryClient.invalidateQueries({ queryKey: ['admin_buildings'] });
    queryClient.invalidateQueries({ queryKey: ['buildings'] });
    setShowForm(false);
    setLoading(false);
  };

  const handleDelete = async (b) => {
    if (!window.confirm(`Delete "${b.name}"?`)) return;
    await base44.entities.Building.delete(b.id);
    toast.success('Building deleted');
    queryClient.invalidateQueries({ queryKey: ['admin_buildings'] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-sm font-bold tracking-wider text-primary">BUILDINGS</h3>
        <Button size="sm" onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Add Building</Button>
      </div>

      <div className="space-y-2">
        {buildings.map(b => (
          <div key={b.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-3 min-w-0">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{b.name}</p>
                <p className="text-xs text-muted-foreground">{b.city}, {b.country}</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="ghost" onClick={() => openEdit(b)}><Pencil className="w-4 h-4" /></Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(b)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
        {buildings.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No buildings yet</p>}
      </div>

      <Dialog open={showForm} onOpenChange={() => { setShowForm(false); setAddressResults([]); setAddressSearch(''); }}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">{editing ? 'Edit Building' : 'Add Building'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} /></div>

            {/* Address search */}
            <div>
              <Label>Search Address</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="e.g. Empire State Building, New York"
                  value={addressSearch}
                  onChange={e => setAddressSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), searchAddress())}
                />
                <Button type="button" variant="secondary" size="icon" onClick={searchAddress} disabled={searchingAddress}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              {addressResults.length > 0 && (
                <div className="mt-1 rounded-lg border border-border bg-popover shadow-lg z-50 max-h-48 overflow-y-auto">
                  {addressResults.map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      className="w-full text-left px-3 py-2 text-xs hover:bg-secondary transition-colors border-b border-border/50 last:border-0"
                      onClick={() => pickAddress(r)}
                    >
                      {r.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label>Latitude</Label><Input type="number" step="any" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} required /></div>
              <div><Label>Longitude</Label><Input type="number" step="any" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>City</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
              <div><Label>Country</Label><Input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Floors</Label><Input type="number" value={form.floors} onChange={e => setForm({ ...form, floors: e.target.value })} /></div>
              <div><Label>Height (m)</Label><Input type="number" value={form.height_meters} onChange={e => setForm({ ...form, height_meters: e.target.value })} /></div>
              <div>
                <Label>Difficulty</Label>
                <Select value={form.difficulty} onValueChange={v => setForm({ ...form, difficulty: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                    <SelectItem value="legendary">Legendary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Image URL</Label><Input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Saving...' : (editing ? 'Update Building' : 'Create Building')}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
