"use client";

import { type FormEvent, useMemo, useState } from "react";

import { ImageUploader } from "@/components/media";
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { CURRENCY_SYMBOL } from "@/lib/currency";
import type {
  Employee,
  EmployeeGender,
  EmployeeInput,
  EmployeeLookups,
  EmployeeMaritalStatus,
} from "@/types/employee";

export interface EmployeeFormSubmit {
  payload: EmployeeInput;
  photoFile: File | null;
  signatureFile: File | null;
}

interface EmployeeFormProps {
  mode: "create" | "edit";
  lookups: EmployeeLookups;
  employee?: Employee | null;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (value: EmployeeFormSubmit) => Promise<void> | void;
  onUploadPhoto?: (file: File) => Promise<void>;
  onRemovePhoto?: () => Promise<void>;
  onUploadSignature?: (file: File) => Promise<void>;
  onRemoveSignature?: () => Promise<void>;
  mediaBusy?: boolean;
}

interface FormState {
  employeeCode: string;
  firstName: string;
  lastName: string;
  userId: string;
  attendanceDeviceId: string;
  fatherName: string;
  motherName: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  spouseName: string;
  workEmail: string;
  phone: string;
  altPhone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  citizenshipNumber: string;
  panNumber: string;
  permanentAddress: string;
  currentAddress: string;
  bankName: string;
  bankBranch: string;
  bankAccountName: string;
  bankAccountNumber: string;
  joinDate: string;
  resignationDate: string;
  designation: string;
  department: string;
  qualification: string;
  pastExperience: string;
  salary: string;
  managerId: string;
  lastIncrementMonth: string;
  hasSalesTarget: boolean;
  salesTarget: string;
  yearlySalesTarget: string;
  targetStartDate: string;
  targetEndDate: string;
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function emptyToNumber(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function fromEmployee(employee?: Employee | null): FormState {
  return {
    employeeCode: employee?.employeeCode ?? "",
    firstName: employee?.firstName ?? "",
    lastName: employee?.lastName ?? "",
    userId: employee?.userId ?? "",
    attendanceDeviceId:
      employee?.attendanceDeviceId != null
        ? String(employee.attendanceDeviceId)
        : "",
    fatherName: employee?.fatherName ?? "",
    motherName: employee?.motherName ?? "",
    dateOfBirth: employee?.dateOfBirth ?? "",
    gender: employee?.gender ?? "",
    maritalStatus: employee?.maritalStatus ?? "SINGLE",
    spouseName: employee?.spouseName ?? "",
    workEmail: employee?.workEmail ?? "",
    phone: employee?.phone ?? "",
    altPhone: employee?.altPhone ?? "",
    emergencyContactName: employee?.emergencyContactName ?? "",
    emergencyContactPhone: employee?.emergencyContactPhone ?? "",
    emergencyContactRelation: employee?.emergencyContactRelation ?? "",
    citizenshipNumber: employee?.citizenshipNumber ?? "",
    panNumber: employee?.panNumber ?? "",
    permanentAddress: employee?.permanentAddress ?? "",
    currentAddress: employee?.currentAddress ?? "",
    bankName: employee?.bankName ?? "",
    bankBranch: employee?.bankBranch ?? "",
    bankAccountName: employee?.bankAccountName ?? "",
    bankAccountNumber: employee?.bankAccountNumber ?? "",
    joinDate: employee?.joinDate ?? "",
    resignationDate: employee?.resignationDate ?? "",
    designation: employee?.designation ?? "",
    department: employee?.department ?? "",
    qualification: employee?.qualification ?? "",
    pastExperience: employee?.pastExperience ?? "",
    salary: employee?.salary != null ? String(employee.salary) : "",
    managerId: employee?.managerId ?? "",
    lastIncrementMonth: employee?.lastIncrementMonth ?? "",
    hasSalesTarget: employee?.hasSalesTarget ?? false,
    salesTarget:
      employee?.salesTarget != null ? String(employee.salesTarget) : "",
    yearlySalesTarget:
      employee?.yearlySalesTarget != null
        ? String(employee.yearlySalesTarget)
        : "",
    targetStartDate: employee?.targetStartDate ?? "",
    targetEndDate: employee?.targetEndDate ?? "",
  };
}

export function EmployeeForm({
  mode,
  lookups,
  employee,
  submitting = false,
  onCancel,
  onSubmit,
  onUploadPhoto,
  onRemovePhoto,
  onUploadSignature,
  onRemoveSignature,
  mediaBusy = false,
}: EmployeeFormProps) {
  const [form, setForm] = useState<FormState>(() => fromEmployee(employee));
  const [error, setError] = useState<string | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [pendingSignature, setPendingSignature] = useState<File | null>(null);

  const managerOptions = lookups.managers;
  const userOptions = useMemo(() => {
    const options = [...lookups.linkableUsers];

    if (employee?.user && !options.some((user) => user.id === employee.user?.id)) {
      options.unshift(employee.user);
    }

    return options;
  }, [employee?.user, lookups.linkableUsers]);

  const designationOptions = useMemo(() => {
    const values = [...lookups.designations];

    if (form.designation && !values.includes(form.designation)) {
      values.unshift(form.designation);
    }

    return values;
  }, [form.designation, lookups.designations]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.employeeCode.trim() || !form.firstName.trim() || !form.lastName.trim()) {
      setError("Employee code, first name, and last name are required.");
      return;
    }

    if (form.joinDate && form.resignationDate && form.resignationDate < form.joinDate) {
      setError("Resignation date cannot be earlier than the joining date.");
      return;
    }

    if (
      form.targetStartDate &&
      form.targetEndDate &&
      form.targetEndDate < form.targetStartDate
    ) {
      setError("Target end date cannot be earlier than the start date.");
      return;
    }

    const maritalStatus = (emptyToNull(form.maritalStatus) ??
      "SINGLE") as EmployeeMaritalStatus;

    const payload: EmployeeInput = {
      employeeCode: form.employeeCode.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      userId: emptyToNull(form.userId),
      attendanceDeviceId: emptyToNumber(form.attendanceDeviceId),
      fatherName: emptyToNull(form.fatherName),
      motherName: emptyToNull(form.motherName),
      dateOfBirth: emptyToNull(form.dateOfBirth),
      gender: emptyToNull(form.gender) as EmployeeGender | null,
      maritalStatus,
      spouseName:
        maritalStatus === "MARRIED" ? emptyToNull(form.spouseName) : null,
      workEmail: emptyToNull(form.workEmail),
      phone: emptyToNull(form.phone),
      altPhone: emptyToNull(form.altPhone),
      emergencyContactName: emptyToNull(form.emergencyContactName),
      emergencyContactPhone: emptyToNull(form.emergencyContactPhone),
      emergencyContactRelation: emptyToNull(form.emergencyContactRelation),
      citizenshipNumber: emptyToNull(form.citizenshipNumber),
      panNumber: emptyToNull(form.panNumber),
      permanentAddress: emptyToNull(form.permanentAddress),
      currentAddress: emptyToNull(form.currentAddress),
      bankName: emptyToNull(form.bankName),
      bankBranch: emptyToNull(form.bankBranch),
      bankAccountName: emptyToNull(form.bankAccountName),
      bankAccountNumber: emptyToNull(form.bankAccountNumber),
      joinDate: emptyToNull(form.joinDate),
      resignationDate: emptyToNull(form.resignationDate),
      designation: emptyToNull(form.designation),
      department: emptyToNull(form.department),
      qualification: emptyToNull(form.qualification),
      pastExperience: emptyToNull(form.pastExperience),
      salary: emptyToNumber(form.salary),
      managerId: emptyToNull(form.managerId),
      lastIncrementMonth: emptyToNull(form.lastIncrementMonth),
      hasSalesTarget: form.hasSalesTarget,
      salesTarget: form.hasSalesTarget ? emptyToNumber(form.salesTarget) : null,
      yearlySalesTarget: form.hasSalesTarget
        ? emptyToNumber(form.yearlySalesTarget)
        : null,
      targetStartDate: form.hasSalesTarget
        ? emptyToNull(form.targetStartDate)
        : null,
      targetEndDate: form.hasSalesTarget ? emptyToNull(form.targetEndDate) : null,
    };

    try {
      await onSubmit({
        payload,
        photoFile: pendingPhoto,
        signatureFile: pendingSignature,
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save this employee.",
      );
    }
  }

  const isCreate = mode === "create";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex justify-center py-2">
        <ImageUploader
          preset="avatar"
          value={employee?.photoUrl}
          emptyLabel="Add Photo"
          uploading={mediaBusy}
          removing={mediaBusy}
          disabled={submitting}
          deferUpload={isCreate}
          onCroppedFileChange={isCreate ? setPendingPhoto : undefined}
          onUpload={isCreate ? undefined : onUploadPhoto}
          onRemove={isCreate ? undefined : onRemovePhoto}
        />
      </div>

      <Card>
        <CardHeader
          title="Job Information"
          description="Company employment record. The job title is not a system permission."
        />
        <CardContent className="grid gap-5 md:grid-cols-2">
          <Input
            label="Employee Code"
            required
            value={form.employeeCode}
            onChange={(event) => update("employeeCode", event.target.value)}
            placeholder="007"
          />
          <Input
            label="Attendance Device ID"
            type="number"
            min={1}
            value={form.attendanceDeviceId}
            onChange={(event) => update("attendanceDeviceId", event.target.value)}
            placeholder="Optional device number"
          />
          <Input
            label="First Name"
            required
            value={form.firstName}
            onChange={(event) => update("firstName", event.target.value)}
          />
          <Input
            label="Last Name"
            required
            value={form.lastName}
            onChange={(event) => update("lastName", event.target.value)}
          />
          <Select
            label="Designation"
            value={form.designation}
            onChange={(event) => update("designation", event.target.value)}
          >
            <option value="">Select Designation</option>
            {designationOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
          <Input
            label="Department"
            value={form.department}
            onChange={(event) => update("department", event.target.value)}
            list="employee-departments"
            placeholder="Information Technology"
          />
          <datalist id="employee-departments">
            {lookups.departments.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          <Select
            label="Reporting Manager"
            value={form.managerId}
            onChange={(event) => update("managerId", event.target.value)}
          >
            <option value="">No Reporting Manager</option>
            {managerOptions.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.employeeCode} — {manager.firstName} {manager.lastName}
              </option>
            ))}
          </Select>
          <Input
            label="Joining Date"
            type="date"
            value={form.joinDate}
            onChange={(event) => update("joinDate", event.target.value)}
          />
          <Input
            label="Resignation Date"
            type="date"
            value={form.resignationDate}
            onChange={(event) => update("resignationDate", event.target.value)}
          />
          <Input
            label={`Salary (${CURRENCY_SYMBOL})`}
            type="number"
            min={0}
            step="0.01"
            value={form.salary}
            onChange={(event) => update("salary", event.target.value)}
          />
          <Input
            label="Last Increment Month"
            type="month"
            value={form.lastIncrementMonth}
            onChange={(event) => update("lastIncrementMonth", event.target.value)}
          />
          <Select
            label="Linked User Account"
            value={form.userId}
            onChange={(event) => update("userId", event.target.value)}
            hint="Optional login account from this company. Passwords stay on the user record."
            wrapperClassName="md:col-span-2"
          >
            <option value="">Not Linked</option>
            {userOptions.map((user) => (
              <option key={user.id} value={user.id}>
                {user.firstName} {user.lastName} ({user.email})
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Personal Information"
          description="Identity and family details for the employee profile."
        />
        <CardContent className="grid gap-5 md:grid-cols-2">
          <Input
            label="Date of Birth"
            type="date"
            value={form.dateOfBirth}
            onChange={(event) => update("dateOfBirth", event.target.value)}
          />
          <Select
            label="Gender"
            value={form.gender}
            onChange={(event) => update("gender", event.target.value)}
          >
            <option value="">Select Gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHERS">Others</option>
          </Select>
          <Select
            label="Marital Status"
            value={form.maritalStatus}
            onChange={(event) => update("maritalStatus", event.target.value)}
          >
            <option value="SINGLE">Single</option>
            <option value="MARRIED">Married</option>
          </Select>
          {form.maritalStatus === "MARRIED" ? (
            <Input
              label="Spouse Name"
              value={form.spouseName}
              onChange={(event) => update("spouseName", event.target.value)}
            />
          ) : null}
          <Input
            label="Father Name"
            value={form.fatherName}
            onChange={(event) => update("fatherName", event.target.value)}
          />
          <Input
            label="Mother Name"
            value={form.motherName}
            onChange={(event) => update("motherName", event.target.value)}
          />
          <Input
            label="Citizenship Number"
            value={form.citizenshipNumber}
            onChange={(event) => update("citizenshipNumber", event.target.value)}
          />
          <Input
            label="PAN Number"
            value={form.panNumber}
            onChange={(event) => update("panNumber", event.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Contact Information" />
        <CardContent className="grid gap-5 md:grid-cols-2">
          <Input
            label="Work Email"
            type="email"
            value={form.workEmail}
            onChange={(event) => update("workEmail", event.target.value)}
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(event) => update("phone", event.target.value)}
          />
          <Input
            label="Alternate Phone"
            value={form.altPhone}
            onChange={(event) => update("altPhone", event.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Emergency Contact" />
        <CardContent className="grid gap-5 md:grid-cols-3">
          <Input
            label="Contact Name"
            value={form.emergencyContactName}
            onChange={(event) =>
              update("emergencyContactName", event.target.value)
            }
          />
          <Input
            label="Contact Phone"
            value={form.emergencyContactPhone}
            onChange={(event) =>
              update("emergencyContactPhone", event.target.value)
            }
          />
          <Input
            label="Relation"
            value={form.emergencyContactRelation}
            onChange={(event) =>
              update("emergencyContactRelation", event.target.value)
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Address"
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => update("currentAddress", form.permanentAddress)}
            >
              Copy Permanent Address
            </Button>
          }
        />
        <CardContent className="grid gap-5 md:grid-cols-2">
          <Textarea
            label="Permanent Address"
            value={form.permanentAddress}
            onChange={(event) => update("permanentAddress", event.target.value)}
          />
          <Textarea
            label="Current Address"
            value={form.currentAddress}
            onChange={(event) => update("currentAddress", event.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Bank Details" />
        <CardContent className="grid gap-5 md:grid-cols-2">
          <Input
            label="Bank Name"
            value={form.bankName}
            onChange={(event) => update("bankName", event.target.value)}
          />
          <Input
            label="Bank Branch"
            value={form.bankBranch}
            onChange={(event) => update("bankBranch", event.target.value)}
          />
          <Input
            label="Bank Account Name"
            value={form.bankAccountName}
            onChange={(event) => update("bankAccountName", event.target.value)}
          />
          <Input
            label="Bank Account Number"
            value={form.bankAccountNumber}
            onChange={(event) => update("bankAccountNumber", event.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Qualification and Experience" />
        <CardContent className="grid gap-5 md:grid-cols-2">
          <Textarea
            label="Qualification"
            value={form.qualification}
            onChange={(event) => update("qualification", event.target.value)}
          />
          <Textarea
            label="Past Experience"
            value={form.pastExperience}
            onChange={(event) => update("pastExperience", event.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Sales Targets" />
        <CardContent className="space-y-5">
          <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.hasSalesTarget}
              onChange={(event) => update("hasSalesTarget", event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            This Employee Has a Sales Target
          </label>
          {form.hasSalesTarget ? (
            <div className="grid gap-5 md:grid-cols-2">
              <Input
                label={`Sales Target (${CURRENCY_SYMBOL})`}
                type="number"
                min={0}
                step="0.01"
                value={form.salesTarget}
                onChange={(event) => update("salesTarget", event.target.value)}
              />
              <Input
                label={`Yearly Sales Target (${CURRENCY_SYMBOL})`}
                type="number"
                min={0}
                step="0.01"
                value={form.yearlySalesTarget}
                onChange={(event) =>
                  update("yearlySalesTarget", event.target.value)
                }
              />
              <Input
                label="Target Start Date"
                type="date"
                value={form.targetStartDate}
                onChange={(event) => update("targetStartDate", event.target.value)}
              />
              <Input
                label="Target End Date"
                type="date"
                value={form.targetEndDate}
                onChange={(event) => update("targetEndDate", event.target.value)}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Official Signature"
          description={
            isCreate
              ? "The signature is stored after the employee record is created."
              : "This signature may be used on authorized company documents."
          }
        />
        <CardContent>
          <ImageUploader
            preset="signature"
            value={employee?.signatureUrl}
            emptyLabel="Add Signature"
            uploading={mediaBusy}
            removing={mediaBusy}
            disabled={submitting}
            deferUpload={isCreate}
            onCroppedFileChange={isCreate ? setPendingSignature : undefined}
            onUpload={isCreate ? undefined : onUploadSignature}
            onRemove={isCreate ? undefined : onRemoveSignature}
          />
        </CardContent>
        <CardFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {isCreate ? "Create Employee" : "Save Employee"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
