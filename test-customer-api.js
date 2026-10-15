/**
 * Customer Management API Test Script
 * Tests all the new customer management endpoints
 */

const API_BASE = 'http://localhost:5000/api';

// Test data
const testCustomers = [
  { name: 'John Doe', phone: '0771234567' },
  { name: 'Jane Smith', phone: '94779876543' },
  { name: 'Bob Johnson', phone: '+94766555444' }
];

async function testCustomerManagement() {
  console.log('🧪 Testing Customer Management API...\n');
  
  try {
    // Test 1: Phone validation
    console.log('📱 Testing phone validation...');
    const validationResponse = await fetch(`${API_BASE}/campaigns/customers/validate-phone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add your auth token here if needed
        // 'Authorization': 'Bearer YOUR_TOKEN'
      },
      body: JSON.stringify({ phone: '0771234567' })
    });
    
    if (validationResponse.ok) {
      const validationData = await validationResponse.json();
      console.log('✅ Phone validation:', validationData);
    } else {
      console.log('❌ Phone validation failed:', await validationResponse.text());
    }
    
    // Test 2: Add single customer
    console.log('\n👤 Testing single customer addition...');
    const singleCustomerResponse = await fetch(`${API_BASE}/campaigns/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add your auth token here if needed
      },
      body: JSON.stringify(testCustomers[0])
    });
    
    if (singleCustomerResponse.ok) {
      const customerData = await singleCustomerResponse.json();
      console.log('✅ Single customer added:', customerData);
    } else {
      const error = await singleCustomerResponse.json();
      console.log('❌ Single customer addition failed:', error.message);
    }
    
    // Test 3: Bulk add customers
    console.log('\n👥 Testing bulk customer addition...');
    const bulkCustomerResponse = await fetch(`${API_BASE}/campaigns/customers/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add your auth token here if needed
      },
      body: JSON.stringify({ customers: testCustomers.slice(1) })
    });
    
    if (bulkCustomerResponse.ok) {
      const bulkData = await bulkCustomerResponse.json();
      console.log('✅ Bulk customers added:', bulkData.summary);
    } else {
      const error = await bulkCustomerResponse.json();
      console.log('❌ Bulk customer addition failed:', error.message);
    }
    
    // Test 4: Get all customers
    console.log('\n📋 Testing customer list retrieval...');
    const customersResponse = await fetch(`${API_BASE}/campaigns/customers`, {
      headers: {
        // Add your auth token here if needed
      }
    });
    
    if (customersResponse.ok) {
      const customers = await customersResponse.json();
      console.log(`✅ Retrieved ${customers.length} customers`);
      
      if (customers.length > 0) {
        const testCustomerId = customers[0]._id;
        
        // Test 5: Update customer
        console.log('\n✏️ Testing customer update...');
        const updateResponse = await fetch(`${API_BASE}/campaigns/customers/${testCustomerId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            // Add your auth token here if needed
          },
          body: JSON.stringify({ name: 'Updated Name' })
        });
        
        if (updateResponse.ok) {
          const updateData = await updateResponse.json();
          console.log('✅ Customer updated:', updateData.message);
        } else {
          const error = await updateResponse.json();
          console.log('❌ Customer update failed:', error.message);
        }
      }
    } else {
      const error = await customersResponse.json();
      console.log('❌ Customer list retrieval failed:', error.message);
    }
    
    console.log('\n🎉 Customer Management API testing completed!');
    
  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
  }
}

// Instructions for running
console.log(`
🚀 Customer Management API Test
=================================

To run this test:

1. Make sure your backend server is running on http://localhost:5000
2. Update the API_BASE URL if your server runs on a different port
3. Add authentication headers if your API requires them
4. Open browser console or run with Node.js

Testing endpoints:
- POST /api/campaigns/customers/validate-phone
- POST /api/campaigns/customers
- POST /api/campaigns/customers/bulk
- GET /api/campaigns/customers
- PUT /api/campaigns/customers/:id

Phone number formats tested:
- Local: 0771234567
- E.164: 94779876543
- International: +94766555444
`);

// Uncomment the line below to run the test automatically
// testCustomerManagement();

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testCustomerManagement };
}