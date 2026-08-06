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
      return <>{t("uploads_too_many_files_selected_demo")}</>;
    case "file-type-not-accepted":
      return <>{t("uploads_demo_only_accepts_image_files")}</>;
    case "file-too-large":
    case "file-too-large-for-app":
      return <>{t("uploads_one_files_larger_than_allowed_limit")}</>;
    case "upload-quota-exceeded":
      return <>{t("upload_quota_exceeded")}</>;
    case "upload-preparation-failed":
      return <>{t("uploads_file_could_not_prepared_before_upload")}</>;
    case "request-failed":
      return <>{t("uploads_upload_request_failed_try_again")}</>;
    case "network-error":
      return <>{t("uploads_network_connection_dropped")}</>;
    case "upload-aborted":
      return <>{t("uploads_upload_was_canceled")}</>;
    default:
      return <>{t("uploads_upload_could_not_completed")}</>;
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
          {t.rich("uploads_server_progress_percent", {
            progress,
          })}
        </>
      );
    case "success":
      return <>{t("uploads_uploaded")}</>;
    case "error":
      return <>{t("uploads_needs_attention_headless")}</>;
    case "canceled":
      return <>{t("uploads_canceled")}</>;
    default:
      return <>{t("uploads_queued_headless")}</>;
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
      <p className="text-sm font-medium">{t("uploads_add_images")}</p>
      <p className="mt-1 text-xs">{t("uploads_drag_drop_browse")}</p>
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
            {t("uploads_clear_completed_headless")}
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
      description: <>{t("uploads_gallery_style_compression")}</>,
      meta: <>{t("uploads_5_files_10_mb_each_compression")}</>,
      settings: {
        enableImageCompression: true,
        imageCompressionMaxHeight: 1080,
        imageCompressionMaxWidth: 1920,
        imageCompressionQuality: 0.8,
        maxFileSize: 10 * 1024 * 1024,
        maxFiles: 5,
      },
      title: <>{t("uploads_image_uploads")}</>,
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
      description: <>{t("uploads_narrower_single_file_preset")}</>,
      meta: <>{t("uploads_1_file_10_mb_document_formats")}</>,
      settings: {
        maxFileSize: 10 * 1024 * 1024,
        maxFiles: 1,
      },
      title: <>{t("uploads_document_uploads")}</>,
    },
    batch: {
      acceptedFileTypes: undefined,
      description: <>{t("uploads_full_matrix_when_needed")}</>,
      meta: <>{t("uploads_10_files_default_global_limits")}</>,
      settings: {
        maxFiles: 10,
      },
      title: <>{t("uploads_batch_uploads")}</>,
    },
    large: {
      acceptedFileTypes: undefined,
      description: <>{t("uploads_looser_preset_demo")}</>,
      meta: (
        <>
          {t.rich("uploads_2_files_each", {
            expression0: formatFileSize(50 * 1024 * 1024),
          })}
        </>
      ),
      settings: {
        maxFileSize: 50 * 1024 * 1024,
        maxFiles: 2,
      },
      title: <>{t("uploads_large_files")}</>,
    },
  };
  const capabilityCards = [
    {
      id: "default",
      description: <>{t("uploads_preset_demos")}</>,
      icon: LayoutTemplate,
      title: <>{t("uploads_default_component")}</>,
    },
    {
      id: "headless",
      description: <>{t("uploads_same_upload_state_can_drive_custom")}</>,
      icon: Blocks,
      title: <>{t("uploads_headless_usage")}</>,
    },
    {
      id: "server",
      description: <>{t("uploads_route_through_backend")}</>,
      icon: HardDriveUpload,
      title: <>{t("uploads_server_pipeline")}</>,
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
            <CardTitle>{t("uploads_default_uploader_demos")}</CardTitle>
            <CardDescription>
              {t("uploads_shared_uploader_presets")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="images">
              <TabsList className="h-auto w-full justify-start">
                <TabsTrigger value="images">{t("uploads_images")}</TabsTrigger>
                <TabsTrigger value="documents">
                  {t("uploads_documents")}
                </TabsTrigger>
                <TabsTrigger value="batch">{t("uploads_batch")}</TabsTrigger>
                <TabsTrigger value="large">{t("uploads_large")}</TabsTrigger>
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
            <CardTitle>{t("uploads_headless_example")}</CardTitle>
            <CardDescription>
              {t("uploads_demo_uses_same_uploader_state_but")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-muted-foreground bg-muted/30 rounded-lg border p-3 text-sm">
              <div className="text-foreground flex items-center gap-2 font-medium">
                <Blocks className="h-4 w-4" />
                <span>{t("uploads_why_matters")}</span>
              </div>
              <p className="mt-2">{t("uploads_product_page_previews")}</p>
            </div>

            <HeadlessUploadDemo />
          </CardContent>
        </Card>
      </section>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="text-primary h-5 w-5" />
            <CardTitle>{t("uploads_server_side_uploads")}</CardTitle>
          </div>
          <CardDescription>{t("uploads_lane_for_inspection")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ServerUploadPanel />
        </CardContent>
      </Card>
    </div>
  );
}
