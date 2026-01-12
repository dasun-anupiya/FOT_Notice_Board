import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersService } from '@/services/usersService';

interface User {
  UserID?: number;
  userid?: number;
  user_id?: number;
  UniversityEmail?: string;
  university_email?: string;
  universityemail?: string;
  UserType?: 'Student' | 'Staff' | 'Admin';
  user_type?: 'Student' | 'Staff' | 'Admin';
  usertype?: 'Student' | 'Staff' | 'Admin';
  Department?: string | null;
  department?: string | null;
  Batch?: string | null;
  batch?: string | null;
  Designation?: string | null;
  designation?: string | null;
  // For compatibility with old interface
  id?: string;
  name?: string;
  email?: string;
  avatar_url?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (userData: { name: string; email: string; password: string; user_type: string; department?: string; batch?: string }) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const BackendAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session on app load
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const result = await usersService.login({ UniversityEmail: email, Password: password });
      
      if (result.success) {
        const { token, user: userData } = result.data;
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        navigate('/noticeboard');
        return { error: null };
      } else {
        return { error: { message: result.error || 'Login failed' } };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error?.response?.data?.message || error?.message || 'An unexpected error occurred during login';
      return { error: { message } };
    }
  };

  const signUp = async (userData: { name: string; email: string; password: string; user_type: string; department?: string; batch?: string }) => {
    try {
      // Transform frontend data to backend API format
      const backendData = {
        UniversityEmail: userData.email,
        Password: userData.password,
        UserType: userData.user_type,
        Department: userData.department || null,
        Batch: userData.batch || null,
        Designation: null // Not used for students
      };
      
      const result = await usersService.register(backendData);
      
      if (result.success) {
        const createdUser = result.data;
        const token = 'temp_token_' + Date.now();
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(createdUser));
        setUser(createdUser);
        navigate('/noticeboard');
        return { error: null };
      } else {
        return { error: { message: result.error || 'Registration failed' } };
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      const message = error?.response?.data?.message || error?.message || 'An unexpected error occurred during registration';
      return { error: { message } };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useBackendAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useBackendAuth must be used within a BackendAuthProvider');
  }
  return context;
};
