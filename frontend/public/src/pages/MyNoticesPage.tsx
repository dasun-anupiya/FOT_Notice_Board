import { useEffect, useState } from 'react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { noticesService } from '@/services/noticesService';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useBackendAuth } from '@/contexts/BackendAuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MoreVertical, Calendar } from 'lucide-react';

const MyNoticesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useBackendAuth();
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<any>(null);
  const [newEndDate, setNewEndDate] = useState('');

  useEffect(() => {
    loadMyNotices();
  }, []);

  const loadMyNotices = async () => {
    setLoading(true);
    const result = await noticesService.getAllNotices({ mine: true, status: 'all', limit: 100 });
    if (result.success) {
      setNotices(result.data || []);
    } else {
      setNotices([]);
    }
    setLoading(false);
  };

  const handlePublish = async (id: any) => {
    try {
      const result = await noticesService.publishNotice(id);
      if (result.success) {
        toast({ title: 'Success!', description: 'Notice published successfully' });
        loadMyNotices();
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to publish', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Unexpected error', variant: 'destructive' });
    }
  };

  const handleResubmit = async (id: any) => {
    try {
      const result = await noticesService.updateNotice(id, { Status: 'Pending Approval' });
      if (result.success) {
        toast({ title: 'Success!', description: 'Notice resubmitted for approval' });
        loadMyNotices();
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to resubmit', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Unexpected error', variant: 'destructive' });
    }
  };

  const handleExtendDate = (notice: any) => {
    const currentEndDate = notice.enddate || notice.EndDate || '';
    setSelectedNotice(notice);
    // Format date for input (YYYY-MM-DD)
    if (currentEndDate) {
      const date = new Date(currentEndDate);
      const formattedDate = date.toISOString().split('T')[0];
      setNewEndDate(formattedDate);
    } else {
      // Default to today if no end date
      setNewEndDate(new Date().toISOString().split('T')[0]);
    }
    setExtendDialogOpen(true);
  };

  const handleSaveExtendedDate = async () => {
    if (!selectedNotice || !newEndDate) return;
    
    try {
      const result = await noticesService.updateNotice(
        selectedNotice.noticeid || selectedNotice.NoticeID || selectedNotice.id,
        { EndDate: newEndDate }
      );
      if (result.success) {
        toast({ title: 'Success!', description: 'Publish date extended successfully' });
        setExtendDialogOpen(false);
        setSelectedNotice(null);
        setNewEndDate('');
        loadMyNotices();
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to extend date', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Unexpected error', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout title="My Notices">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout title="My Notices">
      <div className="space-y-4">
        {notices.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
            You haven't created any notices yet.
          </div>
        ) : (
          <div className="space-y-3">
            {notices.map((n) => {
              const id = n.noticeid || n.NoticeID || n.id;
              const title = n.title || n.Title || '';
              const status = (n.status || n.Status || '') as string;
              const start = n.startdate || n.StartDate || '';
              const end = n.enddate || n.EndDate || '';
              const statusLower = status.toLowerCase();
              return (
                <div key={id} className="flex items-center justify-between p-4 bg-white rounded-lg border hover:bg-gray-50">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{title}</div>
                    <div className="text-sm text-gray-500">Status: {status}</div>
                    <div className="text-xs text-gray-400">{start && end ? `${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}` : ''}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/notices/${id}`)}>
                      View
                    </Button>
                    {statusLower === 'approved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePublish(id)}
                      >
                        Publish
                      </Button>
                    )}
                    {statusLower === 'rejected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResubmit(id)}
                      >
                        Resubmit for Approval
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleExtendDate(n)}>
                          <Calendar className="mr-2 h-4 w-4" />
                          Extend Publish Date
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Publish Date</DialogTitle>
            <DialogDescription>
              Update the end date (expiration date) for this notice. The notice will remain visible until this date.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            {selectedNotice && (
              <div className="text-sm text-gray-500">
                <p>Current end date: {new Date(selectedNotice.enddate || selectedNotice.EndDate || '').toLocaleDateString()}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveExtendedDate} disabled={!newEndDate}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
};

export default MyNoticesPage;


