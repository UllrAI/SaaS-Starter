import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { createPresignedUrl } from "@/lib/r2";
import {
  isFileTypeAllowed,
  isFileSizeAllowed,
  UPLOAD_CONFIG,
  formatFileSize,
  presignedUrlRequestSchema, // 导入 Zod schema
} from "@/lib/config/upload";

export async function POST(request: NextRequest) {
  try {
    // 1. 认证检查
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 解析和验证请求体
    const body = await request.json();
    const validation = presignedUrlRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { fileName, contentType, size } = validation.data;

    // 3. 服务器端文件规则验证 (关键安全修复)
    if (!isFileTypeAllowed(contentType)) {
      return NextResponse.json(
        { error: `File type '${contentType}' is not allowed.` },
        { status: 400 },
      );
    }

    if (!isFileSizeAllowed(size)) {
      return NextResponse.json(
        {
          error: `File size of ${formatFileSize(size)} exceeds the limit of ${formatFileSize(UPLOAD_CONFIG.MAX_FILE_SIZE)}.`,
        },
        { status: 400 },
      );
    }

    // 4. 创建预签名 URL
    const result = await createPresignedUrl({
      userId: session.user.id,
      fileName,
      contentType,
      size,
    });

    if (!result.success) {
      // createPresignedUrl 内部已经包含了验证，但我们在这里再次捕获以防万一
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // 5. 返回预签名 URL 给客户端。上传完成后由单独的 complete 接口入库。
    return NextResponse.json({
      presignedUrl: result.presignedUrl,
      publicUrl: result.publicUrl,
      key: result.key,
    });
  } catch (error) {
    console.error("Error creating presigned URL:", error);
    return NextResponse.json(
      { error: "Internal Server Error. Please try again later." },
      { status: 500 },
    );
  }
}
