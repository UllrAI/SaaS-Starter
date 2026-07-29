"use client";

import { useTranslation } from "@/lib/i18n/translation/client";
import {
  Blocks,
  HardDriveUpload,
  ImageIcon,
  LayoutTemplate,
  Server,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileUploader } from "@/components/ui/file-uploader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/config/upload";
import { ServerUploadPanel } from "./server-upload-panel";
import type { UseFileUploadResult } from "@/components/ui/file-upload/use-file-upload";
function DirectUploadToast({ count }: { count: number }) {
  return count === 1 ? (
    <>1 file uploaded directly to storage.</>
  ) : (
    <>{count} files uploaded directly to storage.</>
  );
}
function HeadlessUploadToast({ count }: { count: number }) {
  return count === 1 ? (
    <>1 file uploaded through the headless demo.</>
  ) : (
    <>{count} files uploaded through the headless demo.</>
  );
}
function HeadlessIssueMessage({ code }: { code: string }) {
  const { t } = useTranslation();
  switch (code) {
    case "too-many-files":
      return (
        <>
          {t(
            "uploads_too_many_files_selected_demo",
            "Too many files selected for this demo.",
          )}
        </>
      );
    case "file-type-not-accepted":
      return (
        <>
          {t(
            "uploads_demo_only_accepts_image_files",
            "This demo only accepts image files.",
          )}
        </>
      );
    case "file-too-large":
    case "file-too-large-for-app":
      return (
        <>
          {t(
            "uploads_one_files_larger_than_allowed_limit",
            "One of the files is larger than the allowed limit.",
          )}
        </>
      );
    case "upload-quota-exceeded":
      return (
        <>
          {t(
            "uploadQuotaExceeded",
            "Your upload quota has been reached. Remove files or try again later.",
          )}
        </>
      );
    case "upload-preparation-failed":
      return (
        <>
          {t(
            "uploads_file_could_not_prepared_before_upload",
            "The file could not be prepared before upload.",
          )}
        </>
      );
    case "request-failed":
      return (
        <>
          {t(
            "uploads_upload_request_failed_try_again",
            "The upload request failed. Try again.",
          )}
        </>
      );
    case "network-error":
      return (
        <>
          {t(
            "uploads_network_connection_dropped_during_upload",
            "The network connection dropped during upload.",
          )}
        </>
      );
    case "upload-aborted":
      return (
        <>{t("uploads_upload_was_canceled", "The upload was canceled.")}</>
      );
    default:
      return (
        <>
          {t(
            "uploads_upload_could_not_completed",
            "The upload could not be completed.",
          )}
        </>
      );
  }
}
function HeadlessTileStatus({
  status,
  progress,
}: {
  status: UseFileUploadResult["items"][number]["status"];
  progress: number;
}) {
  const { t } = useTranslation();
  switch (status) {
    case "uploading":
      return (
        <>
          {t("uploads_server_progress_percent", "{progress}%", {
            progress,
          })}
        </>
      );
    case "success":
      return <>{t("uploads_uploaded", "Uploaded")}</>;
    case "error":
      return <>{t("uploads_needs_attention_headless", "Needs attention")}</>;
    case "canceled":
      return <>{t("uploads_canceled", "Canceled")}</>;
    default:
      return <>{t("uploads_queued_headless", "Queued")}</>;
  }
}
function HeadlessUploadTile({
  uploader,
}: {
  uploader: Pick<
    UseFileUploadResult,
    "canAddMore" | "getRootProps" | "isDragActive"
  >;
}) {
  const { t } = useTranslation();
  if (!uploader.canAddMore) {
    return null;
  }
  return (
    <div
      {...uploader.getRootProps({
        className: cn(
          "text-muted-foreground hover:border-primary/50 hover:text-foreground flex aspect-square flex-col items-center justify-center rounded-xl border border-dashed text-center transition-colors",
          uploader.isDragActive && "border-primary bg-muted/50",
        ),
      })}
    >
      <Upload className="mb-2 h-5 w-5" />
      <p className="text-sm font-medium">
        {t("uploads_add_images", "Add images")}
      </p>
      <p className="mt-1 text-xs">
        {t("uploads_drag_drop_browse", "Drag, drop, or browse")}
      </p>
    </div>
  );
}
function HeadlessUploadContent({
  uploader,
}: {
  uploader: Pick<
    UseFileUploadResult,
    | "canAddMore"
    | "clearCompleted"
    | "getInputProps"
    | "getRootProps"
    | "isDragActive"
    | "issue"
    | "items"
  >;
}) {
  const { t } = useTranslation();
  const completedCount = uploader.items.filter(
    (item) => item.status === "success",
  ).length;
  return (
    <div className="space-y-4">
      <input
        {...uploader.getInputProps({
          className: "hidden",
        })}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {uploader.items.map((item) => (
          <div
            key={item.id}
            className="bg-muted relative aspect-square overflow-hidden rounded-xl border"
          >
            {item.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.previewUrl}
                alt={item.file.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-muted-foreground flex h-full items-center justify-center">
                <ImageIcon className="h-6 w-6" />
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 via-black/10 to-transparent p-3 text-white">
              <p className="text-[11px] text-white/80">
                <HeadlessTileStatus
                  status={item.status}
                  progress={item.progress}
                />
              </p>
              <p className="truncate text-xs font-medium">{item.file.name}</p>
            </div>
          </div>
        ))}

        <HeadlessUploadTile uploader={uploader} />
      </div>

      {uploader.issue ? (
        <Alert variant="destructive">
          <AlertDescription>
            <HeadlessIssueMessage code={uploader.issue.code} />
          </AlertDescription>
        </Alert>
      ) : null}

      {completedCount > 0 ? (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={uploader.clearCompleted}>
            {t("uploads_clear_completed_headless", "Clear completed")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
function HeadlessUploadDemo() {
  return (
    <FileUploader
      acceptedFileTypes={["image/jpeg", "image/png", "image/gif", "image/webp"]}
      autoUpload
      maxFileSize={10 * 1024 * 1024}
      maxFiles={6}
      enableImageCompression
      imageCompressionQuality={0.8}
      imageCompressionMaxWidth={1600}
      imageCompressionMaxHeight={1600}
      onUploadComplete={(files) => {
        toast.success(<HeadlessUploadToast count={files.length} />);
      }}
    >
      {(uploader) => <HeadlessUploadContent uploader={uploader} />}
    </FileUploader>
  );
}
export function UploadWorkbench() {
  const { t } = useTranslation();
  const presetConfigs = {
    images: {
      acceptedFileTypes: [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/bmp",
        "image/tiff",
      ],
      description: (
        <>
          {t(
            "uploads_best_gallery_style_uploads_image_compression",
            "Best for gallery-style uploads with image compression and instant preview tiles.",
          )}
        </>
      ),
      meta: (
        <>
          {t(
            "uploads_5_files_10_mb_each_compression",
            "5 files \u2022 10 MB each \u2022 compression enabled",
          )}
        </>
      ),
      settings: {
        enableImageCompression: true,
        imageCompressionMaxHeight: 1080,
        imageCompressionMaxWidth: 1920,
        imageCompressionQuality: 0.8,
        maxFileSize: 10 * 1024 * 1024,
        maxFiles: 5,
      },
      title: <>{t("uploads_image_uploads", "Image uploads")}</>,
    },
    documents: {
      acceptedFileTypes: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "text/csv",
        "text/markdown",
      ],
      description: (
        <>
          {t(
            "uploads_shows_narrower_preset_single_file_document",
            "Shows a narrower preset for single-file document collection and validation feedback.",
          )}
        </>
      ),
      meta: (
        <>
          {t(
            "uploads_1_file_10_mb_document_formats",
            "1 file \u2022 10 MB \u2022 document formats only",
          )}
        </>
      ),
      settings: {
        maxFileSize: 10 * 1024 * 1024,
        maxFiles: 1,
      },
      title: <>{t("uploads_document_uploads", "Document uploads")}</>,
    },
    batch: {
      acceptedFileTypes: undefined,
      description: (
        <>
          {t(
            "uploads_use_full_supported_matrix_when_workflow",
            "Use the full supported matrix when a workflow needs several files in one run.",
          )}
        </>
      ),
      meta: (
        <>
          {t(
            "uploads_10_files_default_global_limits",
            "10 files \u2022 default global limits",
          )}
        </>
      ),
      settings: {
        maxFiles: 10,
      },
      title: <>{t("uploads_batch_uploads", "Batch uploads")}</>,
    },
    large: {
      acceptedFileTypes: undefined,
      description: (
        <>
          {t(
            "uploads_demonstrates_looser_preset_without_changing_application",
            "Demonstrates a looser preset without changing the application-wide safety checks.",
          )}
        </>
      ),
      meta: (
        <>
          {t("uploads_2_files_each", "2 files \u2022 {expression0} each", {
            expression0: formatFileSize(50 * 1024 * 1024),
          })}
        </>
      ),
      settings: {
        maxFileSize: 50 * 1024 * 1024,
        maxFiles: 2,
      },
      title: <>{t("uploads_large_files", "Large files")}</>,
    },
  };
  const capabilityCards = [
    {
      id: "default",
      description: (
        <>
          {t(
            "uploads_preset_demos_image_document_batch_larger",
            "Preset demos for image, document, batch, and larger file uploads.",
          )}
        </>
      ),
      icon: LayoutTemplate,
      title: <>{t("uploads_default_component", "Default component")}</>,
    },
    {
      id: "headless",
      description: (
        <>
          {t(
            "uploads_same_upload_state_can_drive_custom",
            "The same upload state can drive a custom image grid through render props.",
          )}
        </>
      ),
      icon: Blocks,
      title: <>{t("uploads_headless_usage", "Headless usage")}</>,
    },
    {
      id: "server",
      description: (
        <>
          {t(
            "uploads_route_files_through_backend_when_validation",
            "Route files through your backend when validation or processing must happen first.",
          )}
        </>
      ),
      icon: HardDriveUpload,
      title: <>{t("uploads_server_pipeline", "Server pipeline")}</>,
    },
  ];
  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-3">
        {capabilityCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.id} className="shadow-sm">
              <CardHeader className="space-y-3">
                <div className="text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-base">{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>
              {t("uploads_default_uploader_demos", "Default uploader demos")}
            </CardTitle>
            <CardDescription>
              {t(
                "uploads_reuse_shared_uploader_different_presets_demonstrate",
                "Reuse the shared uploader with different presets to demonstrate the common paths most products need.",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="images">
              <TabsList className="h-auto w-full justify-start">
                <TabsTrigger value="images">
                  {t("uploads_images", "Images")}
                </TabsTrigger>
                <TabsTrigger value="documents">
                  {t("uploads_documents", "Documents")}
                </TabsTrigger>
                <TabsTrigger value="batch">
                  {t("uploads_batch", "Batch")}
                </TabsTrigger>
                <TabsTrigger value="large">
                  {t("uploads_large", "Large")}
                </TabsTrigger>
              </TabsList>

              {Object.entries(presetConfigs).map(([key, preset]) => (
                <TabsContent key={key} value={key} className="space-y-4 pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{preset.meta}</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">{preset.title}</p>
                    <p className="text-muted-foreground text-sm">
                      {preset.description}
                    </p>
                  </div>

                  <FileUploader
                    acceptedFileTypes={preset.acceptedFileTypes}
                    onUploadComplete={(files) => {
                      toast.success(<DirectUploadToast count={files.length} />);
                    }}
                    {...preset.settings}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>
              {t("uploads_headless_example", "Headless example")}
            </CardTitle>
            <CardDescription>
              {t(
                "uploads_demo_uses_same_uploader_state_but",
                "This demo uses the same uploader state, but renders a custom image grid instead of the default shell.",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-muted-foreground bg-muted/30 rounded-lg border p-3 text-sm">
              <div className="text-foreground flex items-center gap-2 font-medium">
                <Blocks className="h-4 w-4" />
                <span>{t("uploads_why_matters", "Why this matters")}</span>
              </div>
              <p className="mt-2">
                {t(
                  "uploads_product_pages_often_need_bespoke_previews",
                  "Product pages often need bespoke previews. The upload logic stays shared while the layout stays page-specific.",
                )}
              </p>
            </div>

            <HeadlessUploadDemo />
          </CardContent>
        </Card>
      </section>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="text-primary h-5 w-5" />
            <CardTitle>
              {t("uploads_server_side_uploads", "Server-side uploads")}
            </CardTitle>
          </div>
          <CardDescription>
            {t(
              "uploads_use_lane_when_application_must_inspect",
              "Use this lane when your application must inspect or transform files on the server before they reach object storage.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServerUploadPanel />
        </CardContent>
      </Card>
    </div>
  );
}
