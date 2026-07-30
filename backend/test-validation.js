const { plainToInstance } = require('class-transformer');
const { validate } = require('class-validator');
// We need to require the built file or ts-node
require('ts-node/register');
const { CreateBabyDto } = require('./src/babies/dto/create-baby.dto');

async function main() {
  const payload = {
    mrNumber: "MR123",
    firstName: "John",
    lastName: "Doe",
    dob: "2023-01-01",
    gender: "male",
    motherName: "Jane Doe",
    phone1: "9876543210",
    districtId: "875560bb-d81a-471f-bde7-3ef1a1db76c8",
    hospitalId: "9f3f9828-569f-4d9d-92d4-fc7da25e6e8e",
    // Adding optional fields from RegisterChildPage
    taluk: "Test",
    parentDistrict: "Test",
    parentState: "Tamil Nadu",
    address: "123 Main"
  };

  const dto = plainToInstance(CreateBabyDto, payload);
  const errors = await validate(dto);
  
  if (errors.length > 0) {
    console.log("Validation Failed:");
    errors.forEach(err => console.log(err.property, err.constraints));
  } else {
    console.log("Validation Passed!");
  }
}

main();
