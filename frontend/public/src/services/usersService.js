import API from '../api';

export const usersService = {
  // Register new user
  async register(userData) {
    try {
      const response = await API.post('/users/register', userData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to register user' };
    }
  },

  // Login user
  async login(credentials) {
    try {
      const response = await API.post('/users/login', credentials);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to login' };
    }
  },

  // Get all users (admin only)
  async getAllUsers() {
    try {
      const response = await API.get('/users');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get users error:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to fetch users' };
    }
  },

  // Get single user
  async getUser(id) {
    try {
      const response = await API.get(`/users/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get user error:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to fetch user' };
    }
  },

  // Update user
  async updateUser(id, updates) {
    try {
      const response = await API.put(`/users/${id}`, updates);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to update user' };
    }
  },

  // Delete user
  async deleteUser(id) {
    try {
      const response = await API.delete(`/users/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Delete user error:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to delete user' };
    }
  },

  // Reset password
  async resetPassword(data) {
    try {
      const response = await API.post('/users/reset-password', data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to reset password' };
    }
  }
};

