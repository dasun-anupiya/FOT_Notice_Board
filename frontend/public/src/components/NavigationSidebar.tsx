import { useBackendAuth } from '@/contexts/BackendAuthContext';
import { useLocation, Link } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  FileText,
  CheckCircle2,
  BarChart3,
  Users,
  Settings,
  Home,
  MessageSquare,
  Shield,
  Eye,
  XCircle,
  Plus,
  Clock,
  TrendingUp,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MenuItem {
  title: string;
  icon: React.ElementType;
  path: string;
  badge?: string;
}

const NavigationSidebar = () => {
  const { user, signOut, loading } = useBackendAuth();
  const location = useLocation();

  // Don't render if still loading or no user
  if (loading || !user) {
    return null;
  }

  // Get user type, handling both PascalCase and snake_case from backend
  const userType = (user?.UserType || user?.user_type || user?.usertype || 'Student') as string;

  // Get email and extract display name
  const userEmail = user?.UniversityEmail || user?.university_email || user?.universityemail || user?.email || '';
  const displayName = userEmail ? userEmail.split('@')[0].replace(/[._]/g, ' ') : 'User';

  // Student menu items
  const studentMenuItems: MenuItem[] = [
    { title: 'Noticeboard', icon: Home, path: '/noticeboard' },
    { title: 'Dashboard', icon: TrendingUp, path: '/dashboard' },
    { title: 'Publish Notice', icon: Plus, path: '/notices/create' },
    { title: 'My Notices', icon: FileText, path: '/notices/mine' },
    { title: 'Respond to Notices', icon: MessageSquare, path: '/notices/respond' },
    { title: 'Respond to Polls', icon: BarChart3, path: '/polls/respond' },
  ];

  // Staff menu items
  const staffMenuItems: MenuItem[] = [
    { title: 'Noticeboard', icon: Home, path: '/noticeboard' },
    { title: 'Publish Notice', icon: Plus, path: '/notices/create' },
    { title: 'Approve Notices', icon: CheckCircle2, path: '/notices/approve' },
    { title: 'My Notices', icon: FileText, path: '/notices/mine' },
    { title: 'Create Poll', icon: Plus, path: '/polls/create' },
    { title: 'View Responses', icon: Eye, path: '/responses' },
  ];

  // Admin menu items
  const adminMenuItems: MenuItem[] = [
    { title: 'Noticeboard', icon: Home, path: '/noticeboard' },
    { title: 'Publish Notice', icon: Plus, path: '/notices/create' },
    { title: 'Approve Notices', icon: CheckCircle2, path: '/notices/approve' },
    { title: 'Unpublish Notice', icon: XCircle, path: '/notices/unpublish' },
    { title: 'All Notices', icon: FileText, path: '/notices/all' },
    { title: 'Create Poll', icon: Plus, path: '/polls/create' },
    { title: 'View Responses', icon: Eye, path: '/responses' },
    { title: 'Generate Reports', icon: TrendingUp, path: '/reports' },
    { title: 'Manage Users', icon: Users, path: '/users/manage' },
  ];

  const getMenuItems = (): MenuItem[] => {
    switch (userType) {
      case 'Admin':
      case 'admin':
        return adminMenuItems;
      case 'Staff':
      case 'staff':
        return staffMenuItems;
      case 'Student':
      case 'student':
      default:
        return studentMenuItems;
    }
  };

  const menuItems = getMenuItems();

  const isActive = (path: string) => {
    if (path === '/noticeboard' && location.pathname === '/noticeboard') return true;
    if (path === '/dashboard' && location.pathname === '/dashboard') return true;
    return location.pathname.startsWith(path) && path !== '/noticeboard' && path !== '/dashboard';
  };

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <img src="/ic.png" alt="FOT Notice Board Logo" className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">FOT Notice Board</span>
            <span className="text-xs text-muted-foreground">{userType} Portal</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.path)}
                      tooltip={item.title}
                    >
                      <Link to={item.path}>
                        <Icon />
                        <span>{item.title}</span>
                        {item.badge && (
                          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex flex-col gap-3">
          {/* User Profile Info */}
          <div className="px-2 py-2 space-y-1">
            {/* User Avatar/Initial */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="text-sm font-semibold text-sidebar-foreground truncate capitalize">
                  {displayName}
                </div>
                <div className="text-xs text-sidebar-foreground/70 truncate">
                  {userEmail}
                </div>
              </div>
            </div>
            {/* User Type Badge */}
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 rounded-md bg-sidebar-accent text-sidebar-accent-foreground text-xs font-medium">
                {userType}
              </div>
            </div>
          </div>
          {/* Sign Out Button */}
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={signOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default NavigationSidebar;
