"use client";

import { useState } from "react";
import { DashboardPageWrapper } from "../_components/dashboard-page-wrapper";
import { FileUploader } from "@/components/ui/file-uploader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { formatFileSize } from "@/lib/config/upload";
import {
  ExternalLink,
  Copy,
  Upload,
  Image as ImageIcon,
  FileText,
  Settings,
  Server,
  Monitor,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface UploadedFile {
  url: string;
  key: string;
  size: number;
  contentType: string;
  fileName: string;
}

interface ServerUploadResult {
  fileName: string;
  url?: string;
  key?: string;
  size?: number;
  contentType?: string;
  success: boolean;
  error?: string;
}

export default function UploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [serverUploadProgress, setServerUploadProgress] = useState(0);
  const [isServerUploading, setIsServerUploading] = useState(false);

  const handleUploadComplete = (files: UploadedFile[]) => {
    setUploadedFiles((prev) => [...prev, ...files]);
    toast.success(`Successfully uploaded ${files.length} file(s)`);
  };

  // 服务端上传
  const handleServerUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsServerUploading(true);
    setServerUploadProgress(0);

    try {
      // 创建FormData对象
      const formData = new FormData();

      // 添加所有文件到FormData
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      setServerUploadProgress(25); // 文件准备完成

      // 调用服务端上传API
      const response = await fetch("/api/upload/server-upload", {
        method: "POST",
        body: formData, // 不设置Content-Type，让浏览器自动设置multipart/form-data
      });

      setServerUploadProgress(80);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      setServerUploadProgress(100);

      // 添加成功上传的文件到列表
      const successfulUploads = (result.results as ServerUploadResult[])
        .filter((r: ServerUploadResult) => r.success)
        .map((r: ServerUploadResult) => ({
          url: r.url!,
          key: r.key!,
          size: r.size!,
          contentType: r.contentType!,
          fileName: r.fileName,
        }));

      setUploadedFiles((prev) => [...prev, ...successfulUploads]);

      if (result.summary.failed > 0) {
        toast.warning(
          `${result.summary.success} files uploaded, ${result.summary.failed} failed`,
        );
      } else {
        toast.success(
          `Successfully uploaded ${result.summary.success} file(s) via server`,
        );
      }
    } catch (error) {
      console.error("Server upload error:", error);
      toast.error("Server upload failed");
    } finally {
      setIsServerUploading(false);
      setServerUploadProgress(0);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <DashboardPageWrapper title="File Upload">
      <Tabs defaultValue="client" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="client" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Client Upload
          </TabsTrigger>
          <TabsTrigger value="server" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Server Upload
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Advanced Features
          </TabsTrigger>
        </TabsList>

        {/* Client-side Upload Tab */}
        <TabsContent value="client" className="space-y-6">
          {/* Image Upload with Compression */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Image Upload with Compression
              </CardTitle>
              <CardDescription>
                Upload images with automatic compression. Maximum 10MB per file,
                up to 5 files.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploader
                acceptedFileTypes={[
                  "image/jpeg",
                  "image/jpg",
                  "image/png",
                  "image/gif",
                  "image/webp",
                  "image/bmp",
                  "image/tiff",
                  "image/svg+xml",
                ]}
                maxFileSize={10 * 1024 * 1024} // 10MB
                maxFiles={5}
                enableImageCompression={true}
                imageCompressionQuality={0.8}
                imageCompressionMaxWidth={1920}
                imageCompressionMaxHeight={1080}
                onUploadComplete={handleUploadComplete}
              />
            </CardContent>
          </Card>

          {/* Document Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Upload
              </CardTitle>
              <CardDescription>
                Upload documents and files. Maximum 10MB per file, single file
                upload.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploader
                acceptedFileTypes={[
                  "application/pdf",
                  "application/msword",
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                  "text/plain",
                  "text/csv",
                  "text/markdown",
                  "text/x-markdown",
                  "text/html",
                ]}
                maxFileSize={10 * 1024 * 1024} // 10MB
                maxFiles={1}
                onUploadComplete={handleUploadComplete}
              />
            </CardContent>
          </Card>

          {/* Batch Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Batch Upload
              </CardTitle>
              <CardDescription>
                Upload multiple files at once. Any supported file type, up to 10
                files.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploader
                maxFiles={10}
                onUploadComplete={handleUploadComplete}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Server-side Upload Tab */}
        <TabsContent value="server" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Server-side Upload Demo
              </CardTitle>
              <CardDescription>
                Demonstrate server-side file upload with progress tracking.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleServerUpload(e.target.files)}
                  disabled={isServerUploading}
                  className="hidden"
                  id="server-upload"
                />
                <label
                  htmlFor="server-upload"
                  className={`flex cursor-pointer flex-col items-center gap-2 ${
                    isServerUploading ? "cursor-not-allowed opacity-50" : ""
                  }`}
                >
                  <Server className="h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium">
                    {isServerUploading
                      ? "Uploading..."
                      : "Click to select files for server upload"}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Files will be processed on the server side
                  </p>
                </label>
              </div>

              {isServerUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Upload Progress</span>
                    <span>{Math.round(serverUploadProgress)}%</span>
                  </div>
                  <Progress value={serverUploadProgress} className="w-full" />
                </div>
              )}

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h4 className="mb-2 font-medium text-blue-900">
                  Server Upload Features:
                </h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• Files processed on server before storage</li>
                  <li>• Server-side validation and security checks</li>
                  <li>• Automatic file optimization and metadata extraction</li>
                  <li>• Progress tracking and error handling</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Features Tab */}
        <TabsContent value="advanced" className="space-y-6">
          {/* Image Upload with Custom Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Advanced Image Compression
              </CardTitle>
              <CardDescription>
                Fine-tuned image compression with custom quality and size
                settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploader
                acceptedFileTypes={["image/jpeg", "image/png", "image/webp"]}
                maxFileSize={20 * 1024 * 1024} // 20MB
                maxFiles={5}
                enableImageCompression={true}
                imageCompressionQuality={0.6}
                imageCompressionMaxWidth={1280}
                imageCompressionMaxHeight={720}
                onUploadComplete={handleUploadComplete}
              />
              <div className="mt-4 rounded-lg border bg-gray-50 p-4">
                <h4 className="mb-2 font-medium">Compression Settings:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Quality: 60%</li>
                  <li>• Max Width: 1280px</li>
                  <li>• Max Height: 720px</li>
                  <li>• Automatic format optimization</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Large File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Large File Upload</CardTitle>
              <CardDescription>
                Upload larger files with extended size limits.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploader
                maxFileSize={50 * 1024 * 1024} // 50MB
                maxFiles={2}
                onUploadComplete={handleUploadComplete}
              />
              <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Large files may take longer to upload
                  and process. Ensure stable internet connection for best
                  results.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files</CardTitle>
            <CardDescription>
              Files successfully uploaded to R2 storage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center space-x-4">
                    {/* File preview for images */}
                    {file.contentType.startsWith("image/") && (
                      <Image
                        src={file.url}
                        alt={file.fileName}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded object-cover"
                      />
                    )}

                    <div>
                      <p className="font-medium">{file.fileName}</p>
                      <div className="text-muted-foreground flex items-center space-x-2 text-sm">
                        <span>{formatFileSize(file.size)}</span>
                        <Badge variant="secondary" className="text-xs">
                          {file.contentType}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Copy URL button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(file.url)}
                    >
                      <Copy className="mr-1 h-4 w-4" />
                      Copy URL
                    </Button>

                    {/* Open file button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(file.url, "_blank")}
                    >
                      <ExternalLink className="mr-1 h-4 w-4" />
                      Open
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardPageWrapper>
  );
}
