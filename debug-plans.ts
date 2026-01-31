
async function main() {
  try {
    const loginRes = await fetch('http://localhost:3001/api/v1/auth/saas-admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@saas.local', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    console.log('Login:', loginData);
    const token = loginData.accessToken;
    
    const plansRes = await fetch('http://localhost:3001/api/v1/admin/plans', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const plansData = await plansRes.json();
    console.log('Plans:', JSON.stringify(plansData, null, 2));
  } catch (e) {
    console.error(e);
  }
}
main();
