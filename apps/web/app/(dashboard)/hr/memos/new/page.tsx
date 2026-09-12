"use client";

import { ArrowLeft, StickyNote } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { Button, Card, CardContent, Select, Spinner, Textarea, Input } from "@/components/ui";
import { getEmployeeDirectory } from "@/lib/employees";
import { createMemo } from "@/lib/memos";
import type { EmployeeDirectoryItem } from "@/types/employee";

export default function NewMemoPage() {
  const router = useRouter();
  const [directory, setDirectory] = useState<EmployeeDirectoryItem[]>([]);
  const [title, setTitle] = useState("");
  const [verifierId, setVerifierId] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getEmployeeDirectory()
      .then((items) => {
        setDirectory(items);
        if (items[0]) {
          setVerifierId(items[0].id);
        }
      })
      .catch((requestError: unknown) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load employees.",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const memo = await createMemo({
        title: title.trim(),
        content: content.trim(),
        verifierId,
      });
      router.push(`/hr/memos/${memo.id}`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create the memo.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button
        type="button"
        onClick={() => router.push("/hr/memos")}
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        Memo Lists
      </button>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <StickyNote size={20} />
        </div>
        <div>
          <p className="text-sm font-medium text-blue-600">HR & Operations</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Create Memo
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Raise an official memo for verification and approval.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Card>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <Input
              label="Subject"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter the memo subject"
            />

            <Select
              label="Verifier"
              required
              value={verifierId}
              onChange={(event) => setVerifierId(event.target.value)}
            >
              <option value="">Select Verifier</option>
              {directory.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.firstName} {employee.lastName}
                  {employee.designation ? ` — ${employee.designation}` : ""}
                </option>
              ))}
            </Select>

            <Textarea
              label="Content"
              required
              rows={10}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Write the memo body"
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/hr/memos")}
              >
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                Submit Memo
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
