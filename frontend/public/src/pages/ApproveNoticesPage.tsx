import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Eye, Clock } from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { noticesService } from '@/services/noticesService';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBackendAuth } from '@/contexts/BackendAuthContext';

const ApproveNoticesPage = () => {
  const { user } = useBackendAuth();
  const { toast } = useToast();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingNotices();
  }, []);

  const loadPendingNotices = async () => {
    setLoading(true);
    try {
      const result = await noticesService.getAllNotices({ status: 'Pending Approval' });
      if (result.success) {
        setNotices(result.data || []);
      }
    } catch (error) {
      console.error('Error loading notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (noticeId, action) => {
    try {
      let result;
      let successMessage = '';

      switch (action) {
        case 'approve':
          result = await noticesService.approveNotice(noticeId);
          successMessage = 'Notice approved successfully!';
          break;
        case 'reject':
          result = await noticesService.rejectNotice(noticeId);
          successMessage = 'Notice rejected successfully!';
          break;
        case 'publish':
          result = await noticesService.publishNotice(noticeId);
          successMessage = 'Notice published successfully!';
          break;
        default:
          return;
      }

      if (result.success) {
        toast({
          title: "Success!",
          description: successMessage,
          variant: "default",
        });
        loadPendingNotices(); // Reload list
      } else {
        toast({
          title: "Error",
          description: result.error || 'Failed to perform action',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Action error:', error);
      toast({
        title: "Error",
        description: 'An unexpected error occurred',
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout title="Approve Notices">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading notices...</div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout title="Approve Notices">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Pending Approval</CardTitle>
            <CardDescription>
              Review and approve notices submitted by students
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No notices pending approval
              </div>
            ) : (
              <div className="space-y-4">
                {notices.map((notice) => {
                  const noticeId = notice.noticeid || notice.NoticeID || notice.id;
                  const title = notice.title || notice.Title || '';
                  const status = notice.status || notice.Status || '';
                  
                  return (
                    <div
                      key={noticeId}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{title}</h3>
                        <p className="text-sm text-gray-500">Status: {status}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(noticeId, 'approve')}
                          className="flex items-center gap-1"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(noticeId, 'publish')}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Approve & Publish
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(noticeId, 'reject')}
                          className="flex items-center gap-1 text-red-600"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
};

export default ApproveNoticesPage;

