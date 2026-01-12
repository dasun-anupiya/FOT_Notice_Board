import API from '../api';

export const noticesService = {
  // Get all notices
  async getAllNotices(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.who) params.append('who', filters.who);
      if (filters.mine) params.append('mine', String(filters.mine));
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      
      const response = await API.get(`/notices?${params.toString()}`);
      // Sort by LastUpdatedTimeStamp (most recent first)
      const sortedData = (response.data || []).sort((a, b) => {
        const dateA = new Date(a.LastUpdatedTimeStamp || a.CreatedTimeStamp || 0);
        const dateB = new Date(b.LastUpdatedTimeStamp || b.CreatedTimeStamp || 0);
        return dateB - dateA; // Descending order (newest first)
      });
      return { success: true, data: sortedData };
    } catch (error) {
      console.error('Get notices error:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to fetch notices' };
    }
  },

  // Get single notice
  async getNotice(id) {
    try {
      const response = await API.get(`/notices/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get notice error:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to fetch notice' };
    }
  },

  // Create notice
  async createNotice(noticeData, files = []) {
    try {
      const formData = new FormData();
      
      // Add text fields
      Object.keys(noticeData).forEach(key => {
        if (noticeData[key] !== null && noticeData[key] !== undefined) {
          const value = typeof noticeData[key] === 'object' 
            ? JSON.stringify(noticeData[key]) 
            : noticeData[key];
          formData.append(key, value);
          console.log(`Added form field: ${key} = ${value}`);
        }
      });
      
      // Add files
      files.forEach(file => {
        formData.append('files', file);
        console.log(`Added file: ${file.name}`);
      });
      
      console.log('Sending notice creation request...');
      const response = await API.post('/notices', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log('Notice created successfully:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Create notice error:', error);
      console.error('Error response:', error.response?.data);
      return { 
        success: false, 
        error: error.response?.data?.message || error.response?.data?.error || 'Failed to create notice',
        details: error.response?.data 
      };
    }
  },

  // Update notice
  async updateNotice(id, updates) {
    try {
      const response = await API.put(`/notices/${id}`, updates);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Update notice error:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to update notice' };
    }
  },

  // Delete notice
  async deleteNotice(id) {
    try {
      const response = await API.delete(`/notices/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Delete notice error:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to delete notice' };
    }
  },

  // Add response to notice
  async addResponse(noticeId, responseText) {
    try {
      const response = await API.post(`/notices/${noticeId}/responses`, {
        Response: responseText
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Add response error:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to add response' };
    }
  },

  // Get notice responses
  async getNoticeResponses(noticeId) {
    try {
      const response = await API.get(`/notices/${noticeId}/responses`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get responses error:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to fetch responses' };
    }
  },

  // Update response
  async updateResponse(responseId, responseText) {
    try {
      const response = await API.put(`/notices/responses/${responseId}`, {
        Response: responseText
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Update response error:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to update response' };
    }
  },

  // Delete response
  async deleteResponse(responseId) {
    try {
      const response = await API.delete(`/notices/responses/${responseId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Delete response error:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to delete response' };
    }
  },

  // Get all responses (for Staff/Admin)
  async getAllResponses(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.noticeId) params.append('noticeId', filters.noticeId);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      
      const response = await API.get(`/notices/responses/all?${params.toString()}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get all responses error:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to fetch responses' };
    }
  },

  // Admin: Approve/Reject/Expire/Publish notice
  async adminAction(noticeId, action) {
    try {
      const response = await API.post(`/notices/${noticeId}/action`, { action });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Admin action error:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to perform action' };
    }
  },

  // Convenience functions for common actions
  async approveNotice(noticeId) {
    return this.adminAction(noticeId, 'approve');
  },

  async rejectNotice(noticeId) {
    return this.adminAction(noticeId, 'reject');
  },

  async publishNotice(noticeId) {
    return this.adminAction(noticeId, 'publish');
  },

  async unpublishNotice(noticeId) {
    try {
      // Unpublish by calling adminAction with 'unpublish' action
      return this.adminAction(noticeId, 'unpublish');
    } catch (error) {
      console.error('Unpublish notice error:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to unpublish notice' };
    }
  },

  async expireNotice(noticeId) {
    return this.adminAction(noticeId, 'expire');
  }
};

