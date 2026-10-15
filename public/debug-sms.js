/**
 * Frontend SMS Campaigns Debugger
 * Copy and paste this into browser console on the SMS Campaigns page
 */

// Debug function to check SMS campaigns setup
window.debugSMSCampaigns = async function() {
  console.log('🔍 Debugging SMS Campaigns Setup...\n');
  
  // Check localStorage
  const token = localStorage.getItem('token');
  const domain = localStorage.getItem('domain');
  const selectedDomain = localStorage.getItem('selectedDomain');
  
  console.log('📦 LocalStorage Check:');
  console.log(`   Token: ${token ? '✅ Present' : '❌ Missing'}`);
  console.log(`   Domain: ${domain || 'Not set'}`);
  console.log(`   Selected Domain: ${selectedDomain || 'Not set'}`);
  console.log('');
  
  // Check API base URL
  const apiBase = import.meta?.env?.VITE_API_BASE || 'http://localhost:4000/api';
  console.log(`🌐 API Base URL: ${apiBase}`);
  console.log('');
  
  if (!token) {
    console.log('❌ No authentication token found. Please login first.');
    return;
  }
  
  // Test API calls
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'x-domain': domain || 'restaurant'
  };
  
  try {
    // Test customers endpoint
    console.log('📞 Testing customers endpoint...');
    const customersResponse = await fetch(`${apiBase}/campaigns/customers`, { headers });
    
    if (customersResponse.ok) {
      const customers = await customersResponse.json();
      console.log(`✅ Customers API working: ${customers.length} customers found`);
      
      if (customers.length === 0) {
        console.log('⚠️ No customers in database. To fix:');
        console.log('   1. Place orders with mobile numbers');
        console.log('   2. Or run: npm run create:customers (in backend)');
      } else {
        console.log('👥 Sample customers:');
        customers.slice(0, 3).forEach(c => {
          console.log(`   - ${c.name}: ${c.phone} (${c.totalOrders} orders)`);
        });
      }
    } else {
      const errorText = await customersResponse.text();
      console.log(`❌ Customers API failed: ${customersResponse.status} - ${errorText}`);
    }
    console.log('');
    
    // Test campaigns endpoint
    console.log('📱 Testing campaigns endpoint...');
    const campaignsResponse = await fetch(`${apiBase}/campaigns`, { headers });
    
    if (campaignsResponse.ok) {
      const campaigns = await campaignsResponse.json();
      console.log(`✅ Campaigns API working: ${campaigns.length} campaigns found`);
    } else {
      const errorText = await campaignsResponse.text();
      console.log(`❌ Campaigns API failed: ${campaignsResponse.status} - ${errorText}`);
    }
    console.log('');
    
    // Test analytics endpoint
    console.log('📊 Testing analytics endpoint...');
    const analyticsResponse = await fetch(`${apiBase}/campaigns/analytics`, { headers });
    
    if (analyticsResponse.ok) {
      const analytics = await analyticsResponse.json();
      console.log('✅ Analytics API working:', analytics);
    } else {
      const errorText = await analyticsResponse.text();
      console.log(`❌ Analytics API failed: ${analyticsResponse.status} - ${errorText}`);
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
  
  console.log('\n🔧 Common Issues & Solutions:');
  console.log('1. No customers showing:');
  console.log('   → Create customers by placing orders with mobile numbers');
  console.log('   → Or run backend script: npm run create:customers');
  console.log('');
  console.log('2. API errors:');
  console.log('   → Check if backend server is running (localhost:4000)');
  console.log('   → Verify authentication token is valid');
  console.log('   → Check domain header matches backend expectation');
  console.log('');
  console.log('3. UI not loading:');
  console.log('   → Check browser console for React errors');
  console.log('   → Verify UI components are properly imported');
};

// Auto-run if on SMS campaigns page
if (window.location.pathname.includes('sms-campaigns')) {
  console.log('🎯 SMS Campaigns page detected!');
  console.log('💡 Run debugSMSCampaigns() to check setup');
} else {
  console.log('ℹ️  Navigate to SMS Campaigns page and run debugSMSCampaigns()');
}