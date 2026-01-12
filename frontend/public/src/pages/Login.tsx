import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBackendAuth } from '@/contexts/BackendAuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, GraduationCap } from 'lucide-react';
import { usersService } from '@/services/usersService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const { signIn, signUp, user } = useBackendAuth();
  const navigate = useNavigate();

  // Forgot Password State
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);

    if (!resetEmail || !resetPassword) {
      toast.error('Please fill in all fields');
      setIsResetting(false);
      return;
    }

    if (resetPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      setIsResetting(false);
      return;
    }

    try {
      const result = await usersService.resetPassword({
        UniversityEmail: resetEmail,
        Password: resetPassword
      });

      if (result.success) {
        toast.success('Password reset successfully! Please login.');
        setIsResetOpen(false);
        setResetEmail('');
        setResetPassword('');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsResetting(false);
    }
  };
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(loginEmail, loginPassword);

      if (error) {
        const message = typeof error === 'string' ? error : error.message;
        if (message && (message.includes('Invalid credentials') || message.includes('Invalid login credentials'))) {
          toast.error('Invalid email or password');
        } else {
          toast.error(message || 'Login failed');
        }
      } else {
        toast.success('Welcome back!');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!signupName.trim()) {
      toast.error('Please enter your name');
      setIsLoading(false);
      return;
    }

    try {
      const userData = {
        name: signupName,
        email: signupEmail,
        password: signupPassword,
        user_type: 'Student', // Default to Student, can be changed later
        department: 'IAT', // Default department
        batch: '2024' // Default batch
      };

      const { error } = await signUp(userData);

      if (error) {
        const message = typeof error === 'string' ? error : error.message;
        if (message && message.toLowerCase().includes('already registered')) {
          toast.error('This email is already registered');
        } else {
          toast.error(message || 'Registration failed');
        }
      } else {
        toast.success('Account created successfully!');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-900 to-blue-700 mb-4 shadow-lg"
          >
            <img src="ic.png" alt="FOT Notice Board Logo" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
          >
            FOT Notice Board
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-muted-foreground mt-2"
          >
            Stay connected with your campus
          </motion.p>
        </div>

        <Card className="shadow-large border-border/50">
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="name@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                  <div className="text-center mt-2">
                    <Button
                      variant="link"
                      className="text-xs text-muted-foreground"
                      onClick={() => setIsResetOpen(true)}
                      type="button"
                    >
                      Forgot Password?
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Dasun Perera"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="name@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      minLength={6}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center mt-6 text-sm text-muted-foreground"
        >
          <p>© 2025 FOT Notice Board. All rights reserved.</p>
        </motion.div>
      </motion.div>


      {/* Forgot Password Dialog */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and a new password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="name@example.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-password">New Password</Label>
              <Input
                id="reset-password"
                type="password"
                placeholder="Minimum 6 characters"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isResetting}>
                {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reset Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div >
  );
};

export default Login;
