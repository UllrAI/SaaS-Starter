"use client";

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
  switch (code) {
    case "too-many-files":
      return <>Too many files selected for this demo.</>;
    case "file-type-not-accepted":
      return <>This demo only accepts image files.</>;
    case "file-too-large":
    case "file-too-large-for-app":
      return <>One of the files is larger than the allowed limit.</>;
    case "upload-preparation-failed":
      return <>The file could not be prepared before upload.</>;
    case "request-failed":
      return <>The upload request failed. Try again.</>;
    case "network-error":
      return <>The network connection dropped during upload.</>;
    case "upload-aborted":
      return <>The upload was canceled.</>;
    default:
      return <>The upload could not be completed.</>;
  }
}

function HeadlessTileStatus({
  status,
  progress,
}: {
  status: UseFileUploadResult["items"][number]["status"];
  progress: number;
}) {
  switch (status) {
    case "uploading":
      return <>{progress}%</>;
    case "success":
      return <>Uploaded</>;
    case "error":
      return <>Needs attention</>;
    case "canceled":
      return <>Canceled</>;
    default:
      return <>Queued</>;
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
      <p className="text-sm font-medium">Add images</p>
      <p className="mt-1 text-xs">Drag, drop, or browse</p>
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
  const completedCount = uploader.items.filter(
    (item) => item.status === "success",
  ).length;

  return (
    <div className="space-y-4">
      <input {...uploader.getInputProps({ className: "hidden" })} />

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
            Clear completed
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function HeadlessUploadDemo() {
  return (
    <FileUploader
      acceptedFileTypes={[
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
      ]}
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
  const presetConfigs = {
    images: {
      acceptedFileTypes: [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/bmp",
        "image/tiff",
        "image/svg+xml",
      ],
      description: (
        <>
          Best for gallery-style uploads with image compression and instant
          preview tiles.
        </>
      ),
      meta: <>5 files • 10 MB each • compression enabled</>,
      settings: {
        enableImageCompression: true,
        imageCompressionMaxHeight: 1080,
        imageCompressionMaxWidth: 1920,
        imageCompressionQuality: 0.8,
        maxFileSize: 10 * 1024 * 1024,
        maxFiles: 5,
      },
      title: <>Image uploads</>,
    },
    documents: {
      acceptedFileTypes: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "text/csv",
        "text/markdown",
        "text/html",
      ],
      description: (
        <>
          Shows a narrower preset for single-file document collection and
          validation feedback.
        </>
      ),
      meta: <>1 file • 10 MB • document formats only</>,
      settings: {
        maxFileSize: 10 * 1024 * 1024,
        maxFiles: 1,
      },
      title: <>Document uploads</>,
    },
    batch: {
      acceptedFileTypes: undefined,
      description: (
        <>
          Use the full supported matrix when a workflow needs several files in
          one run.
        </>
      ),
      meta: <>10 files • default global limits</>,
      settings: {
        maxFiles: 10,
      },
      title: <>Batch uploads</>,
    },
    large: {
      acceptedFileTypes: undefined,
      description: (
        <>
          Demonstrates a looser preset without changing the application-wide
          safety checks.
        </>
      ),
      meta: <>2 files • {formatFileSize(50 * 1024 * 1024)} each</>,
      settings: {
        maxFileSize: 50 * 1024 * 1024,
        maxFiles: 2,
      },
      title: <>Large files</>,
    },
  };

  const capabilityCards = [
    {
      id: "default",
      description: (
        <>Preset demos for image, document, batch, and larger file uploads.</>
      ),
      icon: LayoutTemplate,
      title: <>Default component</>,
    },
    {
      id: "headless",
      description: (
        <>
          The same upload state can drive a custom image grid through render
          props.
        </>
      ),
      icon: Blocks,
      title: <>Headless usage</>,
    },
    {
      id: "server",
      description: (
        <>
          Route files through your backend when validation or processing must
          happen first.
        </>
      ),
      icon: HardDriveUpload,
      title: <>Server pipeline</>,
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
            <CardTitle>Default uploader demos</CardTitle>
            <CardDescription>
              Reuse the shared uploader with different presets to demonstrate
              the common paths most products need.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="images">
              <TabsList className="h-auto w-full justify-start">
                <TabsTrigger value="images">Images</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="batch">Batch</TabsTrigger>
                <TabsTrigger value="large">Large</TabsTrigger>
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
            <CardTitle>Headless example</CardTitle>
            <CardDescription>
              This demo uses the same uploader state, but renders a custom image
              grid instead of the default shell.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-muted-foreground bg-muted/30 rounded-lg border p-3 text-sm">
              <div className="text-foreground flex items-center gap-2 font-medium">
                <Blocks className="h-4 w-4" />
                <span>Why this matters</span>
              </div>
              <p className="mt-2">
                Product pages often need bespoke previews. The upload logic
                stays shared while the layout stays page-specific.
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
            <CardTitle>Server-side uploads</CardTitle>
          </div>
          <CardDescription>
            Use this lane when your application must inspect or transform files
            on the server before they reach object storage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServerUploadPanel />
        </CardContent>
      </Card>
    </div>
  );
}
