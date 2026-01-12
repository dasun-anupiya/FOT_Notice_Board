import { useState } from 'react';
import { CheckCircle2, XCircle, Eye, EyeOff, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { noticesService } from '../../services/noticesService';
import { useBackendAuth } from '@/contexts/BackendAuthContext';

export default function NoticeActions({ notice, onActionComplete }) {
  const { user } = useBackendAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const userType = user?.UserType || user?.user_type || user?.usertype || 'Student';
  const isAdminOrStaff = userType === 'Admin' || userType === 'Staff';
  
  // Handle both PascalCase and lowercase column names
  const noticeId = notice?.noticeid || notice?.NoticeID || notice?.id;
  const status = (notice?.status || notice?.Status || '').toLowerCase();

  const handleAction = async (action) => {
    if (!noticeId) {
      toast({
        title: "Error",
        description: "Notice ID not found",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
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
        case 'unpublish':
          result = await noticesService.unpublishNotice(noticeId);
          successMessage = 'Notice unpublished successfully!';
          break;
        case 'expire':
          result = await noticesService.expireNotice(noticeId);
          successMessage = 'Notice expired successfully!';
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
        if (onActionComplete) {
          onActionComplete();
        }
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
    } finally {
      setLoading(false);
    }
  };

  if (!isAdminOrStaff) {
    return null; // Only show actions for Staff and Admin
  }

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <span className="text-sm font-medium text-gray-700 mr-2">Actions:</span>
      
      {/* Approve - for pending notices */}
      {(status === 'pending approval' || status === 'pending') && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAction('approve')}
          disabled={loading}
          className="flex items-center gap-1"
        >
          <CheckCircle2 className="h-4 w-4" />
          Approve
        </Button>
      )}

      {/* Reject - for pending notices */}
      {(status === 'pending approval' || status === 'pending') && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAction('reject')}
          disabled={loading}
          className="flex items-center gap-1"
        >
          <XCircle className="h-4 w-4" />
          Reject
        </Button>
      )}

      {/* Publish - for approved notices */}
      {status === 'approved' && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAction('publish')}
          disabled={loading}
          className="flex items-center gap-1"
        >
          <Eye className="h-4 w-4" />
          Publish
        </Button>
      )}

      {/* Unpublish - for published notices */}
      {status === 'published' && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAction('unpublish')}
          disabled={loading}
          className="flex items-center gap-1"
        >
          <EyeOff className="h-4 w-4" />
          Unpublish
        </Button>
      )}

      {/* Expire - for active notices */}
      {(status === 'published' || status === 'approved') && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAction('expire')}
          disabled={loading}
          className="flex items-center gap-1"
        >
          <Clock className="h-4 w-4" />
          Expire
        </Button>
      )}
    </div>
  );
}

