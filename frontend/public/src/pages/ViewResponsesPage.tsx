import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { noticesService } from '@/services/noticesService';
import { pollsService } from '@/services/pollsService';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useBackendAuth } from '@/contexts/BackendAuthContext';
import { Search, Filter, MessageSquare, User, FileText, Calendar, Trash2, BarChart3, Clock, Users, CheckCircle, XCircle } from 'lucide-react';
import { format, isValid } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Safe date formatting helper
const safeFormat = (dateInput: any, formatStr: string) => {
  try {
    if (!dateInput) return 'N/A';
    const date = new Date(dateInput);
    if (!isValid(date)) return 'Invalid Date';
    return format(date, formatStr);
  } catch (e) {
    console.error('Date formatting error:', e);
    return 'Error';
  }
};

const ViewResponsesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useBackendAuth();

  // Notice Responses State
  const [responses, setResponses] = useState<any[]>([]);
  const [filteredResponses, setFilteredResponses] = useState<any[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNoticeId, setFilterNoticeId] = useState('');
  const [filterUserId, setFilterUserId] = useState('');
  const [notices, setNotices] = useState<any[]>([]);

  // Poll Results State
  const [polls, setPolls] = useState<any[]>([]);
  const [selectedPollId, setSelectedPollId] = useState<number | null>(null);
  const [pollResults, setPollResults] = useState<any>(null);
  const [loadingPolls, setLoadingPolls] = useState(false);

  const userType = user?.UserType || user?.user_type || user?.usertype || 'Student';
  const isStaffOrAdmin = userType === 'Staff' || userType === 'Admin';

  useEffect(() => {
    if (isStaffOrAdmin) {
      loadResponses();
      loadNotices();
      loadPolls();
    }
  }, [isStaffOrAdmin]);

  useEffect(() => {
    filterResponses();
  }, [searchTerm, filterNoticeId, filterUserId, responses]);

  const loadResponses = async () => {
    setLoadingResponses(true);
    try {
      const result = await noticesService.getAllResponses({ limit: 1000 });
      if (result.success) {
        setResponses(result.data || []);
      } else {
        setResponses([]);
      }
    } catch (error) {
      console.error('Error loading responses:', error);
      setResponses([]);
    } finally {
      setLoadingResponses(false);
    }
  };

  const loadNotices = async () => {
    try {
      const result = await noticesService.getAllNotices({ status: 'all', limit: 1000 });
      if (result.success) {
        setNotices(result.data || []);
      }
    } catch (error) {
      console.error('Error loading notices:', error);
    }
  };

  const loadPolls = async () => {
    setLoadingPolls(true);
    try {
      const result = await pollsService.getAllPolls();
      if (result.success) {
        // Sort by date desc
        const sorted = result.data.sort((a: any, b: any) => {
          const dateA = new Date(a.StartDate || a.startdate || 0);
          const dateB = new Date(b.StartDate || b.startdate || 0);
          return dateB.getTime() - dateA.getTime();
        });
        setPolls(sorted);
      }
    } catch (error) {
      console.error('Error loading polls:', error);
    } finally {
      setLoadingPolls(false);
    }
  };

  const handlePollSelect = async (pollId: number) => {
    if (selectedPollId === pollId) {
      setSelectedPollId(null);
      setPollResults(null);
      return;
    }

    setSelectedPollId(pollId);
    try {
      const result = await pollsService.getPollResults(pollId);
      if (result.success) {
        setPollResults(result.data);
      } else {
        toast({ title: "Error", description: "Failed to load results", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const filterResponses = () => {
    let filtered = responses;

    // Filter by notice
    if (filterNoticeId) {
      filtered = filtered.filter(r => {
        const noticeId = r.noticeid || r.NoticeID || r.notice_id;
        return String(noticeId) === filterNoticeId;
      });
    }

    // Filter by user
    if (filterUserId) {
      filtered = filtered.filter(r => {
        const userId = r.userid || r.UserID || r.user_id;
        return String(userId) === filterUserId;
      });
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(r => {
        const responseText = (r.response || r.Response || '').toLowerCase();
        const noticeTitle = (r.notice?.title || '').toLowerCase();
        const userEmail = (r.user?.email || '').toLowerCase();
        return responseText.includes(search) || noticeTitle.includes(search) || userEmail.includes(search);
      });
    }

    setFilteredResponses(filtered);
  };

  const handleDeleteResponse = async (responseId: any) => {
    if (!confirm('Are you sure you want to delete this response?')) return;

    try {
      const result = await noticesService.deleteResponse(responseId);
      if (result.success) {
        toast({ title: 'Success!', description: 'Response deleted successfully', variant: 'default' });
        loadResponses();
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to delete response', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error deleting response:', error);
      toast({ title: 'Error', description: 'An unexpected error occurred', variant: 'destructive' });
    }
  };

  if (!isStaffOrAdmin) {
    return (
      <AuthenticatedLayout title="View Responses">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          You do not have permission to view this page.
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout title="Responses Dashboard">
      <Tabs defaultValue="notices" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="notices">Notice Comments</TabsTrigger>
          <TabsTrigger value="polls">Poll Results</TabsTrigger>
        </TabsList>

        {/* NOTICE RESPONSES TAB */}
        <TabsContent value="notices" className="space-y-6">
          {/* Header Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Comments</p>
                  <p className="text-2xl font-bold text-gray-900">{responses.length}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-primary-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Filtered View</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredResponses.length}</p>
                </div>
                <Filter className="h-8 w-8 text-primary-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Notices</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Set(responses.map(r => r.noticeid || r.NoticeID || r.notice_id)).size}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-primary-600" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" placeholder="Search comments..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
              </div>
              <div>
                <select value={filterNoticeId} onChange={(e) => setFilterNoticeId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
                  <option value="">All Notices</option>
                  {notices.map((notice) => (
                    <option key={notice.noticeid || notice.id} value={notice.noticeid || notice.id}>
                      {(notice.title || '').substring(0, 30)}...
                    </option>
                  ))}
                </select>
              </div>
              <Button variant="outline" onClick={() => { setSearchTerm(''); setFilterNoticeId(''); setFilterUserId(''); }} className="w-full">Clear Filters</Button>
            </div>
          </div>

          {/* Responses List */}
          {loadingResponses ? (
            <div className="text-center py-12 text-gray-500">Loading comments...</div>
          ) : filteredResponses.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No comments found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredResponses.map((response) => {
                const responseId = response.responseid || response.id;
                const displayName = (response.user?.email || 'Anonymous').split('@')[0];
                return (
                  <div key={responseId} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{displayName}</span>
                            <span className="text-xs text-gray-500">{safeFormat(response.createdtimestamp || response.created_timestamp, 'MMM d, h:mm a')}</span>
                          </div>
                          <p className="text-gray-700 mb-2">{response.response || response.Response}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <FileText className="h-3 w-3" />
                            <span>Response to: {response.notice?.title}</span>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-800" onClick={() => handleDeleteResponse(responseId)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* POLL RESULTS TAB */}
        <TabsContent value="polls" className="space-y-6">
          {loadingPolls ? (
            <div className="text-center py-12 text-gray-500">Loading polls...</div>
          ) : polls.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No polls found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Poll List */}
              <div className="lg:col-span-1 space-y-4">
                <h3 className="font-semibold text-gray-700 mb-2">Select a Poll</h3>
                <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2">
                  {polls.map(poll => {
                    const pollId = poll.PollID || poll.pollid || poll.id;
                    const isSelected = selectedPollId === pollId;
                    const status = poll.Status || poll.status;
                    return (
                      <div
                        key={pollId}
                        onClick={() => handlePollSelect(pollId)}
                        className={`p-4 rounded-lg cursor-pointer transition-all border ${isSelected ? 'bg-primary-50 border-primary-500 ring-1 ring-primary-500' : 'bg-white border-gray-200 hover:border-primary-300'
                          }`}
                      >
                        <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{poll.Question || poll.question}</h4>
                        <div className="flex items-center justify-between text-xs">
                          <span className={`px-2 py-0.5 rounded-full ${status === 'Published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {status}
                          </span>
                          <span className="text-gray-500">{safeFormat(poll.StartDate || poll.startdate, 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Results Display */}
              <div className="lg:col-span-2">
                {selectedPollId && pollResults ? (
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 sticky top-6">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{pollResults.poll?.Question}</h2>
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          <span>{pollResults.totalVotes} Total Votes</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>Ends: {safeFormat(pollResults.poll?.EndDate, 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {pollResults.results?.map((result: any) => {
                        const percentage = pollResults.totalVotes > 0
                          ? ((result.VoteCount / pollResults.totalVotes) * 100).toFixed(1)
                          : 0;

                        return (
                          <div key={result.OptionID} className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                              <span className="font-medium text-gray-700">{result.OptionText}</span>
                              <span className="font-bold text-gray-900">{result.VoteCount} ({percentage}%)</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-3">
                              <div
                                className="bg-primary-600 h-3 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {pollResults.totalVotes === 0 && (
                      <div className="mt-8 text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <BarChart3 className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No votes recorded yet.</p>
                      </div>
                    )}
                  </div>
                ) : selectedPollId ? (
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <div className="text-gray-400">Loading results...</div>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <div className="text-center text-gray-400">
                      <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Select a poll to view detailed results</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AuthenticatedLayout>
  );
};

export default ViewResponsesPage;

