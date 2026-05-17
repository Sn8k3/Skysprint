import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, X, ExternalLink, Clock } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function SubmissionQueue({ items, type, buildings = [] }) {
  const [rejectDialog, setRejectDialog] = useState(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const getEntity = () => {
    if (type === 'videos') return base44.entities.Video;
    if (type === 'runs') return base44.entities.Run;
    return base44.entities.Recommendation;
  };

  const getBuildingName = (buildingId) => {
    const b = buildings.find(b => b.id === buildingId);
    return b?.name || 'Unknown';
  };

  const handleApprove = async (item) => {
    setLoading(true);
    await getEntity().update(item.id, { status: 'approved', verified: true });

    // If this is a strategy recommendation, push it into the building's strategies array
    if (type === 'recommendations' && item.type === 'strategy' && item.building_id) {
      const building = buildings.find(b => b.id === item.building_id);
      if (building) {
        const existing = building.strategies || [];
        await base44.entities.Building.update(item.building_id, {
          strategies: [...existing, {
            title: item.title,
            description: item.description,
            author: item.submitter_name || '',
          }],
        });
        queryClient.invalidateQueries({ queryKey: ['building', item.building_id] });
        queryClient.invalidateQueries({ queryKey: ['admin_buildings'] });
        queryClient.invalidateQueries({ queryKey: ['buildings'] });
      }
    }

    toast.success(`${type === 'videos' ? 'Video' : type === 'runs' ? 'Run' : 'Recommendation'} approved!`);
    queryClient.invalidateQueries({ queryKey: [`admin_${type}`] });
    if (type === 'runs') queryClient.invalidateQueries({ queryKey: ['runs'] });
    if (type === 'videos') queryClient.invalidateQueries({ queryKey: ['videos'] });
    if (type === 'recommendations') queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    setLoading(false);
  };

  const handleReject = async () => {
    if (!rejectDialog) return;
    setLoading(true);
    await getEntity().update(rejectDialog.id, { status: 'rejected', rejection_reason: reason });
    
    // Send rejection email
    const email = rejectDialog.uploader_email || rejectDialog.runner_email || rejectDialog.submitter_email;
    if (email) {
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: `RushHub: Your submission was not approved`,
        body: `Hi,\n\nYour submission "${rejectDialog.title || rejectDialog.runner_name || rejectDialog.title}" was reviewed and unfortunately couldn't be approved.\n\nReason: ${reason}\n\nFeel free to resubmit with the necessary changes.\n\n— RushHub Team`,
      });
    }
    
    toast.success('Submission rejected and user notified.');
    setRejectDialog(null);
    setReason('');
    queryClient.invalidateQueries({ queryKey: [`admin_${type}`] });
    if (type === 'runs') queryClient.invalidateQueries({ queryKey: ['runs'] });
    if (type === 'videos') queryClient.invalidateQueries({ queryKey: ['videos'] });
    if (type === 'recommendations') queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    setLoading(false);
  };

  const pending = items.filter(i => i.status === 'pending');

  return (
    <div>
      {pending.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No pending {type}</p>
      ) : (
        <div className="space-y-3">
          {pending.map(item => (
            <div key={item.id} className="p-4 rounded-lg border border-border bg-card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">
                      <Clock className="w-3 h-3 mr-1" /> Pending
                    </Badge>
                    {item.building_id && (
                      <span className="text-xs text-muted-foreground">
                        Building: {getBuildingName(item.building_id)}
                      </span>
                    )}
                  </div>
                  <h4 className="font-medium text-sm">
                    {type === 'runs' ? `${item.runner_name} — ${item.time_seconds}s` : item.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {type === 'videos' && <>by {item.uploader_name} • <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">View <ExternalLink className="w-3 h-3" /></a></>}
                    {type === 'runs' && <>Category: {item.category} {item.video_url && <> • <a href={item.video_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Video <ExternalLink className="w-3 h-3" /></a></>}</>}
                    {type === 'recommendations' && <>by {item.submitter_name} • Type: {item.type}</>}
                  </p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="h-8 text-green-400 border-green-500/30 hover:bg-green-500/10" onClick={() => handleApprove(item)} disabled={loading}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-red-400 border-red-500/30 hover:bg-red-500/10" onClick={() => setRejectDialog(item)} disabled={loading}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg text-destructive">Reject Submission</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">The user will receive an email with your reason.</p>
          <Textarea
            placeholder="Reason for rejection..."
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={4}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRejectDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!reason.trim() || loading}>
              {loading ? 'Rejecting...' : 'Reject & Notify'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
