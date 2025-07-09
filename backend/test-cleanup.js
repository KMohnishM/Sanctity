// Test script to demonstrate cleanup functionality
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

async function testCleanup() {
  try {
    console.log('🧹 Testing cleanup functionality...\n');
    
    // Trigger manual cleanup
    const response = await axios.post(`${API_BASE_URL}/comments/cleanup/expired`);
    
    console.log('✅ Cleanup completed successfully!');
    console.log(`📊 Deleted ${response.data.deletedCount} expired comments`);
    
    if (response.data.deletedCount > 0) {
      console.log('🗑️  Comments that were not restored within 15 minutes have been permanently deleted from the database.');
    } else {
      console.log('✨ No expired comments found to clean up.');
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.response?.data || error.message);
  }
}

// Run the test
testCleanup(); 