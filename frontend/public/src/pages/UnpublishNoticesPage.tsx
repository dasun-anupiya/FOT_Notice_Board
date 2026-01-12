import { useState, useEffect } from 'react';
import { EyeOff, CheckCircle2 } from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { noticesService } from '@/services/noticesService';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const UnpublishNoticesPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPublishedNotices();
  }, []);

  const loadPublishedNotices = async () => {
    setLoading(true);
    try {
      const result = await noticesService.getAllNotices({ status: 'Published' });
      if (result.success) {
        setNotices(result.data || []);
      }
    } catch (error) {
      console.error('Error loading notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnpublish = async (noticeId) => {
    try {
      const result = await noticesService.unpublishNotice(noticeId);
      
      if (result.success) {
        toast({
          title: "Success!",
          description: 'Notice unpublished successfully!',
          variant: "default",
        });
        loadPublishedNotices(); // Reload list
      } else {
        toast({
          title: "Error",
          description: result.error || 'Failed to unpublish notice',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Unpublish error:', error);
      toast({
        title: "Error",
        description: 'An unexpected error occurred',
        variant: "destructive",
      });
    }
  };

  const handleViewNotice = (noticeId) => {
    navigate(`/notices/${noticeId}`);
  };

  if (loading) {
    return (
      <AuthenticatedLayout title="Unpublish Notices">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading notices...</div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout title="Unpublish Notices">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Published Notices</CardTitle>
            <CardDescription>
              Unpublish notices that should no longer be visible
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No published notices found
              </div>
            ) : (
              <div className="space-y-4">
                {notices.map((notice) => {
                  const noticeId = notice.noticeid || notice.NoticeID || notice.id;
                  const title = notice.title || notice.Title || '';
                  const startDate = notice.startdate || notice.StartDate || '';
                  const endDate = notice.enddate || notice.EndDate || '';
                  
                  return (
                    <div
                      key={noticeId}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{title}</h3>
                        {startDate && endDate && (
                          <p className="text-sm text-gray-500">
                            {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewNotice(noticeId)}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnpublish(noticeId)}
                          className="flex items-center gap-1 text-orange-600"
                        >
                          <EyeOff className="h-4 w-4" />
                          Unpublish
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

export default UnpublishNoticesPage;

