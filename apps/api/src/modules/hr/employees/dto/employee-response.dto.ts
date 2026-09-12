export class LinkedUserSummaryDto {
  id!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  role!: string;
}

export class ManagerSummaryDto {
  id!: string;
  employeeCode!: string;
  firstName!: string;
  lastName!: string;
}

export class EmployeeResponseDto {
  id!: string;
  employeeCode!: string;
  attendanceDeviceId!: number | null;
  firstName!: string;
  lastName!: string;
  fatherName!: string | null;
  motherName!: string | null;
  dateOfBirth!: string | null;
  gender!: 'MALE' | 'FEMALE' | 'OTHERS' | null;
  maritalStatus!: 'SINGLE' | 'MARRIED' | null;
  spouseName!: string | null;
  workEmail!: string | null;
  phone!: string | null;
  altPhone!: string | null;
  emergencyContactName!: string | null;
  emergencyContactPhone!: string | null;
  emergencyContactRelation!: string | null;
  citizenshipNumber!: string | null;
  panNumber!: string | null;
  permanentAddress!: string | null;
  currentAddress!: string | null;
  bankName!: string | null;
  bankBranch!: string | null;
  bankAccountName!: string | null;
  bankAccountNumber!: string | null;
  joinDate!: string | null;
  resignationDate!: string | null;
  designation!: string | null;
  department!: string | null;
  qualification!: string | null;
  pastExperience!: string | null;
  salary!: number | null;
  lastIncrementMonth!: string | null;
  hasSalesTarget!: boolean;
  salesTarget!: number | null;
  yearlySalesTarget!: number | null;
  targetStartDate!: string | null;
  targetEndDate!: string | null;
  status!: 'ACTIVE' | 'INACTIVE';
  photoUrl!: string | null;
  photoFileName!: string | null;
  signatureUrl!: string | null;
  signatureFileName!: string | null;
  userId!: string | null;
  user!: LinkedUserSummaryDto | null;
  managerId!: string | null;
  manager!: ManagerSummaryDto | null;
  createdAt!: Date;
  updatedAt!: Date;
}

export class EmployeeListCountsDto {
  active!: number;
  inactive!: number;
  total!: number;
}

export class EmployeeLookupsDto {
  departments!: string[];
  designations!: string[];
  managers!: ManagerSummaryDto[];
  linkableUsers!: LinkedUserSummaryDto[];
}
