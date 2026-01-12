import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate, useLocation } from "react-router-dom";
import { BackendAuthProvider, useBackendAuth } from "@/contexts/BackendAuthContext";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import NoticeList from "@/components/notices/NoticeList";
import NoticeDetail from "@/components/notices/NoticeDetail";
import CreateNoticeForm from "@/components/notices/CreateNoticeForm";
import NoticeboardPage from './pages/NoticeboardPage';
import StudentDashboard from './pages/dashboards/StudentDashboard';
import StaffDashboard from './pages/dashboards/StaffDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import MyNoticesPage from './pages/MyNoticesPage';
import ApproveNoticesPage from './pages/ApproveNoticesPage';
import UnpublishNoticesPage from './pages/UnpublishNoticesPage';
import ViewResponsesPage from './pages/ViewResponsesPage';
import CreatePollForm from './components/polls/CreatePollForm';
import RespondToPoll from './components/polls/RespondToPoll';
import RespondToPollsPage from './pages/RespondToPollsPage';
import AdminReportsPage from './pages/dashboards/AdminReportsPage';
import AdminUsersPage from './pages/dashboards/AdminUsersPage';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

const queryClient = new QueryClient();

// Helper container for notice detail
function NoticeDetailRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  if (!id) return null;

  // Determine where to go back based on location state or default
  const getBackPath = () => {
    const from = location.state?.from;
    if (from && from.includes('/noticeboard')) {
      return '/noticeboard';
    }
    // Default to /notices for other cases
    return '/notices';
  };

  return (
    <AuthenticatedLayout title="Notice Details">
      <NoticeDetail noticeId={id} onBack={() => navigate(getBackPath())} />
    </AuthenticatedLayout>
  );
}
// Helper container for create notice
function CreateNoticeRoute() {
  const navigate = useNavigate();
  return (
    <AuthenticatedLayout title="Create Notice">
      <CreateNoticeForm onSuccess={() => navigate("/notices")} onCancel={() => navigate("/notices")} />
    </AuthenticatedLayout>
  );
}

// Helper container for create poll
function CreatePollRoute() {
  const navigate = useNavigate();
  return (
    <AuthenticatedLayout title="Create Poll">
      <CreatePollForm onSuccess={() => navigate("/polls/respond")} onCancel={() => navigate("/dashboard")} />
    </AuthenticatedLayout>
  );
}

// Helper container for respond to poll
function RespondToPollRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  if (!id) return null;
  return (
    <AuthenticatedLayout title="Respond to Poll">
      <RespondToPoll pollId={id} onVoteComplete={() => navigate("/polls/respond")} />
    </AuthenticatedLayout>
  );
}
// Notices main page with router
function NoticesPage() {
  return (
    <Routes>
      <Route index element={
        <AuthenticatedLayout title="Notices">
          <NoticeList />
        </AuthenticatedLayout>
      } />
      <Route path="create" element={<CreateNoticeRoute />} />
      <Route path=":id" element={<NoticeDetailRoute />} />
    </Routes>
  );
}

function DashboardRoute() {
  const { user, loading } = useBackendAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;

  // Get user type handling both PascalCase and snake_case
  const userType = (user.UserType || user.user_type || user.usertype || 'Student') as string;

  if (userType === 'Admin') return <AdminDashboard />;
  if (userType === 'Staff') return <StaffDashboard />;
  return <StudentDashboard />;
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <BackendAuthProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/noticeboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/noticeboard" element={<NoticeboardPage />} />
              <Route path="/dashboard" element={<DashboardRoute />} />
              <Route path="/notices/*" element={<NoticesPage />} />
              <Route path="/notices/mine" element={<MyNoticesPage />} />
              <Route path="/notices/approve" element={<ApproveNoticesPage />} />
              <Route path="/notices/unpublish" element={<UnpublishNoticesPage />} />
              <Route path="/responses" element={<ViewResponsesPage />} />
              <Route path="/polls/create" element={<CreatePollRoute />} />
              <Route path="/polls/respond" element={<RespondToPollsPage />} />
              <Route path="/polls/:id/respond" element={<RespondToPollRoute />} />
              <Route path="/reports" element={<AdminReportsPage />} />
              <Route path="/users/manage" element={<AdminUsersPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BackendAuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
