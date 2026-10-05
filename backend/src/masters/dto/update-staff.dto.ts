import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateStaffDto } from './create-staff.dto';

export class UpdateStaffDto extends PartialType(CreateStaffDto) {}
