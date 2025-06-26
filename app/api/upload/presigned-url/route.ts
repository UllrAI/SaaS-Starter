import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { createPresignedUrl } from "@/lib/r2";
import { db } from "@/database";
import { uploads } from "@/database/schema";
import {
  isFileTypeAllowed,
  isFileSizeAllowed,
  UPLOAD_CONFIG,
  formatFileSize,
  presignedUrlRequestSchema, // 导入 Zod schema
} from "@/lib/config/upload";
import { rateLimiters } from "@/lib/rate-limit";
import {
  createRateLimitError,
  createAuthError,
  createValidationError,
  createApiError,
  handleApiError,
  addRateLimitHeaders,
  API_ERROR_CODES,
  type ErrorLogContext,
} from "@/lib/api-error-handler";

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting check
    const rateLimitResult = await rateLimiters.upload(request);
    if (!rateLimitResult.success) {
      return createRateLimitError(
        rateLimitResult,
        "Too many upload requests, please try again later.",
      );
    }

    // 2. 认证检查
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return createAuthError();
    }

    // 3. 解析和验证请求体
    const body = await request.json();
    const validation = presignedUrlRequestSchema.safeParse(body);

    if (!validation.success) {
      return createValidationError(validation.error, "Invalid request data");
    }

    const { fileName, contentType, size } = validation.data;

    // 4. 服务器端文件规则验证 (关键安全修复)
    if (!isFileTypeAllowed(contentType)) {
      return createApiError(
        API_ERROR_CODES.INVALID_FILE_TYPE,
        `File type '${contentType}' is not allowed.`,
        400,
      );
    }

    if (!isFileSizeAllowed(size)) {
      return createApiError(
        API_ERROR_CODES.FILE_TOO_LARGE,
        `File size of ${formatFileSize(size)} exceeds the limit of ${formatFileSize(UPLOAD_CONFIG.MAX_FILE_SIZE)}.`,
        400,
      );
    }

    // 5. 创建预签名 URL
    const result = await createPresignedUrl({
      userId: session.user.id,
      fileName,
      contentType,
      size,
    });

    if (!result.success) {
      // createPresignedUrl 内部已经包含了验证，但我们在这里再次捕获以防万一
      return createApiError(
        API_ERROR_CODES.FILE_UPLOAD_FAILED,
        result.error || "Failed to create presigned URL",
        400,
      );
    }

    // 6. 在数据库中存储待上传记录 (pending status)
    // 注意：这里的状态是隐式的。上传成功后，客户端不需再通知服务端。
    // 如果需要更严格的上传状态管理（例如，确认上传完成），则需要额外的步骤。
    if (result.key && result.publicUrl) {
      await db.insert(uploads).values({
        userId: session.user.id,
        fileKey: result.key,
        url: result.publicUrl,
        fileName,
        fileSize: size,
        contentType,
        // status: 'pending' // 可以添加一个状态字段
      });
    }

    // 7. 返回预签名 URL 给客户端
    const response = NextResponse.json({
      presignedUrl: result.presignedUrl,
      publicUrl: result.publicUrl,
      key: result.key,
    });

    // Add rate limit headers to response
    return addRateLimitHeaders(response, rateLimitResult);
  } catch (error) {
    const context: ErrorLogContext = {
      endpoint: "/api/upload/presigned-url",
      method: "POST",
      userId: undefined, // session might not be available in catch block
      error,
    };

    return handleApiError(error, context);
  }
}
