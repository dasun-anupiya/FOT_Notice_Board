import API from '../api';

export const reportsService = {
    // User Reports
    async getUsersByType() {
        try {
            const response = await API.get('/reports/users/by-type');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Report error:', error);
            return { success: false, error: error.message };
        }
    },
    async getRecentUsers() {
        try {
            const response = await API.get('/reports/users/recent');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Report error:', error);
            return { success: false, error: error.message };
        }
    },
    async getInactiveUsers() {
        try {
            const response = await API.get('/reports/users/inactive');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Report error:', error);
            return { success: false, error: error.message };
        }
    },

    // Notice Reports
    async getNoticeStats() {
        try {
            const response = await API.get('/reports/notices/stats');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Report error:', error);
            return { success: false, error: error.message };
        }
    },
    async getActiveNotices() {
        try {
            const response = await API.get('/reports/notices/active');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Report error:', error);
            return { success: false, error: error.message };
        }
    },
    async getNoticesByCreator() {
        try {
            const response = await API.get('/reports/notices/by-creator');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Report error:', error);
            return { success: false, error: error.message };
        }
    },
    async getEngagementStats() {
        try {
            const response = await API.get('/reports/notices/engagement');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Report error:', error);
            return { success: false, error: error.message };
        }
    },

    // Polls
    async getPollReport() {
        try {
            const response = await API.get('/reports/polls/report');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Report error:', error);
            return { success: false, error: error.message };
        }
    },

    // System
    async getSystemSummary() {
        try {
            const response = await API.get('/reports/system/summary');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Report error:', error);
            return { success: false, error: error.message };
        }
    }
};
