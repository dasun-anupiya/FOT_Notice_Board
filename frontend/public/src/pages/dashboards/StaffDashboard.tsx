import AuthenticatedLayout from '@/components/AuthenticatedLayout';

const StaffDashboard = () => {
  return (
    <AuthenticatedLayout title="Staff Dashboard">
      <h2 className="text-lg font-bold mb-3">Actions</h2>
      <ul className="mb-6">
        <li>Approve Student Notices</li>
        <li>Publish Notices</li>
        <li>Create Polls</li>
        <li>Set Privacy for Notices</li>
      </ul>
      {/* TODO: Approval table/list, notice/poll forms */}
    </AuthenticatedLayout>
  );
};
export default StaffDashboard;
