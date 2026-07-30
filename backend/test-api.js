const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const district = await prisma.district.findFirst();
    const hospital = await prisma.hospital.findFirst();

    if (!district || !hospital) {
      console.log('No district or hospital found');
      return;
    }

    // Attempt login
    const loginRes = await fetch('http://localhost:3001/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@aiish.in', password: 'Admin@12345' })
    });

    if (!loginRes.ok) {
      console.error('Login failed', await loginRes.text());
      return;
    }

    const setCookie = loginRes.headers.get('set-cookie');
    const cookie = setCookie ? setCookie.split(';')[0] : '';
    
    console.log('Logged in', cookie ? 'with cookie' : 'without cookie');

    const actualPayload = {
      "firstName": "John",
      "lastName": "Doe",
      "dob": "2023-01-01",
      "gender": "male",
      "motherName": "Jane Doe",
      "phone1": "9876543210",
      "districtId": district.id,
      "hospitalId": hospital.id,
      "address": "123 Test",
      "taluk": "Test",
      "parentDistrict": "Test",
      "parentState": "Tamil Nadu",
      "riskFactorIds": [],
      "assessment": {
        "familyHistoryHearingLoss": false,
        "caregiverConcern": false
      }
    };
    
    const res = await fetch('http://localhost:3001/api/v1/babies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie
      },
      body: JSON.stringify(actualPayload)
    });

    if (!res.ok) {
      console.error('API Error:', res.status, await res.json());
    } else {
      const data = await res.json();
      console.log('Success:', data.id);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
