import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useBackendAuth } from '@/contexts/BackendAuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  BarChart3,
  Bell,
  Plus,
  Users,
  LogOut,
  TrendingUp
} from 'lucide-react';
// Removed Supabase import - using backend API instead

const Dashboard = () => {
  const { user, signOut, loading } = useBackendAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalNotices: 0,
    pendingApprovals: 0,
    activePolls: 0,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      // For now, set some default stats
      // TODO: Implement actual API calls to fetch stats
      setStats({
        totalNotices: 0,
        pendingApprovals: 0,
        activePolls: 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const getStatCards = () => {
    const baseCards = [
      {
        title: 'Active Notices',
        value: stats.totalNotices,
        description: user.UserType === 'Student' ? 'Current notices for you' : 'Total notices in system',
        icon: FileText,
        color: 'from-primary/20 to-primary/5',
      },
      {
        title: 'Active Polls',
        value: stats.activePolls,
        description: 'Ongoing polls to participate',
        icon: BarChart3,
        color: 'from-accent/20 to-accent/5',
      },
    ];

    if (user.UserType === 'Admin' || user.UserType === 'Staff') {
      baseCards.splice(1, 0, {
        title: 'Pending Approvals',
        value: stats.pendingApprovals,
        description: 'Notices awaiting review',
        icon: Clock,
        color: 'from-orange-500/20 to-orange-500/5',
      });
    }

    return baseCards;
  };

  const getQuickActions = () => {
    const actions = [];

    if (user.UserType === 'Staff' || user.UserType === 'Admin') {
      actions.push(
        { label: 'Create Notice', icon: Plus, href: '/notices/create' },
        { label: 'Create Poll', icon: Plus, href: '/polls/create' },
      );
    }

    if (user.UserType === 'Admin') {
      actions.push(
        { label: 'Manage Users', icon: Users, href: '/users' },
        { label: 'Approve Notices', icon: CheckCircle2, href: '/notices/manage' },
      );
    }

    return actions;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              FOT Notice Board
            </h1>
            <p className="text-sm text-muted-foreground">
              {user.UserType} Dashboard
            </p>
          </div>
          <Button variant="outline" onClick={signOut} size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl">
              {user.UniversityEmail.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-3xl font-bold">Welcome back! 👋</h2>
              <p className="text-muted-foreground">
                {user.Department && `${user.Department} • `}
                {user.Batch && `Batch ${user.Batch}`}
                {user.UniversityEmail}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          {getStatCards().map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            >
              <Card className="shadow-medium hover:shadow-large transition-shadow duration-300 border-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                    <card.icon className="w-5 h-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        {getQuickActions().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-8"
          >
            <Card className="shadow-medium border-border/50">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Get started with common tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {getQuickActions().map((action) => (
                    <Button
                      key={action.label}
                      variant="outline"
                      className="h-auto py-6 flex flex-col items-center gap-2 hover:scale-105 transition-transform duration-200"
                      onClick={() => navigate(action.href)}
                    >
                      <action.icon className="w-6 h-6" />
                      <span className="text-sm font-medium">{action.label}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Coming Soon Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="shadow-medium border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Stay updated with the latest notices and polls</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Recent activity feed coming soon!</p>
                <p className="text-sm mt-2">You'll see the latest notices, poll results, and more here.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
