# 文件上传功能

本项目集成了一套强大、安全且可扩展的文件上传系统，集成 Cloudflare R2 对象存储。它支持两种核心上传模式：**客户端预签名上传**和**服务器端代理上传**，以适应不同的应用场景。

## 1. 架构概述

为了确保安全性和性能，系统采用了两种不同的上传流程，但共享同一套验证逻辑。

### 1.1 客户端预签名上传 (推荐用于 UI)

这是通过 `FileUploader` 组件使用的默认和推荐方式。

**流程:**
1.  **用户**：在浏览器中选择或拖拽文件到 `FileUploader` 组件。
2.  **客户端**：进行初步的文件类型和大小验证，并（可选）对图片进行压缩。
3.  **客户端 -> 服务器**：向 `/api/upload/presigned-url` 发送一个请求，包含文件的元数据（文件名、类型、大小）。
4.  **服务器**：
    *   验证用户身份。
    *   **[安全核心]** 再次使用 `lib/config/upload.ts` 中的规则验证文件的元数据。
    *   如果验证通过，向 Cloudflare R2 请求一个有时效性的、安全的上传 URL (预签名 URL)。
    *   在数据库的 `uploads` 表中创建一条记录。
    *   将预签名 URL 返回给客户端。
5.  **客户端 -> R2**：浏览器直接使用预签名 URL 将文件上传到 R2 存储桶，不经过我们的服务器。

**优点**:
*   **高性能**: 文件不经过您的应用服务器中转，减轻了服务器带宽和处理压力。
*   **高可扩展性**: 非常适合处理大量并发上传和大型文件。
*   **安全**: 服务器完全控制哪些文件可以被上传，客户端无法绕过验证。

### 1.2 服务器端代理上传

此模式通过 `/api/upload/server-upload` 接口实现。

**流程**:
1.  **客户端**：将一个或多个文件作为 `multipart/form-data` 发送到 `/api/upload/server-upload`。
2.  **服务器**：
    *   验证用户身份。
    *   接收文件流。
    *   **[安全核心]** 对每个文件进行类型和大小验证。
    *   将验证通过的文件流式传输到 Cloudflare R2。
    *   在数据库中为每个成功上传的文件创建一条记录。
3.  **服务器 -> 客户端**：返回每个文件的上传结果（成功或失败）。

**优点**:
*   **完全控制**: 允许在文件存入 R2 之前对其进行任何服务器端处理（如病毒扫描、水印添加、元数据提取等）。
*   **通用性**: 适用于任何可以发送 `multipart/form-data` 请求的客户端（例如移动 App、脚本、其他后端服务）。

## 2. 全局配置 (`lib/config/upload.ts`)

所有上传规则都集中在此文件，方便统一管理。

| 配置项                     | 类型                     | 描述                                                                                                                                                                   |
| :------------------------- | :----------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MAX_FILE_SIZE`            | `number`                 | 允许上传的最大文件大小，单位为字节。默认 `50 * 1024 * 1024` (50MB)。                                                                                                   |
| `ALLOWED_FILE_TYPES`       | `readonly string[]`      | 自动从MIME_TYPE_TO_EXTENSION 读取允许的 [MIME 类型](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types) 的数组。所有上传路径都会强制执行此白名单。        |
| `PRESIGNED_URL_EXPIRATION` | `number`                 | 客户端预签名 URL 的有效时间，单位为秒。默认 `900` (15分钟)。                                                                                                           |
| `MIME_TYPE_TO_EXTENSION`   | `Record<string, string>` | 一个将 MIME 类型映射到文件扩展名的字典。当您在 `ALLOWED_FILE_TYPES` 中添加新的、不常见的 MIME 类型时，建议在此处也添加相应的映射，以确保生成的文件名具有正确的扩展名。 |

## 3. 使用 `FileUploader` 组件 (客户端上传)

这是在您的应用前端实现文件上传的最简单方式。

### 3.1 基本用法

该组件已预设为使用全局配置，因此最简单的用法无需任何参数。

```tsx
import { FileUploader } from "@/components/ui/file-uploader";

