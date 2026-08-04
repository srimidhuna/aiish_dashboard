const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:3000/api/v1/screening', {
      babyId: "f07d2f93-5f09-4629-9e11-e40cf726ffea", // Replace with a real babyId if possible, but let's see if it fails on schema validation first
      status: "scheduled",
      type: "rescreening",
      dueDate: "2026-08-02T00:00:00.000Z",
      remarks: "Scheduled for AABR - 2nd Screening"
    }, {
      headers: {
        'Content-Type': 'application/json',
        // Need auth token if required, wait, the API might require a cookie.
      }
    });
    console.log(res.data);
  } catch (err) {
    console.log("Error status:", err.response?.status);
    console.log("Error data:", err.response?.data);
  }
}

test();
