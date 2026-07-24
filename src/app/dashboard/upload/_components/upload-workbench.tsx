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
      return <>{t("bf52a4ed08a8", "Too many files selected for this demo.")}</>;
    case "file-type-not-accepted":
      return <>{t("f494964c8306", "This demo only accepts image files.")}</>;
    case "file-too-large":
    case "file-too-large-for-app":
      return (
        <>
          {t(
            "052cfb5d5952",
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
          {t("9587f0d021fb", "The file could not be prepared before upload.")}
        </>
      );
    case "request-failed":
      return <>{t("46af5583eda6", "The upload request failed. Try again.")}</>;
    case "network-error":
      return (
        <>
          {t("162f5326e719", "The network connection dropped during upload.")}
        </>
      );
    case "upload-aborted":
      return <>{t("155cdbd26440", "The upload was canceled.")}</>;
    default:
      return <>{t("36a9df773d18", "The upload could not be completed.")}</>;
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
          {t("59ba3bcd229b", "{progress}%", {
            progress,
          })}
        </>
      );
    case "success":
      return <>{t("119f40118528", "Uploaded")}</>;
    case "error":
      return <>{t("9e307de530ea", "Needs attention")}</>;
    case "canceled":
      return <>{t("fe240bb1914c", "Canceled")}</>;
    default:
      return <>{t("6964a1a16283", "Queued")}</>;
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
      <p className="text-sm font-medium">{t("e721b549cc34", "Add images")}</p>
      <p className="mt-1 text-xs">
        {t("175943341e11", "Drag, drop, or browse")}
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
            {t("62046b76c6d5", "Clear completed")}
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
            "f2f10c1a7bcf",
            "Best for gallery-style uploads with image compression and instant preview tiles.",
          )}
        </>
      ),
      meta: (
        <>
          {t(
            "94a9e189bfb5",
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
      title: <>{t("c9cc19dc1748", "Image uploads")}</>,
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
            "d5d53a3c02f4",
            "Shows a narrower preset for single-file document collection and validation feedback.",
          )}
        </>
      ),
      meta: (
        <>
          {t(
            "bf93f825d493",
            "1 file \u2022 10 MB \u2022 document formats only",
          )}
        </>
      ),
      settings: {
        maxFileSize: 10 * 1024 * 1024,
        maxFiles: 1,
      },
      title: <>{t("7b7cff8f07f2", "Document uploads")}</>,
    },
    batch: {
      acceptedFileTypes: undefined,
      description: (
        <>
          {t(
            "26ba16e3e580",
            "Use the full supported matrix when a workflow needs several files in one run.",
          )}
        </>
      ),
      meta: <>{t("e61174f4a548", "10 files \u2022 default global limits")}</>,
      settings: {
        maxFiles: 10,
      },
      title: <>{t("24aac2d699ef", "Batch uploads")}</>,
    },
    large: {
      acceptedFileTypes: undefined,
      description: (
        <>
          {t(
            "5ad776a79d22",
            "Demonstrates a looser preset without changing the application-wide safety checks.",
          )}
        </>
      ),
      meta: (
        <>
          {t("b55fc81b5407", "2 files \u2022 {expression0} each", {
            expression0: formatFileSize(50 * 1024 * 1024),
          })}
        </>
      ),
      settings: {
        maxFileSize: 50 * 1024 * 1024,
        maxFiles: 2,
      },
      title: <>{t("42eb954ee399", "Large files")}</>,
    },
  };
  const capabilityCards = [
    {
      id: "default",
      description: (
        <>
          {t(
            "c3d284136549",
            "Preset demos for image, document, batch, and larger file uploads.",
          )}
        </>
      ),
      icon: LayoutTemplate,
      title: <>{t("30fae2042253", "Default component")}</>,
    },
    {
      id: "headless",
      description: (
        <>
          {t(
            "08b217b883d1",
            "The same upload state can drive a custom image grid through render props.",
          )}
        </>
      ),
      icon: Blocks,
      title: <>{t("53fe962d76c7", "Headless usage")}</>,
    },
    {
      id: "server",
      description: (
        <>
          {t(
            "aea6d90b4fb9",
            "Route files through your backend when validation or processing must happen first.",
          )}
        </>
      ),
      icon: HardDriveUpload,
      title: <>{t("d6eb86764c39", "Server pipeline")}</>,
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
            <CardTitle>{t("ecd94a4d7e74", "Default uploader demos")}</CardTitle>
            <CardDescription>
              {t(
                "52646e63593e",
                "Reuse the shared uploader with different presets to demonstrate the common paths most products need.",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="images">
              <TabsList className="h-auto w-full justify-start">
                <TabsTrigger value="images">
                  {t("b7b5d0331413", "Images")}
                </TabsTrigger>
                <TabsTrigger value="documents">
                  {t("0191297727bb", "Documents")}
                </TabsTrigger>
                <TabsTrigger value="batch">
                  {t("a425b80f7878", "Batch")}
                </TabsTrigger>
                <TabsTrigger value="large">
                  {t("f0d14e47d4c9", "Large")}
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
            <CardTitle>{t("2ccce01e2f96", "Headless example")}</CardTitle>
            <CardDescription>
              {t(
                "f2bbf612fabc",
                "This demo uses the same uploader state, but renders a custom image grid instead of the default shell.",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-muted-foreground bg-muted/30 rounded-lg border p-3 text-sm">
              <div className="text-foreground flex items-center gap-2 font-medium">
                <Blocks className="h-4 w-4" />
                <span>{t("7dd29325ac4a", "Why this matters")}</span>
              </div>
              <p className="mt-2">
                {t(
                  "50224d71556f",
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
            <CardTitle>{t("5a5fe63d2053", "Server-side uploads")}</CardTitle>
          </div>
          <CardDescription>
            {t(
              "179dea16873a",
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
