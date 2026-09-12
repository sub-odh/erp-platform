export type EmployeeGender = "MALE" | "FEMALE" | "OTHERS";
export type EmployeeMaritalStatus = "SINGLE" | "MARRIED";
export type EmployeeStatus = "ACTIVE" | "INACTIVE";
export type EmployeeListStatus = "all" | "active" | "inactive";

export interface LinkedUserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface ManagerSummary {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  attendanceDeviceId: number | null;
  firstName: string;
  lastName: string;
  fatherName: string | null;
  motherName: string | null;
  dateOfBirth: string | null;
  gender: EmployeeGender | null;
  maritalStatus: EmployeeMaritalStatus | null;
  spouseName: string | null;
  workEmail: string | null;
  phone: string | null;
  altPhone: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  citizenshipNumber: string | null;
  panNumber: string | null;
  permanentAddress: string | null;
  currentAddress: string | null;
  bankName: string | null;
  bankBranch: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  joinDate: string | null;
  resignationDate: string | null;
  designation: string | null;
  department: string | null;
  qualification: string | null;
  pastExperience: string | null;
  salary: number | null;
  lastIncrementMonth: string | null;
  hasSalesTarget: boolean;
  salesTarget: number | null;
  yearlySalesTarget: number | null;
  targetStartDate: string | null;
  targetEndDate: string | null;
  status: EmployeeStatus;
  photoUrl: string | null;
  photoFileName: string | null;
  signatureUrl: string | null;
  signatureFileName: string | null;
  userId: string | null;
  user: LinkedUserSummary | null;
  managerId: string | null;
  manager: ManagerSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeListCounts {
  active: number;
  inactive: number;
  total: number;
}

export interface EmployeeLookups {
  departments: string[];
  designations: string[];
  managers: ManagerSummary[];
  linkableUsers: LinkedUserSummary[];
}

export type EmployeeSortField =
  | "employeeCode"
  | "firstName"
  | "department"
  | "designation"
  | "joinDate"
  | "createdAt";

export interface EmployeeListQuery {
  search?: string;
  status?: EmployeeListStatus;
  department?: string;
  designation?: string;
  page?: number;
  limit?: number;
  sortBy?: EmployeeSortField;
  sortDirection?: "asc" | "desc";
}

export interface PaginatedEmployeesResponse {
  data: Employee[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  counts: EmployeeListCounts;
}

export type EmployeeInput = {
  employeeCode: string;
  firstName: string;
  lastName: string;
  userId?: string | null;
  attendanceDeviceId?: number | null;
  fatherName?: string | null;
  motherName?: string | null;
  dateOfBirth?: string | null;
  gender?: EmployeeGender | null;
  maritalStatus?: EmployeeMaritalStatus | null;
  spouseName?: string | null;
  workEmail?: string | null;
  phone?: string | null;
  altPhone?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  citizenshipNumber?: string | null;
  panNumber?: string | null;
  permanentAddress?: string | null;
  currentAddress?: string | null;
  bankName?: string | null;
  bankBranch?: string | null;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  joinDate?: string | null;
  resignationDate?: string | null;
  designation?: string | null;
  department?: string | null;
  qualification?: string | null;
  pastExperience?: string | null;
  salary?: number | null;
  managerId?: string | null;
  lastIncrementMonth?: string | null;
  hasSalesTarget?: boolean;
  salesTarget?: number | null;
  yearlySalesTarget?: number | null;
  targetStartDate?: string | null;
  targetEndDate?: string | null;
};
