"use client";

import { Button, Modal } from "@/components/ui";
import { useAuthenticatedMediaUrl } from "@/lib/media";

interface GuaranteeDocumentViewProps {
  url: string | null;
  title: string;
  onClose: () => void;
}

export function GuaranteeDocumentView({
  url,
  title,
  onClose,
}: GuaranteeDocumentViewProps) {
  const objectUrl = useAuthenticatedMediaUrl(url);
  const pdf = Boolean(url && /\.pdf($|\?)/i.test(url));

  return (
    <Modal
      open={Boolean(url)}
      title="Guarantee Verification Inspection Interface"
      description={title}
      onClose={onClose}
      className="max-w-4xl"
      footer={
        <div className="flex justify-end gap-2">
          {objectUrl ? (
            <a
              href={objectUrl}
              download
              className="inline-flex items-center rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700"
            >
              Download Master Copy
            </a>
          ) : null}
          <Button variant="outline" onClick={onClose}>
            Close Viewer
          </Button>
        </div>
      }
    >
      <div className="flex min-h-80 items-center justify-center bg-slate-100">
        {!objectUrl ? (
          <p className="text-sm text-slate-500">Loading document...</p>
        ) : pdf ? (
          <iframe title={title} src={objectUrl} className="h-[70vh] w-full" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={objectUrl} alt={title} className="max-h-[70vh] max-w-full" />
        )}
      </div>
    </Modal>
  );
}
