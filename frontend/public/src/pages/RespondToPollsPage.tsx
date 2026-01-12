import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { pollsService } from '@/services/pollsService';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useBackendAuth } from '@/contexts/BackendAuthContext';
import { Search, Filter, BarChart3, Clock, Users, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import RespondToPoll from '@/components/polls/RespondToPoll';

const RespondToPollsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useBackendAuth();
  const [polls, setPolls] = useState<any[]>([]);
  const [filteredPolls, setFilteredPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Published');
  const [selectedPoll, setSelectedPoll] = useState<any>(null);

  const userType = user?.UserType || user?.user_type || user?.usertype || 'Student';
  const userDepartment = user?.Department || user?.department || '';

  useEffect(() => {
    loadPolls();
  }, []);

  useEffect(() => {
    filterPolls();
  }, [searchTerm, statusFilter, polls]);

  const loadPolls = async () => {
    setLoading(true);
    try {
      console.log('Loading polls...');
      const result = await pollsService.getAllPolls();
      console.log('Polls service result:', result);
      
      if (result.success) {
        const pollsData = result.data || [];
        console.log(`Loaded ${pollsData.length} polls from backend`);
        
        // Backend already filters by visibility, status, and date range
        // Sort by date (most recent first)
        const sorted = pollsData.sort((a: any, b: any) => {
          const dateA = new Date(a.CreatedTimeStamp || a.createdtimestamp || a.CreatedTimeStamp || 0);
          const dateB = new Date(b.CreatedTimeStamp || b.createdtimestamp || b.CreatedTimeStamp || 0);
          return dateB.getTime() - dateA.getTime();
        });

        console.log(`After sorting: ${sorted.length} polls`);
        setPolls(sorted);
      } else {
        console.error('Failed to load polls:', result.error);
        toast({
          title: "Error",
          description: result.error || 'Failed to load polls',
          variant: "destructive",
        });
        setPolls([]);
      }
    } catch (error) {
      console.error('Error loading polls:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading polls",
        variant: "destructive",
      });
      setPolls([]);
    } finally {
      setLoading(false);
    }
  };

  const filterPolls = () => {
    let filtered = polls;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((poll: any) => {
        const pollStatus = poll.Status || poll.status || '';
        return pollStatus.toLowerCase() === statusFilter.toLowerCase();
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((poll: any) => {
        const question = (poll.Question || poll.question || '').toLowerCase();
        return question.includes(searchTerm.toLowerCase());
      });
    }

    setFilteredPolls(filtered);
  };

  const handleRespond = (poll: any) => {
    const pollId = poll.PollID || poll.pollid || poll.poll_id || poll.id;
    setSelectedPoll(poll);
  };

  const handleBack = () => {
    setSelectedPoll(null);
    loadPolls(); // Reload polls in case user voted
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'pending approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'published':
        return CheckCircle;
      case 'approved':
        return CheckCircle;
      case 'pending approval':
        return Clock;
      case 'rejected':
        return XCircle;
      case 'expired':
        return XCircle;
      default:
        return Clock;
    }
  };

  const isPollExpired = (poll: any) => {
    const endDate = poll.EndDate || poll.enddate || poll.endDate;
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  if (loading) {
    return (
      <AuthenticatedLayout title="Respond to Polls">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading polls...</div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Show poll detail/respond view
  if (selectedPoll) {
    const pollId = selectedPoll.PollID || selectedPoll.pollid || selectedPoll.poll_id || selectedPoll.id;
    return (
      <AuthenticatedLayout title="Respond to Poll">
        <div className="space-y-4">
          <Button variant="outline" onClick={handleBack}>
            ← Back to Polls
          </Button>
          <RespondToPoll pollId={pollId} onVoteComplete={handleBack} />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout title="Respond to Polls">
      <div className="space-y-6">
        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search polls..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Status</option>
                <option value="Published">Published</option>
                <option value="Approved">Approved</option>
                <option value="Pending Approval">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Polls List */}
        <div className="text-sm text-gray-600">
          Showing {filteredPolls.length} of {polls.length} polls
        </div>

        {filteredPolls.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No polls found.</p>
            {polls.length === 0 ? (
              <p className="text-sm text-gray-400">
                {userType === 'Admin' || userType === 'Staff' 
                  ? 'No polls have been created yet. Create a poll to get started!'
                  : 'No polls are available at this time.'}
              </p>
            ) : (
              <p className="text-sm text-gray-400">
                Try adjusting your search or filter criteria.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPolls.map((poll) => {
              const pollId = poll.PollID || poll.pollid || poll.poll_id || poll.id;
              const question = poll.Question || poll.question || '';
              const status = poll.Status || poll.status || '';
              const startDate = poll.StartDate || poll.startdate || poll.startDate;
              const endDate = poll.EndDate || poll.enddate || poll.endDate;
              const whoCanResponse = poll.WhoCanResponse || poll.whocanresponse || '';
              const expired = isPollExpired(poll);
              const StatusIcon = getStatusIcon(status);
              const statusColor = getStatusColor(status);

              return (
                <div
                  key={pollId}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold text-gray-900 line-clamp-2 flex-1">
                      {question}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor} ml-2`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-4">
                    {startDate && endDate && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {format(new Date(startDate), 'MMM d')} - {format(new Date(endDate), 'MMM d, yyyy')}
                      </div>
                    )}
                    {whoCanResponse && (
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {whoCanResponse}
                      </div>
                    )}
                  </div>

                  {expired && (
                    <div className="mb-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
                      This poll has expired
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center text-sm text-gray-500">
                      <BarChart3 className="h-4 w-4 mr-1" />
                      <span>Poll</span>
                    </div>
                    <Button
                      onClick={() => handleRespond(poll)}
                      disabled={expired || status !== 'Published'}
                      size="sm"
                    >
                      {expired ? 'Expired' : status === 'Published' ? 'Respond' : 'View'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
};

export default RespondToPollsPage;

