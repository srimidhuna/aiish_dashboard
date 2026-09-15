const axios = require('axios');
async function test() {
  try {
    const res = await axios.post('http://localhost:3000/api/v1/screening', {
      babyId: "00000000-0000-0000-0000-000000000000",
      type: "initial",
      status: "completed",
      teoaeRight: "pass",
      teoaeLeft: "pass",
      overallResult: "pass"
    });
    console.log(res.data);
  } catch(e) {
    console.log(e.response?.status, e.response?.data);
  }
}
test();
