import NoticeList from '@/components/notices/NoticeList';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

const NoticeboardPage = () => {
  return (
    <AuthenticatedLayout title="Noticeboard">
      {/* Notices Section */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Notices</h2>
        <NoticeList />
      </section>
      {/* Polls Section */}
      <section>
        <h2 className="text-xl font-bold mb-4">Polls</h2>
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
          (Polls list and submission coming soon)
        </div>
      </section>
    </AuthenticatedLayout>
  );
};
export default NoticeboardPage;
