"use client";

import { Download, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import { Button, Input, Select } from "@/components/ui";
import {
  createCompanyBackupSnapshot,
  deleteCompanyBackupFile,
  downloadCompanyBackupFile,
  getCompanyBackupArchive,
  restoreCompanyBackup,
  restoreCompanyBackupFile,
  updateCompanyBackupSchedule,
} from "@/lib/company";
import type {
  Company,
  CompanyBackupFile,
  CompanyBackupSchedule,
} from "@/types/company";

const WEEKDAYS = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "7", label: "Sunday" },
];

interface CompanyBackupPanelProps {
  company: Company;
  onNotice: (message: string) => void;
  onError: (message: string) => void;
}

export function CompanyBackupPanel({
  company,
  onNotice,
  onError,
}: CompanyBackupPanelProps) {
  const [schedule, setSchedule] = useState<CompanyBackupSchedule | null>(null);
  const [files, setFiles] = useState<CompanyBackupFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleBusy, setScheduleBusy] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [importBusy, setImportBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CompanyBackupFile | null>(
    null,
  );

  const restorePhrase = `RESTORE ${company.code}`;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const archive = await getCompanyBackupArchive();
      setSchedule(archive.schedule);
      setFiles(archive.files);
    } catch (requestError) {
      onErrorRef.current(
        messageOf(requestError, "Unable to load company backups."),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveSchedule(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!schedule) {
      return;
    }

    setScheduleBusy(true);

    try {
      const saved = await updateCompanyBackupSchedule({
        frequency: schedule.frequency,
        backupTime: schedule.backupTime,
        backupDay: schedule.backupDay,
        retentionMaxFiles: schedule.retentionMaxFiles,
        retentionDays: schedule.retentionDays,
      });
      setSchedule(saved);
      onNotice("Backup schedule updated.");
      await load();
    } catch (requestError) {
      onError(messageOf(requestError, "Unable to update the backup schedule."));
    } finally {
      setScheduleBusy(false);
    }
  }

  async function createSnapshot(): Promise<void> {
    setCreateBusy(true);

    try {
      await createCompanyBackupSnapshot();
      onNotice("Backup snapshot stored.");
      await load();
    } catch (requestError) {
      onError(messageOf(requestError, "Unable to create a backup snapshot."));
    } finally {
      setCreateBusy(false);
    }
  }

  async function downloadFile(file: CompanyBackupFile): Promise<void> {
    try {
      const result = await downloadCompanyBackupFile(file.id);
      const blob = new Blob([JSON.stringify(result.backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      onError(messageOf(requestError, "Unable to download this backup."));
    }
  }

  async function importSnapshot(): Promise<void> {
    if (!importFile) {
      return;
    }

    setImportBusy(true);

    try {
      const result = await restoreCompanyBackup(
        importFile,
        confirmation,
        ownerPassword,
      );
      setImportFile(null);
      setConfirmation("");
      setOwnerPassword("");
      onNotice(result.message);
    } catch (requestError) {
      onError(messageOf(requestError, "Unable to import this backup."));
    } finally {
      setImportBusy(false);
    }
  }

  async function restoreStored(file: CompanyBackupFile): Promise<void> {
    if (confirmation !== restorePhrase || ownerPassword.length === 0) {
      onError(`Type ${restorePhrase} and the owner password before restoring.`);
      return;
    }

    setImportBusy(true);

    try {
      const result = await restoreCompanyBackupFile(
        file.id,
        confirmation,
        ownerPassword,
      );
      setConfirmation("");
      setOwnerPassword("");
      onNotice(result.message);
    } catch (requestError) {
      onError(messageOf(requestError, "Unable to restore this backup."));
    } finally {
      setImportBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Automated Backup Schedule
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          A daily or weekly snapshot is stored the next time this page is opened
          after the chosen time. Older files are removed by the retention rules.
        </p>
        {schedule ? (
          <form
            onSubmit={(event) => void saveSchedule(event)}
            className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            <Select
              label="Backup Frequency"
              value={schedule.frequency}
              onChange={(event) =>
                setSchedule({
                  ...schedule,
                  frequency: event.target.value === "weekly" ? "weekly" : "daily",
                })
              }
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </Select>
            {schedule.frequency === "weekly" ? (
              <Select
                label="Backup Day"
                value={String(schedule.backupDay)}
                onChange={(event) =>
                  setSchedule({
                    ...schedule,
                    backupDay: Number(event.target.value),
                  })
                }
              >
                {WEEKDAYS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </Select>
            ) : null}
            <Input
              label="Backup Time"
              type="time"
              value={schedule.backupTime}
              onChange={(event) =>
                setSchedule({ ...schedule, backupTime: event.target.value })
              }
              required
            />
            <Input
              label="Maximum Files"
              type="number"
              min={1}
              max={100}
              value={String(schedule.retentionMaxFiles)}
              onChange={(event) =>
                setSchedule({
                  ...schedule,
                  retentionMaxFiles: Number(event.target.value),
                })
              }
              required
            />
            <Input
              label="Retention Days"
              type="number"
              min={1}
              max={3650}
              value={String(schedule.retentionDays)}
              onChange={(event) =>
                setSchedule({
                  ...schedule,
                  retentionDays: Number(event.target.value),
                })
              }
              required
            />
            <div className="flex items-end">
              <Button type="submit" loading={scheduleBusy}>
                Update Schedule
              </Button>
            </div>
          </form>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            {loading ? "Loading schedule..." : "Schedule is unavailable."}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Import Company Snapshot
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Import a company backup file created by this app. It replaces
          operational data for {company.name} and keeps user logins. Type{" "}
          {restorePhrase} and the owner password.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Input
            label="Company Backup File"
            type="file"
            accept="application/json,.json"
            onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
          />
          <Input
            label="Confirmation"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder={restorePhrase}
          />
          <Input
            label="Owner Password"
            type="password"
            value={ownerPassword}
            onChange={(event) => setOwnerPassword(event.target.value)}
          />
        </div>
        <Button
          className="mt-4"
          loading={importBusy}
          disabled={
            !importFile ||
            confirmation !== restorePhrase ||
            ownerPassword.length === 0
          }
          onClick={() => void importSnapshot()}
        >
          <Upload size={17} /> Import Snapshot
        </Button>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Backup Archive
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Stored snapshots for this company.
            </p>
          </div>
          <Button loading={createBusy} onClick={() => void createSnapshot()}>
            <Download size={17} /> Create Backup Snapshot
          </Button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left">File</th>
                <th className="px-3 py-2 text-left">Size</th>
                <th className="px-3 py-2 text-left">Created</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                    No backups found.
                  </td>
                </tr>
              ) : (
                files.map((file) => (
                  <tr key={file.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-mono text-xs">{file.filename}</td>
                    <td className="px-3 py-2">{formatSize(file.sizeBytes)}</td>
                    <td className="px-3 py-2">{formatWhen(file.createdAt)}</td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void downloadFile(file)}
                        >
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={
                            importBusy ||
                            confirmation !== restorePhrase ||
                            ownerPassword.length === 0
                          }
                          onClick={() => void restoreStored(file)}
                        >
                          Restore
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          aria-label={`Delete ${file.filename}`}
                          onClick={() => setPendingDelete(file)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {pendingDelete ? (
        <BackupDeleteView
          filename={pendingDelete.filename}
          onClose={() => setPendingDelete(null)}
          onConfirm={() => {
            const target = pendingDelete;
            setPendingDelete(null);
            void deleteCompanyBackupFile(target.id)
              .then(() => {
                onNotice("Backup file deleted.");
                return load();
              })
              .catch((requestError: unknown) => {
                onError(messageOf(requestError, "Unable to delete this backup."));
              });
          }}
        />
      ) : null}
    </div>
  );
}

function BackupDeleteView({
  filename,
  onClose,
  onConfirm,
}: {
  filename: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="backup-delete-title"
    >
      <button
        type="button"
        aria-label="Close delete backup"
        className="absolute inset-0 bg-slate-950/60"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <h2 id="backup-delete-title" className="text-base font-bold text-slate-900">
          Delete Backup?
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {filename} will be removed from this company archive.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Delete Backup
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatWhen(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
