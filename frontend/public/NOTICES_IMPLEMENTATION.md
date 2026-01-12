# Notices Implementation Guide

## ✅ What Has Been Created

### 1. **Service Layer** (`src/services/`)
All API integration functions for notices:

#### `noticesService.js`
- `getAllNotices(filters)` - Fetch all notices with optional filters
- `getNotice(id)` - Get a single notice
- `createNotice(noticeData, files)` - Create new notice with file upload
- `updateNotice(id, updates)` - Update existing notice
- `deleteNotice(id)` - Delete a notice
- `addResponse(noticeId, responseText)` - Add response to notice
- `getNoticeResponses(noticeId)` - Get all responses for a notice
- `adminAction(noticeId, action)` - Admin approve/reject/expire actions

#### `pollsService.js`
- Complete poll CRUD operations
- Voting functionality
- Poll results retrieval

#### `usersService.js`
- User management functions
- Admin user operations

### 2. **Notice Components** (`src/components/notices/`)

#### TemplateSelector.jsx
- Visual template picker
- 3 predefined templates:
  - Simple Header (clean title + content)
  - Card Style (card format)
  - Banner Poster (full-width poster)
- Interactive selection with visual feedback

#### CreateNoticeForm.jsx
- Complete notice creation form
- Features:
  - Template selection
  - Title, Subtitle, Content fields
  - Video and Audio link support
  - Visibility/scope selection
  - Date range (start/end)
  - External links management
  - File upload (images, documents)
  - Form validation
  - Loading states

#### NoticeCard.jsx
- Notice preview card component
- Displays:
  - Title and subtitle
  - Status badge with colors
  - Dates and visibility info
  - Response count
  - Click to view details
- Responsive design

#### NoticeList.jsx
- List/grid view of all notices
- Features:
  - Search functionality
  - Status filtering
  - Real-time filtering
  - Results counter
  - Click to view detail
  - Loading states
- Grid layout (1/2/3 columns based on screen size)

#### NoticeDetail.jsx
- Full notice detail page
- Features:
  - Complete notice content
  - Metadata display
  - Embedded media (video)
  - Attachments list
  - Response form
  - Responses display
  - Back button navigation

### 3. **Template System**

#### Available Templates

**Template 1: Simple Header**
```
[Title]
[Subtitle]
[Content]
[Media/Attachments]
```

**Template 2: Card Style**
```
┌────────────────────────┐
│ [Title]                 │
│ [Card Content]          │
│ [Media]                 │
└────────────────────────┘
```

**Template 3: Banner Poster**
```
┌──────────────────────────┐
│   Full-Width Banner      │
│   [Hero Image/Content]   │
│   [Details Below]        │
└──────────────────────────┘
```

## 📝 How to Use

### Creating a Notice (Staff/Admin)

1. Import the form component:
```jsx
import CreateNoticeForm from '../components/notices/CreateNoticeForm';
```

2. Use in your page:
```jsx
function CreateNoticePage() {
  const handleSuccess = (noticeData) => {
    console.log('Notice created:', noticeData);
    // Navigate to success page or refresh list
  };

  const handleCancel = () => {
    // Navigate back or close modal
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Create New Notice</h1>
      <CreateNoticeForm 
        onSuccess={handleSuccess} 
        onCancel={handleCancel} 
      />
    </div>
  );
}
```

### Displaying Notices

1. Use NoticeList component:
```jsx
import NoticeList from '../components/notices/NoticeList';

function NoticesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Notices</h1>
      <NoticeList />
    </div>
  );
}
```

2. Or use NoticeCard individually:
```jsx
import NoticeCard from '../components/notices/NoticeCard';

function MyNotices({ notices }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {notices.map(notice => (
        <NoticeCard 
          key={notice.NoticeID} 
          notice={notice}
          onClick={(id) => navigate(`/notices/${id}`)}
        />
      ))}
    </div>
  );
}
```

### Displaying Notice Detail

```jsx
import NoticeDetail from '../components/notices/NoticeDetail';

function NoticeDetailPage() {
  const { id } = useParams();
  
  return (
    <NoticeDetail 
      noticeId={id}
      onBack={() => navigate('/notices')}
    />
  );
}
```

## 🔧 API Integration

### Example: Custom Notice Fetching

```jsx
import { noticesService } from '../services/noticesService';

function MyComponent() {
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    const result = await noticesService.getAllNotices({
      status: 'Published',
      page: 1
    });

    if (result.success) {
      setNotices(result.data);
    } else {
      console.error(result.error);
    }
  };

  return <div>{/* Render notices */}</div>;
}
```

## 🎨 Customization

### Adding New Template

1. Add to `TemplateSelector.jsx`:
```jsx
const templates = [
  // ... existing templates
  {
    id: 4,
    name: 'Your Template',
    description: 'Description',
    preview: 'custom',
    icon: IconName,
    color: 'bg-blue-100 text-blue-700'
  }
];
```

2. Create template renderer (optional):
```jsx
// src/components/notices/templates/CustomTemplate.jsx
export default function CustomTemplate({ notice }) {
  return (
    <div className="custom-template">
      {/* Your custom layout */}
    </div>
  );
}
```

### Customizing Status Colors

Edit `NoticeCard.jsx`:
```jsx
const statusColors = {
  'Pending Approval': 'bg-yellow-100 text-yellow-800',
  'Your Custom Status': 'bg-purple-100 text-purple-800'
  // ... add more
};
```

## 🚀 Next Steps

### Priority 1: Integration
- [ ] Update Student/Staff/Admin pages to use these components
- [ ] Connect to backend API endpoints
- [ ] Add loading skeletons
- [ ] Add error boundaries

### Priority 2: Features
- [ ] Add notice edit functionality
- [ ] Add file preview (images)
- [ ] Add rich text editor
- [ ] Add notice templates rendering
- [ ] Add print functionality

### Priority 3: Enhancements
- [ ] Add notice categories/tags
- [ ] Add favorites/bookmarks
- [ ] Add sharing functionality
- [ ] Add export to PDF
- [ ] Add advanced search

## 📋 Features Checklist

✅ Notice creation form with file upload
✅ Template selection system
✅ Notice list with search and filters
✅ Notice detail view
✅ Response system
✅ Status management
✅ API service layer
✅ Loading and error states
✅ Responsive design
⏳ Rich text editor
⏳ Image preview
⏳ Notice templates rendering
⏳ Admin approval workflow UI
⏳ Notice analytics

## 🎯 File Structure

```
src/
├── services/
│   ├── noticesService.js    ✅ Complete
│   ├── pollsService.js      ✅ Complete
│   └── usersService.js      ✅ Complete
└── components/
    └── notices/
        ├── TemplateSelector.jsx    ✅
        ├── CreateNoticeForm.jsx    ✅
        ├── NoticeCard.jsx          ✅
        ├── NoticeList.jsx           ✅
        └── NoticeDetail.jsx         ✅
```

All components are ready to be integrated into your pages!

