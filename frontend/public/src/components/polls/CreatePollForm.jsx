import { useState } from 'react';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { pollsService } from '../../services/pollsService';
import { Button } from '@/components/ui/button';
import { useBackendAuth } from '@/contexts/BackendAuthContext';
import { useToast } from '@/hooks/use-toast';

export default function CreatePollForm({ onSuccess, onCancel }) {
  const { user } = useBackendAuth();
  const { toast } = useToast();
  const userType = user?.UserType || user?.user_type || user?.usertype || 'Student';
  
  const [formData, setFormData] = useState({
    Question: '',
    Options: ['', ''],
    StartDate: '',
    EndDate: '',
    WhoCanResponse: 'Everyone',
    WhoCanViewResults: 'Everyone'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.Options];
    newOptions[index] = value;
    setFormData(prev => ({ ...prev, Options: newOptions }));
  };

  const handleAddOption = () => {
    setFormData(prev => ({ ...prev, Options: [...prev.Options, ''] }));
  };

  const handleRemoveOption = (index) => {
    if (formData.Options.length > 2) {
      const newOptions = formData.Options.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, Options: newOptions }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!formData.Question.trim()) {
      setError('Question is required');
      return;
    }
    
    const validOptions = formData.Options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      setError('At least 2 options are required');
      return;
    }

    if (!formData.StartDate || !formData.EndDate) {
      setError('Start date and end date are required');
      return;
    }

    if (new Date(formData.StartDate) > new Date(formData.EndDate)) {
      setError('End date must be after start date');
      return;
    }

    setLoading(true);

    try {
      const pollData = {
        Question: formData.Question,
        Options: validOptions,
        StartDate: formData.StartDate,
        EndDate: formData.EndDate,
        WhoCanResponse: formData.WhoCanResponse,
        WhoCanViewResults: formData.WhoCanViewResults
      };

      const result = await pollsService.createPoll(pollData);
      
      if (result.success) {
        toast({
          title: "Success!",
          description: "Poll created successfully and pending approval.",
          variant: "default",
        });
        
        setTimeout(() => {
          onSuccess(result.data);
        }, 500);
      } else {
        const errorMessage = result.error || 'Failed to create poll';
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Unexpected error creating poll:', err);
      const errorMessage = 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Question <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="Question"
          value={formData.Question}
          onChange={handleChange}
          required
          placeholder="Enter your poll question..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Options <span className="text-red-500">*</span> (Minimum 2)
        </label>
        <div className="space-y-2">
          {formData.Options.map((option, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
              {formData.Options.length > 2 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleRemoveOption(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleAddOption}
          className="mt-2"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Option
        </Button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Who Can Respond <span className="text-red-500">*</span>
        </label>
        <select
          name="WhoCanResponse"
          value={formData.WhoCanResponse}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="Everyone">Everyone</option>
          <option value="Staff">Staff Only</option>
          <option value="IAT Department">IAT Department</option>
          <option value="AT Department">AT Department</option>
          <option value="ET Department">ET Department</option>
          <option value="ICT Department">ICT Department</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Who Can View Results <span className="text-red-500">*</span>
        </label>
        <select
          name="WhoCanViewResults"
          value={formData.WhoCanViewResults}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="Everyone">Everyone</option>
          <option value="Staff">Staff Only</option>
          <option value="IAT Department">IAT Department</option>
          <option value="AT Department">AT Department</option>
          <option value="ET Department">ET Department</option>
          <option value="ICT Department">ICT Department</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline h-4 w-4 mr-1" />
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="StartDate"
            value={formData.StartDate}
            onChange={handleChange}
            required
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline h-4 w-4 mr-1" />
            End Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="EndDate"
            value={formData.EndDate}
            onChange={handleChange}
            required
            min={formData.StartDate || new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Poll'}
        </Button>
      </div>
    </form>
  );
}

