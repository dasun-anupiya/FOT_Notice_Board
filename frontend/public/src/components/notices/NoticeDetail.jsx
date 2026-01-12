import { useState, useEffect } from 'react';
import { Calendar, Eye, User, MessageSquare, Edit2, Trash2, X, Check } from 'lucide-react';
import { format } from 'date-fns';
import { noticesService } from '../../services/noticesService';
import NoticeActions from './NoticeActions';
import { useToast } from '@/hooks/use-toast';
import { useBackendAuth } from '@/contexts/BackendAuthContext';
import { Button } from '@/components/ui/button';

export default function NoticeDetail({ noticeId, onBack }) {
  const safeFormat = (value, fmt) => {
    try {
      if (!value) return '';
      const d = new Date(value);
      if (isNaN(d.getTime())) return '';
      return format(d, fmt);
    } catch {
      return '';
    }
  };
  const { toast } = useToast();
  const { user } = useBackendAuth();
  const [notice, setNotice] = useState(null);
  const [responses, setResponses] = useState([]);
  const [responseText, setResponseText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [editingResponseId, setEditingResponseId] = useState(null);
  const [editResponseText, setEditResponseText] = useState('');
  const [hasResponded, setHasResponded] = useState(false);

  useEffect(() => {
    loadNotice();
    loadResponses();
  }, [noticeId]);

  const loadNotice = async () => {
    setLoading(true);
    try {
      const result = await noticesService.getNotice(noticeId);
      if (result.success) {
        console.log('Loaded notice:', result.data);
        setNotice(result.data);
      } else {
        console.error('Failed to load notice:', result.error);
      }
    } catch (error) {
      console.error('Error loading notice:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadResponses = async () => {
    try {
      const result = await noticesService.getNoticeResponses(noticeId);
      if (result.success) {
        const responsesData = result.data || [];
        setResponses(responsesData);
        
        // Check if current user has already responded
        const currentUserId = user?.UserID || user?.userid || user?.user_id;
        const userResponse = responsesData.find(r => {
          const responseUserId = r.userid || r.UserID || r.user_id;
          return responseUserId === currentUserId;
        });
        setHasResponded(!!userResponse);
      } else {
        console.error('Failed to load responses:', result.error);
      }
    } catch (error) {
      console.error('Error loading responses:', error);
    }
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    if (!responseText.trim()) return;

    setSubmittingResponse(true);
    try {
      const result = await noticesService.addResponse(noticeId, responseText);
      if (result.success) {
        setResponseText('');
        loadResponses();
        toast({
          title: "Success!",
          description: "Response added successfully",
          variant: "default",
        });
      } else {
        console.error('Failed to add response:', result.error);
        toast({
          title: "Error",
          description: result.error || 'Failed to add response',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding response:', error);
      alert('An unexpected error occurred');
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleActionComplete = () => {
    // Reload notice data after action
    loadNotice();
  };

  const handleEditResponse = (response) => {
    const responseContent = response.response || response.Response || '';
    setEditingResponseId(response.responseid || response.ResponseID || response.id || response.response_id);
    setEditResponseText(responseContent);
  };

  const handleCancelEdit = () => {
    setEditingResponseId(null);
    setEditResponseText('');
  };

  const handleSaveEdit = async () => {
    if (!editingResponseId || !editResponseText.trim()) return;

    try {
      const result = await noticesService.updateResponse(editingResponseId, editResponseText);
      if (result.success) {
        toast({
          title: "Success!",
          description: "Response updated successfully",
          variant: "default",
        });
        setEditingResponseId(null);
        setEditResponseText('');
        loadResponses();
      } else {
        toast({
          title: "Error",
          description: result.error || 'Failed to update response',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating response:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDeleteResponse = async (responseId) => {
    if (!confirm('Are you sure you want to delete this response?')) return;

    try {
      const result = await noticesService.deleteResponse(responseId);
      if (result.success) {
        toast({
          title: "Success!",
          description: "Response deleted successfully",
          variant: "default",
        });
        loadResponses();
        setHasResponded(false); // User can now respond again
      } else {
        toast({
          title: "Error",
          description: result.error || 'Failed to delete response',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting response:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading notice...</div>
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <p className="text-gray-500">Notice not found.</p>
      </div>
    );
  }

  // Handle both PascalCase and lowercase column names
  const title = notice.title || notice.Title || '';
  const startDate = notice.startdate || notice.StartDate || notice.startDate;
  const endDate = notice.enddate || notice.EndDate || notice.endDate;
  const whoCanSee = notice.whocansee || notice.WhoCanSee || notice.whoCanSee || '';

  // Parse metadata if stored as JSON string in files - handle both naming conventions
  const metadataFile = notice.files?.find(f => {
    const location = f.filelocation || f.FileLocation || f.file_location || '';
    return location && location.startsWith('{');
  });
  const metadataString = metadataFile?.filelocation || metadataFile?.FileLocation || metadataFile?.file_location || '';
  let parsedMeta = {};
  if (metadataString) {
    try {
      parsedMeta = JSON.parse(metadataString);
    } catch (e) {
      console.error('Error parsing metadata:', e);
      parsedMeta = {};
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="text-primary-600 hover:text-primary-700 flex items-center gap-2"
        >
          ← Back to Notices
        </button>
      )}

      {/* Admin/Staff Actions */}
      <NoticeActions notice={notice} onActionComplete={handleActionComplete} />

      {/* Notice Content */}
      <article className="bg-white rounded-lg shadow-sm p-8">
        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {title}
        </h1>

        {/* Meta Info */}
        {(startDate || endDate || whoCanSee) && (
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6 pb-6 border-b">
            {(startDate || endDate) && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {safeFormat(startDate, 'MMMM d, yyyy')}
                {startDate || endDate ? ' - ' : ''}
                {safeFormat(endDate, 'MMMM d, yyyy')}
              </div>
            )}
            {whoCanSee && (
              <div className="flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                {whoCanSee}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {parsedMeta.Subtitle && (
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {parsedMeta.Subtitle}
          </h2>
        )}

        {parsedMeta.Paragraph && (
          <div className="prose max-w-none mb-6">
            <p className="text-gray-700 whitespace-pre-line">
              {parsedMeta.Paragraph}
            </p>
          </div>
        )}

        {/* Media */}
        {parsedMeta.VideoLink && (
          <div className="mb-6">
            <iframe
              src={parsedMeta.VideoLink}
              className="w-full aspect-video rounded-lg"
              allowFullScreen
            />
          </div>
        )}

        {parsedMeta.AudioLink && (
          <div className="mb-6">
            <audio controls className="w-full">
              <source src={parsedMeta.AudioLink} type="audio/mpeg" />
            </audio>
          </div>
        )}

        {/* Attached Links */}
        {notice.files && notice.files.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Attachments</h3>
            <div className="space-y-2">
              {notice.files
                .filter(f => {
                  const location = f.filelocation || f.FileLocation || f.file_location || '';
                  return location && !location.startsWith('{');
                })
                .map((file, index) => {
                  const fileLocation = file.filelocation || file.FileLocation || file.file_location || '';
                  return (
                    <a
                      key={index}
                      href={fileLocation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-primary-600 hover:text-primary-700 underline"
                    >
                      {fileLocation}
                    </a>
                  );
                })}
            </div>
          </div>
        )}
      </article>

      {/* Response Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Responses ({responses.length})
        </h3>

        {!hasResponded && (
          <form onSubmit={handleSubmitResponse} className="mb-6">
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Add your response..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 mb-3"
            />
            <Button
              type="submit"
              disabled={submittingResponse || !responseText.trim()}
            >
              {submittingResponse ? 'Submitting...' : 'Submit Response'}
            </Button>
          </form>
        )}

        {hasResponded && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
            You have already responded to this notice. You can edit or delete your response below.
          </div>
        )}

        {/* Responses List */}
        <div className="space-y-4">
          {responses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No responses yet. Be the first to respond!
            </div>
          ) : (
            responses.map((response) => {
              // Handle both PascalCase and lowercase column names
              const responseId = response.responseid || response.ResponseID || response.id || response.response_id || '';
              const responseContent = response.response || response.Response || '';
              const createdAt = response.createdtimestamp || response.CreatedTimeStamp || response.created_timestamp || '';
              const responseUserId = response.userid || response.UserID || response.user_id;
              const currentUserId = user?.UserID || user?.userid || user?.user_id;
              const isOwnResponse = responseUserId === currentUserId;
              const isAdmin = (user?.UserType || user?.user_type || user?.usertype) === 'Admin';
              const canEdit = isOwnResponse || isAdmin;
              const canDelete = isOwnResponse || isAdmin;
              const isEditing = editingResponseId === responseId;
              
              // Get user info
              const userInfo = response.user || {};
              const userEmail = userInfo.email || '';
              const displayName = userEmail ? userEmail.split('@')[0].replace(/[._]/g, ' ') : 'Anonymous';
              
              return (
                <div key={responseId || Math.random()} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 capitalize">{displayName}</div>
                        {userInfo.userType && (
                          <div className="text-xs text-gray-500">{userInfo.userType}</div>
                        )}
                      </div>
                    </div>
                    {canEdit && (
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleSaveEdit}
                              className="h-8 w-8 p-0"
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEdit}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditResponse(response)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="h-4 w-4 text-blue-600" />
                            </Button>
                            {canDelete && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteResponse(responseId)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {isEditing ? (
                    <textarea
                      value={editResponseText}
                      onChange={(e) => setEditResponseText(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 mb-2"
                    />
                  ) : (
                    <p className="text-gray-700 whitespace-pre-wrap">{responseContent}</p>
                  )}
                  
                  {createdAt && (
                    <p className="text-xs text-gray-500 mt-2">
                      {format(new Date(createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

