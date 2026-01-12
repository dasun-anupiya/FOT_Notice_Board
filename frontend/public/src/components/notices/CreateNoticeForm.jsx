import { useState } from 'react';
import { X, Upload, Plus, Trash2 } from 'lucide-react';
import TemplateSelector from './TemplateSelector';
import { noticesService } from '../../services/noticesService';
import { Button } from '@/components/ui/button';
import { useBackendAuth } from '@/contexts/BackendAuthContext';
import { useToast } from '@/hooks/use-toast';

export default function CreateNoticeForm({ onSuccess, onCancel }) {
  const { user } = useBackendAuth();
  const { toast } = useToast();
  const userType = user?.UserType || user?.user_type || user?.usertype || 'Student';
  
  const [formData, setFormData] = useState({
    TemplateID: 1,
    Title: '',
    Subtitle: '',
    Paragraph: '',
    VideoLink: '',
    AudioLink: '',
    WhoCanSee: 'Everyone',
    StartDate: '',
    EndDate: '',
    AttachedLinks: []
  });
  const [files, setFiles] = useState([]);
  const [linkInput, setLinkInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [publishDirectly, setPublishDirectly] = useState(userType === 'Staff' || userType === 'Admin');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileAdd = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleFileRemove = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddLink = () => {
    if (linkInput.trim()) {
      setFormData(prev => ({
        ...prev,
        AttachedLinks: [...prev.AttachedLinks, linkInput.trim()]
      }));
      setLinkInput('');
    }
  };

  const handleRemoveLink = (index) => {
    setFormData(prev => ({
      ...prev,
      AttachedLinks: prev.AttachedLinks.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Determine status based on user type and checkbox
      let noticeStatus = 'Pending Approval';
      if ((userType === 'Staff' || userType === 'Admin') && publishDirectly) {
        noticeStatus = 'Published';
      }

      // Prepare notice data
      // Map TemplateID to LayoutID (backend expects LayoutID per database schema)
      const noticeData = {
        Title: formData.Title,
        Subtitle: formData.Subtitle,
        Paragraph: formData.Paragraph,
        VideoLink: formData.VideoLink,
        AudioLink: formData.AudioLink,
        WhoCanSee: formData.WhoCanSee,
        StartDate: formData.StartDate,
        EndDate: formData.EndDate,
        LayoutID: formData.TemplateID || null, // Map TemplateID to LayoutID
        AttachedLinks: formData.AttachedLinks,
        Status: noticeStatus
      };

      console.log('Submitting notice with data:', {
        Title: noticeData.Title,
        Status: noticeData.Status,
        LayoutID: noticeData.LayoutID,
        UserType: userType,
        PublishDirectly: publishDirectly
      });
      
      const result = await noticesService.createNotice(noticeData, files);
      
      if (result.success) {
        console.log('Notice created successfully, redirecting...');
        
        // Backend handles rendering automatically, no need to render on frontend
        // The backend will render and save the notice if it's published
        
        toast({
          title: "Success!",
          description: noticeStatus === 'Published' 
            ? "Notice published successfully!" 
            : "Notice created successfully and pending approval.",
          variant: "default",
        });
        
        // Delay navigation to allow toast to show
        setTimeout(() => {
          onSuccess(result.data);
        }, 500);
      } else {
        console.error('Notice creation failed:', result.error, result.details);
        const errorMessage = result.error || 'Failed to create notice';
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Unexpected error creating notice:', err);
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

      {/* Template Selection */}
      <TemplateSelector
        selectedTemplate={formData.TemplateID}
        onSelect={(id) => setFormData(prev => ({ ...prev, TemplateID: id }))}
      />

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="Title"
          value={formData.Title}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Subtitle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subtitle
        </label>
        <input
          type="text"
          name="Subtitle"
          value={formData.Subtitle}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Paragraph */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Content
        </label>
        <textarea
          name="Paragraph"
          value={formData.Paragraph}
          onChange={handleChange}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Video Link */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Video Link
        </label>
        <input
          type="url"
          name="VideoLink"
          value={formData.VideoLink}
          onChange={handleChange}
          placeholder="https://..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Audio Link */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Audio Link
        </label>
        <input
          type="url"
          name="AudioLink"
          value={formData.AudioLink}
          onChange={handleChange}
          placeholder="https://..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Visibility */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Who Can See <span className="text-red-500">*</span>
        </label>
        <select
          name="WhoCanSee"
          value={formData.WhoCanSee}
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

      {/* Publish Directly Option (for Staff/Admin) */}
      {(userType === 'Staff' || userType === 'Admin') && (
        <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <input
            type="checkbox"
            id="publishDirectly"
            checked={publishDirectly}
            onChange={(e) => setPublishDirectly(e.target.checked)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="publishDirectly" className="text-sm font-medium text-gray-700 cursor-pointer">
            Publish immediately (skip approval)
          </label>
        </div>
      )}

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="StartDate"
            value={formData.StartDate}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="EndDate"
            value={formData.EndDate}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* External Links */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Attached Links
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="url"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            placeholder="https://..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
          <Button
            type="button"
            onClick={handleAddLink}
            size="icon"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.AttachedLinks.map((link, index) => (
            <span key={index} className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-full text-sm">
              {link}
              <button
                type="button"
                onClick={() => handleRemoveLink(index)}
                className="ml-2 text-red-600 hover:text-red-800"
              >
                <X className="h-4 w-4" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Files
        </label>
        <div className="flex items-center gap-4">
          <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
            <Upload className="h-5 w-5 mr-2" />
            Choose Files
            <input
              type="file"
              multiple
              onChange={handleFileAdd}
              className="hidden"
            />
          </label>
          <span className="text-sm text-gray-500">{files.length} file(s) selected</span>
        </div>
        {files.length > 0 && (
          <div className="mt-2 space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-700">{file.name}</span>
                <button
                  type="button"
                  onClick={() => handleFileRemove(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
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
          {loading ? 'Creating...' : 'Publish Notice'}
        </Button>
      </div>
    </form>
  );
}

