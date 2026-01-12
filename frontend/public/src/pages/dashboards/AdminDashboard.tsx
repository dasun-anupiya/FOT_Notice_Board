import AuthenticatedLayout from '@/components/AuthenticatedLayout';

const AdminDashboard = () => {
  return (
    <AuthenticatedLayout title="Admin Dashboard">
      <h2 className="text-lg font-bold mb-3">Admin Actions</h2>
      <ul className="mb-6">
        <li>Publish, approve/reject, unpublish notices</li>
        <li>Create/publish polls</li>
        <li>Approve Student Notices</li>
        <li>View All Responses</li>
        <li>View All Responses</li>
        <li>Generate Reports <a href="/reports" className="text-blue-600 hover:underline">(Go to Reports)</a></li>
        <li>Set Privacy for Notices</li>
      </ul>
      {/* TODO: Action tables/lists, reports, privacy controls */}
    </AuthenticatedLayout>
  );
};
export default AdminDashboard;
