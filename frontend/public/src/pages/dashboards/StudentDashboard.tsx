import NoticeList from '@/components/notices/NoticeList';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

const StudentDashboard = () => {
  return (
    <AuthenticatedLayout title="Student Dashboard">
      <h2 className="text-lg font-bold mb-3">Your Submitted Notices</h2>
      {/* TODO: Filter NoticeList to only show notices by this student */}
      <NoticeList />
      {/* TODO: Add quick actions for responding to polls/notices */}
    </AuthenticatedLayout>
  );
};
export default StudentDashboard;
