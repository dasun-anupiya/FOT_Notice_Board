import { useState, useEffect } from 'react';
import { Filter, Search } from 'lucide-react';
import NoticeCard from './NoticeCard';
import { noticesService } from '../../services/noticesService';
import { useNavigate } from 'react-router-dom';
import { useBackendAuth } from '@/contexts/BackendAuthContext';

export default function NoticeList() {
  const { user } = useBackendAuth();
  const [notices, setNotices] = useState([]);
  const [filteredNotices, setFilteredNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadNotices();
    }
  }, [user]);

  useEffect(() => {
    filterNotices();
  }, [searchTerm, statusFilter, notices]);

  const loadNotices = async () => {
    setLoading(true);
    try {
      // Always show Published notices on the noticeboard
      const result = await noticesService.getAllNotices({ 
        status: 'Published',
        limit: 100 
      });
      
      if (result.success) {
        // Backend already sorts, but ensure sorting as backup
        const sorted = (result.data || []).sort((a, b) => {
          // Handle both PascalCase and lowercase column names
          const dateA = new Date(
            a.lastupdatedtimestamp || 
            a.LastUpdatedTimeStamp || 
            a.createdtimestamp || 
            a.CreatedTimeStamp || 
            0
          );
          const dateB = new Date(
            b.lastupdatedtimestamp || 
            b.LastUpdatedTimeStamp || 
            b.createdtimestamp || 
            b.CreatedTimeStamp || 
            0
          );
          return dateB - dateA; // Descending order (newest first)
        });
        setNotices(sorted);
        console.log(`Loaded ${sorted.length} notices`);
      } else {
        console.error('Failed to load notices:', result.error);
        setNotices([]);
      }
    } catch (error) {
      console.error('Error loading notices:', error);
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  const filterNotices = () => {
    let filtered = notices;

    // Filter by status (handle both PascalCase and lowercase)
    if (statusFilter !== 'all') {
      filtered = filtered.filter(n => {
        const noticeStatus = n.status || n.Status || '';
        return noticeStatus.toLowerCase() === statusFilter.toLowerCase();
      });
    }

    // Filter by search term (handle both PascalCase and lowercase)
    if (searchTerm) {
      filtered = filtered.filter(n => {
        const title = n.title || n.Title || '';
        const subtitle = n.subtitle || n.Subtitle || '';
        const search = searchTerm.toLowerCase();
        return title.toLowerCase().includes(search) || subtitle.toLowerCase().includes(search);
      });
    }

    setFilteredNotices(filtered);
  };

  const handleNoticeClick = (id) => {
    navigate(`/notices/${id}`, { state: { from: window.location.pathname } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading notices...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search notices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Status Filter */}
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
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredNotices.length} of {notices.length} notices
      </div>

      {/* Notices Grid */}
      {filteredNotices.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500">No notices found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotices.map((notice) => {
            // Handle both PascalCase and lowercase ID formats
            const noticeId = notice.noticeid || notice.NoticeID || notice.id;
            return (
              <NoticeCard
                key={noticeId}
                notice={notice}
                onClick={handleNoticeClick}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

