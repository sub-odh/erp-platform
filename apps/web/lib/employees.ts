import { apiRequest } from "@/lib/api";
import type {
  Employee,
  EmployeeDirectoryItem,
  EmployeeInput,
  EmployeeListQuery,
  EmployeeLookups,
  PaginatedEmployeesResponse,
} from "@/types/employee";

function queryString(query: EmployeeListQuery): string {
  const params = new URLSearchParams();

  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.department) params.set("department", query.department);
  if (query.designation) params.set("designation", query.designation);
  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.sortBy) params.set("sortBy", query.sortBy);
  if (query.sortDirection) params.set("sortDirection", query.sortDirection);

  const value = params.toString();

  return value ? `?${value}` : "";
}

export function getEmployees(query: EmployeeListQuery = {}) {
  return apiRequest<PaginatedEmployeesResponse>(
    `/hr/employees${queryString(query)}`,
  );
}

export function getEmployeeLookups(excludeEmployeeId?: string) {
  const query = excludeEmployeeId
    ? `?excludeEmployeeId=${encodeURIComponent(excludeEmployeeId)}`
    : "";

  return apiRequest<EmployeeLookups>(`/hr/employees/lookups${query}`);
}

export function getMyEmployee() {
  return apiRequest<Employee>("/hr/employees/me");
}

export function getEmployeeDirectory() {
  return apiRequest<EmployeeDirectoryItem[]>("/hr/employees/directory");
}

export function getEmployee(employeeId: string) {
  return apiRequest<Employee>(`/hr/employees/${employeeId}`);
}

export function createEmployee(payload: EmployeeInput) {
  return apiRequest<Employee>("/hr/employees", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateEmployee(employeeId: string, payload: EmployeeInput) {
  return apiRequest<Employee>(`/hr/employees/${employeeId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deactivateEmployee(employeeId: string) {
  return apiRequest<Employee>(`/hr/employees/${employeeId}/deactivate`, {
    method: "POST",
  });
}

export function restoreEmployee(employeeId: string) {
  return apiRequest<Employee>(`/hr/employees/${employeeId}/restore`, {
    method: "POST",
  });
}

export function uploadEmployeePhoto(employeeId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<Employee>(`/hr/employees/${employeeId}/photo`, {
    method: "POST",
    body: formData,
  });
}

export function removeEmployeePhoto(employeeId: string) {
  return apiRequest<Employee>(`/hr/employees/${employeeId}/photo`, {
    method: "DELETE",
  });
}

export function uploadEmployeeSignature(employeeId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<Employee>(`/hr/employees/${employeeId}/signature`, {
    method: "POST",
    body: formData,
  });
}

export function removeEmployeeSignature(employeeId: string) {
  return apiRequest<Employee>(`/hr/employees/${employeeId}/signature`, {
    method: "DELETE",
  });
}

export function employeeFullName(employee: {
  firstName: string;
  lastName: string;
}): string {
  return `${employee.firstName} ${employee.lastName}`.trim();
}
