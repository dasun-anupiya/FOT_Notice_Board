import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBackendAuth } from '@/contexts/BackendAuthContext';
import NavigationSidebar from '@/components/NavigationSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const AuthenticatedLayout = ({ children, title }: AuthenticatedLayoutProps) => {
  const { user, loading } = useBackendAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <NavigationSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          {title && (
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">{title}</h1>
            </div>
          )}
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AuthenticatedLayout;
