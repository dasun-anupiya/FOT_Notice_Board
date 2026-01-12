import { Calendar, Eye, MessageSquare, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const statusColors = {
  'Pending Approval': 'bg-yellow-100 text-yellow-800',
  'Approved': 'bg-blue-100 text-blue-800',
  'Published': 'bg-green-100 text-green-800',
  'Rejected': 'bg-red-100 text-red-800',
  'Expired': 'bg-gray-100 text-gray-800'
};

const statusIcons = {
  'Pending Approval': Clock,
  'Approved': CheckCircle,
  'Published': CheckCircle,
  'Rejected': XCircle,
  'Expired': XCircle
};

export default function NoticeCard({ notice, onClick }) {
  // Handle both PascalCase and lowercase column names
  const noticeId = notice.noticeid || notice.NoticeID || notice.id;
  const title = notice.title || notice.Title || '';
  const subtitle = notice.subtitle || notice.Subtitle || '';
  const status = notice.status || notice.Status || '';
  const startDate = notice.startdate || notice.StartDate || notice.startDate;
  const endDate = notice.enddate || notice.EndDate || notice.endDate;
  const whoCanSee = notice.whocansee || notice.WhoCanSee || notice.whoCanSee || '';
  
  const StatusIcon = statusIcons[status] || Clock;
  const statusColor = statusColors[status] || 'bg-gray-100 text-gray-800';

  return (
    <div
      onClick={() => onClick?.(noticeId)}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer border border-gray-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
          {title}
        </h3>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {status}
        </span>
      </div>

      {/* Meta Info */}
      <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-3">
        {startDate && (
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {format(new Date(startDate), 'MMM d, yyyy')}
          </div>
        )}
        {whoCanSee && (
          <div className="flex items-center">
            <Eye className="h-4 w-4 mr-1" />
            {whoCanSee}
          </div>
        )}
      </div>

      {/* Subtitle if exists */}
      {subtitle && (
        <p className="text-gray-600 mb-3 line-clamp-2">
          {subtitle}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center text-sm text-gray-500">
          <MessageSquare className="h-4 w-4 mr-1" />
          <span>Responses</span>
        </div>
        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
          View Details →
        </button>
      </div>
    </div>
  );
}

