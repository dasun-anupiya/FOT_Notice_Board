import { useState, useEffect } from 'react';
import { BarChart3, CheckCircle, Clock, Users } from 'lucide-react';
import { pollsService } from '../../services/pollsService';
import { useToast } from '@/hooks/use-toast';
import { useBackendAuth } from '@/contexts/BackendAuthContext';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function RespondToPoll({ pollId, onVoteComplete }) {
  const { toast } = useToast();
  const { user } = useBackendAuth();
  const [poll, setPoll] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    loadPoll();
  }, [pollId]);

  const loadPoll = async () => {
    setLoading(true);
    try {
      const result = await pollsService.getPoll(pollId);
      if (result.success) {
        const pollData = result.data.poll || result.data;
        const optionsData = result.data.options || [];

        setPoll(pollData);
        setOptions(optionsData);

        // Check if user has already voted by trying to get results
        checkVoteStatus();
      } else {
        console.error('Failed to load poll:', result.error);
        toast({
          title: "Error",
          description: result.error || 'Failed to load poll',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading poll:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkVoteStatus = async () => {
    try {
      const result = await pollsService.getPollResults(pollId);
      if (result.success) {
        setResults(result.data);
        if (result.data.userVoted) {
          setHasVoted(true);
          setShowResults(true);
        }
      }
    } catch (error) {
      // Ignore errors (e.g. if user is not allowed to see results yet, backend might throw 403, 
      // but here we just want to check status. If 403, we assume haven't voted or just can't see results)
    }
  };

  const handleVote = async () => {
    if (!selectedOption) {
      toast({
        title: "Error",
        description: "Please select an option",
        variant: "destructive",
      });
      return;
    }

    setVoting(true);
    try {
      const optionId = selectedOption.OptionID || selectedOption.optionid || selectedOption.option_id || selectedOption.id;
      const result = await pollsService.votePoll(pollId, optionId);

      if (result.success) {
        toast({
          title: "Success!",
          description: "Your vote has been recorded",
          variant: "default",
        });
        setHasVoted(true);
        loadPollResults();
        if (onVoteComplete) {
          onVoteComplete();
        }
      } else {
        if (result.error?.includes('already voted')) {
          setHasVoted(true);
          loadPollResults();
        }
        toast({
          title: "Error",
          description: result.error || 'Failed to vote',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setVoting(false);
    }
  };

  const loadPollResults = async () => {
    try {
      const result = await pollsService.getPollResults(pollId);
      if (result.success) {
        setResults(result.data);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Error loading results:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading poll...</div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <p className="text-gray-500">Poll not found.</p>
      </div>
    );
  }

  const question = poll.Question || poll.question || '';
  const startDate = poll.StartDate || poll.startdate || poll.startDate;
  const endDate = poll.EndDate || poll.enddate || poll.endDate;
  const status = poll.Status || poll.status || '';
  const whoCanViewResults = poll.WhoCanViewResults || poll.whocanviewresults || 'Everyone';
  const userType = user?.UserType || user?.user_type || user?.usertype || 'Student';

  // Check if user can view results
  const canViewResults = whoCanViewResults === 'Everyone' ||
    (whoCanViewResults === 'Staff' && (userType === 'Staff' || userType === 'Admin'));

  const isExpired = endDate && new Date(endDate) < new Date();
  const isActive = status === 'Published' && !isExpired;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      {/* Poll Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{question}</h2>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          {startDate && endDate && (
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {format(new Date(startDate), 'MMM d, yyyy')} - {format(new Date(endDate), 'MMM d, yyyy')}
            </div>
          )}
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            {whoCanViewResults}
          </div>
        </div>
      </div>

      {/* Voting Section */}
      {!hasVoted && isActive && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Select your answer:</h3>
          <div className="space-y-2">
            {options.map((option) => {
              const optionId = option.OptionID || option.optionid || option.option_id || option.id;
              const optionText = option.OptionText || option.optiontext || option.option_text || '';
              const isSelected = selectedOption && (
                (selectedOption.OptionID || selectedOption.optionid || selectedOption.option_id || selectedOption.id) === optionId
              );

              return (
                <button
                  key={optionId}
                  onClick={() => setSelectedOption(option)}
                  className={`w-full text-left p-4 border-2 rounded-lg transition-all ${isSelected
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{optionText}</span>
                    {isSelected && <CheckCircle className="h-5 w-5 text-primary-600" />}
                  </div>
                </button>
              );
            })}
          </div>
          <Button
            onClick={handleVote}
            disabled={!selectedOption || voting}
            className="w-full"
          >
            {voting ? 'Submitting...' : 'Submit Vote'}
          </Button>
        </div>
      )}

      {/* Already Voted Message */}
      {hasVoted && !showResults && (
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <p className="text-gray-700 font-medium">You have already voted on this poll.</p>
          {canViewResults && (
            <Button
              onClick={loadPollResults}
              variant="outline"
              className="mt-4"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              View Results
            </Button>
          )}
        </div>
      )}

      {/* Results Section */}
      {showResults && results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Results
            </h3>
            <span className="text-sm text-gray-500">
              {results.totalVotes || 0} total votes
            </span>
          </div>

          <div className="space-y-3">
            {results.results && results.results.map((result) => {
              const optionId = result.OptionID || result.optionid || result.option_id;
              const optionText = result.OptionText || result.optiontext || result.option_text || '';
              const voteCount = result.VoteCount || result.votecount || result.vote_count || 0;
              const totalVotes = results.totalVotes || 1;
              const percentage = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : 0;

              return (
                <div key={optionId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{optionText}</span>
                    <span className="text-gray-600">{voteCount} votes ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Inactive/Expired Message */}
      {!isActive && (
        <div className="text-center py-8 text-gray-500">
          <p>This poll is {isExpired ? 'expired' : status.toLowerCase()}.</p>
          {canViewResults && results && (
            <Button
              onClick={loadPollResults}
              variant="outline"
              className="mt-4"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              View Results
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

