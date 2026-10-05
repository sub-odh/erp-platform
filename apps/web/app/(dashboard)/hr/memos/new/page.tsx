"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { Select } from "@/components/ui";
import { getEmployeeDirectory } from "@/lib/employees";
import { createMemo, uploadMemoAttachment } from "@/lib/memos";
import type { EmployeeDirectoryItem } from "@/types/employee";

const ATTACHMENT_ACCEPT =
  ".pdf,.jpg,.jpeg,.png,.tif,.docx,.pptx,.xlsx,.csv,.txt";

type MemoEditorHandle = {
  getData: () => string;
  destroy: () => Promise<void>;
};

type ClassicEditorCtor = {
  create: (element: HTMLElement) => Promise<MemoEditorHandle>;
};

export default function NewMemoPage() {
  const router = useRouter();
  const editorHost = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<MemoEditorHandle | null>(null);
  const [directory, setDirectory] = useState<EmployeeDirectoryItem[]>([]);
  const [title, setTitle] = useState("");
  const [verifierId, setVerifierId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const message = new URLSearchParams(window.location.search).get("error");

    if (message) {
      setError(message);
    }
  }, []);

  useEffect(() => {
    void getEmployeeDirectory()
      .then((items) => {
        setDirectory(
          [...items].sort((left, right) =>
            left.firstName.localeCompare(right.firstName, undefined, {
              sensitivity: "base",
            }),
          ),
        );
      })
      .catch((requestError: unknown) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load employees.",
        );
      });
  }, []);

  useEffect(() => {
    const host = editorHost.current;
    let cancelled = false;

    if (!host) {
      return;
    }

    void loadClassicEditor()
      .then((ClassicEditor) => {
        if (cancelled) {
          return null;
        }

        return ClassicEditor.create(host);
      })
      .then((editor) => {
        if (!editor) {
          return;
        }

        if (cancelled) {
          void editor.destroy();
          return;
        }

        editorRef.current = editor;
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      const editor = editorRef.current;
      editorRef.current = null;
      void editor?.destroy();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!verifierId) {
      setError("Please select a verifier.");
      return;
    }

    const content = (editorRef.current?.getData() ?? editorHost.current?.value ?? "").trim();

    if (!title.trim() || !plainText(content)) {
      setError("All fields are required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const memo = await createMemo({
        title: title.trim(),
        content,
        verifierId,
      });

      for (const file of files) {
        await uploadMemoAttachment(memo.id, file);
      }

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

  return (
    <div>
      <style>{EDITOR_CSS}</style>
      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-9">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <form onSubmit={(event) => void handleSubmit(event)}>
              <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-12">
                <label className="md:col-span-7">
                  <span className="mb-1 block text-xs font-bold text-slate-500">
                    MEMO SUBJECT
                  </span>
                  <input
                    value={title}
                    required
                    onChange={(event) => setTitle(event.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-slate-100 p-3 text-sm text-slate-900 outline-none focus:border-blue-500"
                  />
                </label>
                <div className="md:col-span-5">
                  <span className="mb-1 block text-xs font-bold text-slate-500">
                    SELECT VERIFIER
                  </span>
                  <Select
                    required
                    value={verifierId}
                    onChange={(event) => setVerifierId(event.target.value)}
                    className="h-[58px] bg-slate-100 px-3"
                  >
                    <option value="">-- Choose Verifier --</option>
                    {directory.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="mb-4">
                <span className="mb-1 block text-xs font-bold text-slate-500">
                  MEMO CONTENT
                </span>
                <textarea ref={editorHost} defaultValue="" />
              </div>

              <div className="mb-4">
                <span className="mb-1 block text-xs font-bold text-slate-500">
                  ATTACHMENTS
                </span>
                <div className="rounded-md border border-slate-200 bg-slate-100 p-3">
                  <input
                    type="file"
                    multiple
                    accept={ATTACHMENT_ACCEPT}
                    onChange={(event) =>
                      setFiles(Array.from(event.target.files ?? []))
                    }
                    className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border file:border-slate-300 file:bg-white file:px-3 file:py-1.5 file:text-sm"
                  />
                  <small className="mt-2 block text-slate-500">
                    Allowed: PDF, Images, Word, Excel, PowerPoint, CSV, TXT
                  </small>
                </div>
              </div>

              <div className="text-right">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-blue-600 px-5 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  Submit Memo
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-xs font-bold uppercase text-slate-900">
              Workflow Steps
            </h2>
            <div className="border-l-2 border-dashed border-slate-300 pl-5">
              <Step number={1}>Raise Memo (Current)</Step>
              <Step number={2} active>
                Verification (Selected Verifier)
              </Step>
              <Step number={3}>Confirmation (HOD)</Step>
              <Step number={4}>Final Approval (CEO)</Step>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({
  number,
  children,
  active = false,
}: {
  number: number;
  children: string;
  active?: boolean;
}) {
  return (
    <div
      className={`relative mb-5 text-[0.85rem] ${
        active ? "font-bold text-[#0d6efd]" : "text-slate-500"
      }`}
    >
      <span className="absolute -left-[26px] top-[5px] h-3 w-3 rounded-full bg-[#0d6efd]" />
      <b>Step {number}:</b> {children}
    </div>
  );
}

function plainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim();
}

let classicEditorPromise: Promise<ClassicEditorCtor> | null = null;

function loadClassicEditor(): Promise<ClassicEditorCtor> {
  if (classicEditorPromise) {
    return classicEditorPromise;
  }

  classicEditorPromise = new Promise((resolve, reject) => {
    const current = (window as Window & { ClassicEditor?: ClassicEditorCtor })
      .ClassicEditor;

    if (current) {
      resolve(current);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.ckeditor.com/ckeditor5/39.0.1/classic/ckeditor.js";
    script.async = true;
    script.onload = () => {
      const loaded = (window as Window & { ClassicEditor?: ClassicEditorCtor })
        .ClassicEditor;

      if (loaded) {
        resolve(loaded);
      } else {
        reject(new Error("CKEditor failed to load"));
      }
    };
    script.onerror = () => reject(new Error("CKEditor failed to load"));
    document.body.appendChild(script);
  });

  return classicEditorPromise;
}

const EDITOR_CSS = `
.ck-editor__editable { min-height: 400px !important; }
`;
