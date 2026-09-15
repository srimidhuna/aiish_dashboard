
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const states = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];
async function main() {
  let count = 0;
  for (const name of states) {
    const s = await prisma.state.findUnique({ where: { name } });
    if (!s) {
      await prisma.state.create({ data: { name } });
      count++;
    }
  }
  console.log('Added ' + count + ' states.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
