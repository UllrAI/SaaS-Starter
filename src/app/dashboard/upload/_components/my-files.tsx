"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/translation/client";
import { formatFileSize } from "@/lib/config/upload";

interface FileItem {
  id: string;
  fileName: string;
  fileSize: number;
  url: string;
}

export function MyFiles() {
  const { t } = useTranslation();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/files?page=${page}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("File request failed");
        return (await response.json()) as {
          files: FileItem[];
          hasMore: boolean;
        };
      })
      .then((data) => {
        setFiles(data.files);
        setHasMore(data.hasMore);
        setBusy(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError(true);
          setBusy(false);
        }
      });
    return () => controller.abort();
  }, [page, revision]);
  function refresh() {
    setBusy(true);
    setError(false);
    setRevision((value) => value + 1);
  }
  async function remove(id: string) {
    setBusy(true);
    setError(false);
    try {
      const response = await fetch(`/api/files?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Deletion failed");
      refresh();
    } catch {
      setError(true);
      setBusy(false);
    }
  }
  return (
    <section className="space-y-4" aria-busy={busy}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">{t("files_my_files")}</h2>
        <Button variant="outline" onClick={refresh} disabled={busy}>
          {t("files_refresh")}
        </Button>
      </div>
      <p className="text-muted-foreground text-sm">
        {t("files_private_notice")}
      </p>
      {error && (
        <p role="alert" className="text-destructive">
          {t("files_error")}
        </p>
      )}
      {!busy && !files.length && <p>{t("files_empty")}</p>}
      <ul className="divide-border divide-y">
        {files.map((file) => (
          <li key={file.id} className="flex items-center gap-4 py-3">
            <a
              className="text-primary min-w-0 flex-1 truncate underline"
              href={file.url}
            >
              {file.fileName}
            </a>
            <span className="text-muted-foreground text-sm">
              {formatFileSize(file.fileSize)}
            </span>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void remove(file.id)}
              aria-label={t("files_delete_named", { name: file.fileName })}
            >
              {t("files_delete")}
            </Button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={busy || page === 0}
          onClick={() => {
            setBusy(true);
            setError(false);
            setPage(page - 1);
          }}
        >
          {t("files_previous")}
        </Button>
        <Button
          variant="outline"
          disabled={busy || !hasMore}
          onClick={() => {
            setBusy(true);
            setError(false);
            setPage(page + 1);
          }}
        >
          {t("files_next")}
        </Button>
      </div>
    </section>
  );
}
