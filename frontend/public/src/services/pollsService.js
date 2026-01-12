import API from '../api';

export const pollsService = {
  // Get all polls
  async getAllPolls(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      
      const response = await API.get(`/polls?${params.toString()}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get polls error:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to fetch polls' };
    }
  },

  // Get single poll
  async getPoll(id) {
    try {
      const response = await API.get(`/polls/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get poll error:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to fetch poll' };
    }
  },

  // Create poll
  async createPoll(pollData) {
    try {
      const response = await API.post('/polls', pollData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Create poll error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to create poll',
        details: error.response?.data 
      };
    }
  },

  // Vote on poll
  async votePoll(pollId, optionId) {
    try {
      const response = await API.post(`/polls/${pollId}/vote`, {
        OptionID: optionId
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Vote poll error:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to vote' };
    }
  },

  // Get poll results
  async getPollResults(pollId) {
    try {
      const response = await API.get(`/polls/${pollId}/results`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get poll results error:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to fetch poll results' };
    }
  },

  // Update poll
  async updatePoll(id, updates) {
    try {
      const response = await API.put(`/polls/${id}`, updates);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Update poll error:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to update poll' };
    }
  },

  // Delete poll
  async deletePoll(id) {
    try {
      const response = await API.delete(`/polls/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Delete poll error:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to delete poll' };
    }
  },

  // Admin action (approve/reject/publish/expire)
  async adminAction(pollId, action) {
    try {
      const response = await API.post(`/polls/${pollId}/action`, { action });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Admin action error:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to perform action' };
    }
  }
};
