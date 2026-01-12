// Simple test script to verify backend connection
import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

async function testConnection() {
  try {
    console.log('Testing backend connection...');
    
    // Test health endpoint
    const healthResponse = await axios.get('http://localhost:4000/');
    console.log('✅ Backend health check:', healthResponse.data);
    
    // Test API endpoint
    const apiResponse = await axios.get(`${API_BASE_URL}/users`);
    console.log('✅ API endpoint test:', apiResponse.status);
    
    console.log('🎉 Backend connection successful!');
  } catch (error) {
    console.error('❌ Backend connection failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('Make sure the backend server is running on port 4000');
    }
  }
}

testConnection();
