require('dotenv').config();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function checkDomains() {
  console.log('=== Checking Resend Domains via API ===');
  console.log('API Key prefix:', process.env.RESEND_API_KEY?.substring(0, 10) + '...');
  
  try {
    const { data, error } = await resend.domains.list();
    
    if (error) {
      console.error('Error listing domains:', error);
      return;
    }
    
    console.log('\nDomains found:', data?.data?.length || 0);
    if (data?.data) {
      data.data.forEach(d => {
        console.log(`  - ${d.name} | Status: ${d.status} | Region: ${d.region} | ID: ${d.id}`);
      });
    }
  } catch (err) {
    console.error('Exception:', err.message);
  }
}

checkDomains();