function MyUploadPage() {
  const handleUploadComplete = (files) => {
    // files 是一个包含成功上传文件信息的数组
    // [{ url, key, size, contentType, fileName }]
    console.log("上传完成:", files);
    // 在此处理上传成功的文件信息，例如更新数据库或UI状态
  };

  return (
    <FileUploader onUploadComplete={handleUploadComplete} />
  );
}
```

### 3.2 常用属性 (Props)

您可以覆盖全局配置以适应特定场景。

| Prop                | 类型                              | 默认值                             | 描述                                                               |
| :------------------ | :-------------------------------- | :--------------------------------- | :----------------------------------------------------------------- |
| `acceptedFileTypes` | `readonly string[]`               | `UPLOAD_CONFIG.ALLOWED_FILE_TYPES` | 定义此上传实例允许的文件类型。**注意**：最终验证仍在服务器端执行。 |
| `maxFileSize`       | `number`                          | `UPLOAD_CONFIG.MAX_FILE_SIZE`      | 此上传实例允许的最大文件大小（字节）。                             |
| `maxFiles`          | `number`                          | `1`                                | 允许同时选择和上传的最大文件数量。                                 |
| `onUploadComplete`  | `(files: UploadedFile[]) => void` | `undefined`                        | 上传成功后的回调函数，接收一个包含所有成功上传文件信息的数组。     |
| `disabled`          | `boolean`                         | `false`                            | 禁用上传器。                                                       |

### 3.3 图片压缩

组件内置了强大的客户端图片压缩功能，可在上传前优化图片，节省带宽和存储。

```tsx
<FileUploader
  // 仅接受图片
  acceptedFileTypes={["image/jpeg", "image/png", "image/webp"]}
  maxFiles={5}
  
  // 启用压缩
  enableImageCompression={true}
  
  // 压缩质量 (0.1 - 1.0)
  imageCompressionQuality={0.7}
  
  // 压缩后图片的最大宽度
  imageCompressionMaxWidth={1280}
  
  // 压缩后图片的最大高度
  imageCompressionMaxHeight={1080}
  
  onUploadComplete={handleUploadComplete}
/>
```

## 4. 使用服务器端上传 API

当您需要从后端或其他非浏览器环境上传文件时，可以使用 `/api/upload/server-upload` 接口。

### 4.1 接口详情

*   **URL**: `/api/upload/server-upload`
*   **Method**: `POST`
*   **Auth**: 需要有效的用户会话（通过 Cookie）。
*   **Body**: `multipart/form-data`，其中每个文件都附加在名为 `files` 的字段上。

### 4.2 使用示例 (`curl`)

**上传单个文件:**

```bash
curl -X POST \
  -b "your_session_cookie_here" \
  -F "files=@/path/to/your/image.jpg" \
  http://localhost:3000/api/upload/server-upload
```

**上传多个文件:**

```bash
curl -X POST \
  -b "your_session_cookie_here" \
  -F "files=@/path/to/your/image.jpg" \
  -F "files=@/path/to/your/document.pdf" \
  http://localhost:3000/api/upload/server-upload
```

### 4.3 响应格式

接口会返回一个 JSON 对象，包含上传的摘要和每个文件的详细结果。

```json
{
  "message": "Uploaded 1 file(s) successfully, 1 failed",
  "results": [
    {
      "fileName": "image.jpg",
      "url": "https://your-r2-public-url/uploads/...",
      "key": "uploads/...",
      "size": 102400,
      "contentType": "image/jpeg",
      "success": true
    },
    {
      "fileName": "large-file.zip",
      "success": false,
      "error": "File size 60000000 bytes exceeds maximum allowed size of 52428800 bytes"
    }
  ],
  "summary": {
    "total": 2,
    "success": 1,
    "failed": 1
  }
}
```

## 5. R2 与 CORS 配置

正确的 R2 配置是文件上传功能正常工作的关键。

1.  **环境变量**:
    确保您的 `.env` 文件中已正确配置以下所有 `R2_*` 变量：
    *   `R2_ENDPOINT`
    *   `R2_ACCESS_KEY_ID`
    *   `R2_SECRET_ACCESS_KEY`
    *   `R2_BUCKET_NAME`
    *   `R2_PUBLIC_URL`

2.  **CORS 策略**:
    为了允许浏览器直接上传到 R2，您必须在 Cloudflare R2 存储桶的“设置”中配置 CORS 策略。将 `AllowedOrigins` 中的 URL 替换为您自己的域名和本地开发地址。

    ```json
    [
      {
        "AllowedOrigins": ["http://localhost:3000", "https://your-saas-domain.com"],
        "AllowedMethods": ["PUT", "GET"],
        "AllowedHeaders": ["*"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
      }
    ]
    ```

## 6. 安全与最佳实践

*   **服务器端验证**: 系统的核心安全保障在于服务器端对所有上传请求的元数据进行强制验证。即使有人尝试绕过前端直接调用 API，不符合 `lib/config/upload.ts` 规则的文件也无法获取上传权限。
*   **权限**: 所有上传接口都受用户会话保护，只有登录用户才能上传。
*   **管理与监控**: 所有成功上传的文件记录都存储在数据库的 `uploads` 表中，您可以在后台管理系统的 "Upload Management" 页面进行查看和管理。
