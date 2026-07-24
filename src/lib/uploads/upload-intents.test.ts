import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockExecute = jest.fn() as any;
const mockSelect = jest.fn() as any;
const mockInsert = jest.fn() as any;
const mockUpdate = jest.fn() as any;
const mockDelete = jest.fn() as any;
const mockTransaction = jest.fn() as any;

const mockTx = {
  execute: mockExecute,
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
};

const mockDb = {
  transaction: mockTransaction,
  select: jest.fn() as any,
  update: jest.fn() as any,
  delete: jest.fn() as any,
};

jest.mock("@/database", () => ({ db: mockDb }));
jest.mock("@/database/schema", () => ({
  uploadIntents: {
    id: "intent.id",
    userId: "intent.userId",
    fileKey: "intent.fileKey",
    fileSize: "intent.fileSize",
    status: "intent.status",
    expiresAt: "intent.expiresAt",
    createdAt: "intent.createdAt",
    updatedAt: "intent.updatedAt",
    cleanupAttempts: "intent.cleanupAttempts",
  },
  uploads: {
    id: "upload.id",
    userId: "upload.userId",
    uploadIntentId: "upload.uploadIntentId",
    fileKey: "upload.fileKey",
    fileSize: "upload.fileSize",
    createdAt: "upload.createdAt",
  },
}));

const mockEnv = {
  UPLOAD_DAILY_QUOTA_BYTES: 2_000,
  UPLOAD_TOTAL_QUOTA_BYTES: 5_000,
  UPLOAD_LEGACY_COMPLETION_SINCE: undefined as string | undefined,
  UPLOAD_LEGACY_COMPLETION_UNTIL: undefined as string | undefined,
};
jest.mock("@/env", () => ({
  __esModule: true,
  default: mockEnv,
}));

const mockDeleteFile = jest.fn() as any;
jest.mock("@/lib/r2", () => ({
  buildR2PublicUrl: (key: string) => `https://cdn.example.com/${key}`,
  deleteFile: mockDeleteFile,
}));

jest.mock("@/lib/config/upload", () => ({
  getFileExtension: () => "jpeg",
  UPLOAD_CONFIG: {
    UPLOAD_INTENT_EXPIRATION: 3_600,
    UPLOAD_TOMBSTONE_RECHECK_DELAY: 86_400,
    UPLOAD_CLEANUP_RETRY_DELAY: 300,
    PRESIGNED_URL_EXPIRATION: 900,
  },
}));

jest.mock("crypto", () => ({
  randomUUID: () => "11111111-1111-4111-8111-111111111111",
}));

jest.mock("drizzle-orm", () => ({
  and: (...conditions: unknown[]) => ({ type: "and", conditions }),
  eq: (field: unknown, value: unknown) => ({ type: "eq", field, value }),
  inArray: (field: unknown, values: unknown[]) => ({
    type: "inArray",
    field,
    values,
  }),
  or: (...conditions: unknown[]) => ({ type: "or", conditions }),
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
    strings,
    values,
  }),
}));

const pendingIntent = {
  id: "11111111-1111-4111-8111-111111111111",
  userId: "user-1",
  fileKey: "uploads/user-1/11111111-1111-4111-8111-111111111111.jpeg",
  fileName: "photo.jpeg",
  fileSize: 1_000,
  contentType: "image/jpeg",
  status: "pending",
  expiresAt: new Date(Date.now() + 60_000),
  completedAt: null,
  deleteCheckedAt: null,
  cleanupAttempts: 0,
  lastCleanupError: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const uploadRecord = {
  id: "upload-1",
  userId: "user-1",
  uploadIntentId: pendingIntent.id,
  fileKey: pendingIntent.fileKey,
  url: `https://cdn.example.com/${pendingIntent.fileKey}`,
  fileName: pendingIntent.fileName,
  fileSize: pendingIntent.fileSize,
  contentType: pendingIntent.contentType,
  createdAt: new Date(),
};

describe("upload intent service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnv.UPLOAD_LEGACY_COMPLETION_SINCE = undefined;
    mockEnv.UPLOAD_LEGACY_COMPLETION_UNTIL = undefined;
    mockTransaction.mockImplementation(
      (callback: (tx: typeof mockTx) => unknown) => callback(mockTx),
    );
    mockExecute.mockResolvedValue([]);
  });

  it("serializes quota calculation before reserving an upload", async () => {
    const usageWhere = jest
      .fn()
      .mockResolvedValueOnce([{ total: 500, recent: 500 }])
      .mockResolvedValueOnce([{ total: 250, recent: 250 }]);
    mockSelect.mockReturnValue({
      from: jest.fn(() => ({ where: usageWhere })),
    });
    const returning = jest.fn().mockResolvedValue([pendingIntent]);
    mockInsert.mockReturnValue({
      values: jest.fn(() => ({ returning })),
    });

    const { createUploadIntent } = await import("./upload-intents");
    const result = await createUploadIntent({
      userId: "user-1",
      fileName: "photo.jpeg",
      fileSize: 1_000,
      contentType: "image/jpeg",
    });

    expect(result).toEqual(pendingIntent);
    expect(mockExecute).toHaveBeenCalledTimes(1);
    expect(mockExecute.mock.invocationCallOrder[0]).toBeLessThan(
      mockSelect.mock.invocationCallOrder[0]!,
    );
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it("rejects a reservation that exceeds the rolling daily quota", async () => {
    const usageWhere = jest
      .fn()
      .mockResolvedValueOnce([{ total: 1_500, recent: 1_500 }])
      .mockResolvedValueOnce([{ total: 0, recent: 0 }]);
    mockSelect.mockReturnValue({
      from: jest.fn(() => ({ where: usageWhere })),
    });

    const { createUploadIntent, UploadQuotaExceededError } =
      await import("./upload-intents");

    await expect(
      createUploadIntent({
        userId: "user-1",
        fileName: "photo.jpeg",
        fileSize: 1_000,
        contentType: "image/jpeg",
      }),
    ).rejects.toBeInstanceOf(UploadQuotaExceededError);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("marks a pending intent cancelled without deleting it immediately", async () => {
    const returning = jest.fn().mockResolvedValue([{ id: pendingIntent.id }]);
    const set = jest.fn(() => ({
      where: jest.fn(() => ({ returning })),
    }));
    mockUpdate.mockReturnValue({
      set,
    });

    const { cancelUploadIntent } = await import("./upload-intents");
    await expect(
      cancelUploadIntent(pendingIntent.id, pendingIntent.userId),
    ).resolves.toBe(true);
    expect(mockExecute).toHaveBeenCalledTimes(1);
    expect(returning).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith({
      status: "cancelled",
      updatedAt: expect.anything(),
    });
  });

  it("completes a pending intent atomically from reserved metadata", async () => {
    const forUpdate = jest.fn().mockResolvedValue([
      {
        row: pendingIntent,
        expired: false,
      },
    ]);
    mockSelect.mockReturnValue({
      from: jest.fn(() => ({
        where: jest.fn(() => ({ for: forUpdate })),
      })),
    });
    mockInsert.mockReturnValue({
      values: jest.fn(() => ({
        returning: jest.fn().mockResolvedValue([uploadRecord]),
      })),
    });
    const updateWhere = jest.fn().mockResolvedValue([]);
    mockUpdate.mockReturnValue({
      set: jest.fn(() => ({ where: updateWhere })),
    });

    const { completeUploadIntent } = await import("./upload-intents");
    const result = await completeUploadIntent({
      intentId: pendingIntent.id,
      userId: pendingIntent.userId,
      key: pendingIntent.fileKey,
      contentLength: pendingIntent.fileSize,
      contentType: pendingIntent.contentType,
      declaration: {
        fileName: pendingIntent.fileName,
        fileSize: pendingIntent.fileSize,
        contentType: pendingIntent.contentType,
        url: uploadRecord.url,
      },
    });

    expect(result).toEqual(uploadRecord);
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockInsert.mock.invocationCallOrder[0]).toBeLessThan(
      mockUpdate.mock.invocationCallOrder[0]!,
    );
  });

  it("returns the existing upload for an idempotent completion", async () => {
    const completedIntent = { ...pendingIntent, status: "completed" };
    mockSelect
      .mockReturnValueOnce({
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            for: jest.fn().mockResolvedValue([
              {
                row: completedIntent,
                expired: true,
              },
            ]),
          })),
        })),
      })
      .mockReturnValueOnce({
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue([uploadRecord]),
          })),
        })),
      });

    const { completeUploadIntent } = await import("./upload-intents");
    const result = await completeUploadIntent({
      userId: pendingIntent.userId,
      key: pendingIntent.fileKey,
      contentLength: pendingIntent.fileSize,
      contentType: pendingIntent.contentType,
    });

    expect(result).toEqual(uploadRecord);
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("accepts a bounded legacy completion during a rolling deployment", async () => {
    const issuedAt = Date.now();
    const legacyKey = `uploads/user-1/${issuedAt}-11111111-1111-4111-8111-111111111111.jpeg`;
    const legacyRecord = {
      ...uploadRecord,
      uploadIntentId: null,
      fileKey: legacyKey,
      url: `https://cdn.example.com/${legacyKey}`,
    };
    mockEnv.UPLOAD_LEGACY_COMPLETION_UNTIL = new Date(
      issuedAt + 60 * 60 * 1000,
    ).toISOString();
    mockEnv.UPLOAD_LEGACY_COMPLETION_SINCE = new Date(
      issuedAt - 60 * 1000,
    ).toISOString();
    mockSelect
      .mockReturnValueOnce({
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue([]),
          })),
        })),
      })
      .mockReturnValueOnce({
        from: jest.fn(() => ({
          where: jest.fn().mockResolvedValue([{ total: 0, recent: 0 }]),
        })),
      })
      .mockReturnValueOnce({
        from: jest.fn(() => ({
          where: jest.fn().mockResolvedValue([{ total: 0, recent: 0 }]),
        })),
      });
    mockInsert.mockReturnValue({
      values: jest.fn(() => ({
        onConflictDoNothing: jest.fn(() => ({
          returning: jest.fn().mockResolvedValue([legacyRecord]),
        })),
      })),
    });

    const { completeLegacyUpload } = await import("./upload-intents");
    const result = await completeLegacyUpload({
      userId: "user-1",
      key: legacyKey,
      contentLength: 1_000,
      contentType: "image/jpeg",
      declaration: {
        fileName: "photo.jpeg",
        fileSize: 1_000,
        contentType: "image/jpeg",
        url: legacyRecord.url,
      },
    });

    expect(result).toEqual(legacyRecord);
    expect(mockExecute).toHaveBeenCalledTimes(1);
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it.each([
    {
      name: "an unconfigured window",
      userId: "user-1",
      key: (now: number) =>
        `uploads/user-1/${now}-11111111-1111-4111-8111-111111111111.jpeg`,
      configure: () => undefined,
    },
    {
      name: "another user's key",
      userId: "user-1",
      key: (now: number) =>
        `uploads/user-2/${now}-11111111-1111-4111-8111-111111111111.jpeg`,
      configure: (now: number) => {
        mockEnv.UPLOAD_LEGACY_COMPLETION_SINCE = new Date(
          now - 1_000,
        ).toISOString();
        mockEnv.UPLOAD_LEGACY_COMPLETION_UNTIL = new Date(
          now + 60_000,
        ).toISOString();
      },
    },
    {
      name: "a v2 UUID key",
      userId: "user-1",
      key: () => "uploads/user-1/11111111-1111-4111-8111-111111111111.jpeg",
      configure: (now: number) => {
        mockEnv.UPLOAD_LEGACY_COMPLETION_SINCE = new Date(
          now - 1_000,
        ).toISOString();
        mockEnv.UPLOAD_LEGACY_COMPLETION_UNTIL = new Date(
          now + 60_000,
        ).toISOString();
      },
    },
    {
      name: "an expired window",
      userId: "user-1",
      key: (now: number) =>
        `uploads/user-1/${now - 60_000}-11111111-1111-4111-8111-111111111111.jpeg`,
      configure: (now: number) => {
        mockEnv.UPLOAD_LEGACY_COMPLETION_SINCE = new Date(
          now - 120_000,
        ).toISOString();
        mockEnv.UPLOAD_LEGACY_COMPLETION_UNTIL = new Date(
          now - 1,
        ).toISOString();
      },
    },
    {
      name: "an object issued before the presign overlap",
      userId: "user-1",
      key: (now: number) =>
        `uploads/user-1/${now - 20 * 60 * 1000}-11111111-1111-4111-8111-111111111111.jpeg`,
      configure: (now: number) => {
        mockEnv.UPLOAD_LEGACY_COMPLETION_SINCE = new Date(now).toISOString();
        mockEnv.UPLOAD_LEGACY_COMPLETION_UNTIL = new Date(
          now + 60_000,
        ).toISOString();
      },
    },
    {
      name: "an implausibly future object",
      userId: "user-1",
      key: (now: number) =>
        `uploads/user-1/${now + 10 * 60 * 1000}-11111111-1111-4111-8111-111111111111.jpeg`,
      configure: (now: number) => {
        mockEnv.UPLOAD_LEGACY_COMPLETION_SINCE = new Date(
          now - 1_000,
        ).toISOString();
        mockEnv.UPLOAD_LEGACY_COMPLETION_UNTIL = new Date(
          now + 60 * 60 * 1000,
        ).toISOString();
      },
    },
  ])(
    "rejects legacy completion for $name",
    async ({ userId, key, configure }) => {
      const now = Date.now();
      configure(now);
      const { completeLegacyUpload } = await import("./upload-intents");
      const result = await completeLegacyUpload({
        userId,
        key: key(now),
        contentLength: 1_000,
        contentType: "image/jpeg",
        declaration: {
          fileName: "photo.jpeg",
          fileSize: 1_000,
          contentType: "image/jpeg",
          url: "https://cdn.example.com/ignored",
        },
      });

      expect(result).toBeNull();
      expect(mockTransaction).not.toHaveBeenCalled();
    },
  );

  it("rejects changed metadata before recording a legacy upload", async () => {
    const issuedAt = Date.now();
    const legacyKey = `uploads/user-1/${issuedAt}-11111111-1111-4111-8111-111111111111.jpeg`;
    mockEnv.UPLOAD_LEGACY_COMPLETION_SINCE = new Date(
      issuedAt - 1_000,
    ).toISOString();
    mockEnv.UPLOAD_LEGACY_COMPLETION_UNTIL = new Date(
      issuedAt + 60_000,
    ).toISOString();

    const { completeLegacyUpload, UploadMetadataMismatchError } =
      await import("./upload-intents");
    await expect(
      completeLegacyUpload({
        userId: "user-1",
        key: legacyKey,
        contentLength: 1_000,
        contentType: "image/jpeg",
        declaration: {
          fileName: "photo.jpeg",
          fileSize: 999,
          contentType: "image/jpeg",
          url: `https://cdn.example.com/${legacyKey}`,
        },
      }),
    ).rejects.toBeInstanceOf(UploadMetadataMismatchError);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("rechecks the legacy cutoff after acquiring the user lock", async () => {
    const issuedAt = Date.now();
    const legacyKey = `uploads/user-1/${issuedAt}-11111111-1111-4111-8111-111111111111.jpeg`;
    mockEnv.UPLOAD_LEGACY_COMPLETION_SINCE = new Date(
      issuedAt - 1_000,
    ).toISOString();
    mockEnv.UPLOAD_LEGACY_COMPLETION_UNTIL = new Date(
      issuedAt + 60_000,
    ).toISOString();
    mockTransaction.mockImplementation(
      (callback: (tx: typeof mockTx) => unknown) => {
        mockEnv.UPLOAD_LEGACY_COMPLETION_UNTIL = new Date(
          Date.now() - 1,
        ).toISOString();
        return callback(mockTx);
      },
    );

    const { completeLegacyUpload } = await import("./upload-intents");
    const result = await completeLegacyUpload({
      userId: "user-1",
      key: legacyKey,
      contentLength: 1_000,
      contentType: "image/jpeg",
      declaration: {
        fileName: "photo.jpeg",
        fileSize: 1_000,
        contentType: "image/jpeg",
        url: `https://cdn.example.com/${legacyKey}`,
      },
    });

    expect(result).toBeNull();
    expect(mockExecute).toHaveBeenCalledTimes(1);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns an existing same-owner legacy record without charging quota again", async () => {
    const issuedAt = Date.now();
    const legacyKey = `uploads/user-1/${issuedAt}-11111111-1111-4111-8111-111111111111.jpeg`;
    const existingRecord = {
      ...uploadRecord,
      uploadIntentId: null,
      fileKey: legacyKey,
      url: `https://cdn.example.com/${legacyKey}`,
    };
    mockEnv.UPLOAD_LEGACY_COMPLETION_SINCE = new Date(
      issuedAt - 1_000,
    ).toISOString();
    mockEnv.UPLOAD_LEGACY_COMPLETION_UNTIL = new Date(
      issuedAt + 60_000,
    ).toISOString();
    mockSelect.mockReturnValue({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          limit: jest.fn().mockResolvedValue([existingRecord]),
        })),
      })),
    });

    const { completeLegacyUpload } = await import("./upload-intents");
    const result = await completeLegacyUpload({
      userId: "user-1",
      key: legacyKey,
      contentLength: 1_000,
      contentType: "image/jpeg",
      declaration: {
        fileName: "photo.jpeg",
        fileSize: 1_000,
        contentType: "image/jpeg",
        url: existingRecord.url,
      },
    });

    expect(result).toEqual(existingRecord);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("rejects a new legacy record when it would exceed quota", async () => {
    const issuedAt = Date.now();
    const legacyKey = `uploads/user-1/${issuedAt}-11111111-1111-4111-8111-111111111111.jpeg`;
    mockEnv.UPLOAD_LEGACY_COMPLETION_SINCE = new Date(
      issuedAt - 1_000,
    ).toISOString();
    mockEnv.UPLOAD_LEGACY_COMPLETION_UNTIL = new Date(
      issuedAt + 60_000,
    ).toISOString();
    mockSelect
      .mockReturnValueOnce({
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue([]),
          })),
        })),
      })
      .mockReturnValueOnce({
        from: jest.fn(() => ({
          where: jest.fn().mockResolvedValue([{ total: 1_500, recent: 1_500 }]),
        })),
      })
      .mockReturnValueOnce({
        from: jest.fn(() => ({
          where: jest.fn().mockResolvedValue([{ total: 0, recent: 0 }]),
        })),
      });

    const { completeLegacyUpload, UploadQuotaExceededError } =
      await import("./upload-intents");
    await expect(
      completeLegacyUpload({
        userId: "user-1",
        key: legacyKey,
        contentLength: 1_000,
        contentType: "image/jpeg",
        declaration: {
          fileName: "photo.jpeg",
          fileSize: 1_000,
          contentType: "image/jpeg",
          url: `https://cdn.example.com/${legacyKey}`,
        },
      }),
    ).rejects.toBeInstanceOf(UploadQuotaExceededError);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("does not return a unique-key conflict owned by another user", async () => {
    const issuedAt = Date.now();
    const legacyKey = `uploads/user-1/${issuedAt}-11111111-1111-4111-8111-111111111111.jpeg`;
    mockEnv.UPLOAD_LEGACY_COMPLETION_SINCE = new Date(
      issuedAt - 1_000,
    ).toISOString();
    mockEnv.UPLOAD_LEGACY_COMPLETION_UNTIL = new Date(
      issuedAt + 60_000,
    ).toISOString();
    mockSelect
      .mockReturnValueOnce({
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue([]),
          })),
        })),
      })
      .mockReturnValueOnce({
        from: jest.fn(() => ({
          where: jest.fn().mockResolvedValue([{ total: 0, recent: 0 }]),
        })),
      })
      .mockReturnValueOnce({
        from: jest.fn(() => ({
          where: jest.fn().mockResolvedValue([{ total: 0, recent: 0 }]),
        })),
      })
      .mockReturnValueOnce({
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue([]),
          })),
        })),
      });
    mockInsert.mockReturnValue({
      values: jest.fn(() => ({
        onConflictDoNothing: jest.fn(() => ({
          returning: jest.fn().mockResolvedValue([]),
        })),
      })),
    });

    const { completeLegacyUpload } = await import("./upload-intents");
    const result = await completeLegacyUpload({
      userId: "user-1",
      key: legacyKey,
      contentLength: 1_000,
      contentType: "image/jpeg",
      declaration: {
        fileName: "photo.jpeg",
        fileSize: 1_000,
        contentType: "image/jpeg",
        url: `https://cdn.example.com/${legacyKey}`,
      },
    });

    expect(result).toBeNull();
  });

  it("retains a tombstone after the first successful object deletion", async () => {
    mockDb.select.mockReturnValue({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          orderBy: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue([
              {
                id: pendingIntent.id,
                userId: pendingIntent.userId,
                status: "pending",
              },
            ]),
          })),
        })),
      })),
    });
    mockUpdate.mockReturnValue({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn().mockResolvedValue([pendingIntent]),
        })),
      })),
    });
    const tombstoneWhere = jest.fn().mockResolvedValue([]);
    const tombstoneSet = jest.fn(() => ({ where: tombstoneWhere }));
    mockDb.update.mockReturnValue({ set: tombstoneSet });
    mockDeleteFile.mockResolvedValue({ success: true });

    const { cleanupExpiredUploadIntents } = await import("./upload-intents");
    const result = await cleanupExpiredUploadIntents();

    expect(result).toEqual({
      scanned: 1,
      deleted: 0,
      deferred: 1,
      failed: 0,
    });
    expect(mockDeleteFile).toHaveBeenCalledWith(pendingIntent.fileKey);
    expect(mockDb.delete).not.toHaveBeenCalled();
    expect(tombstoneSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "cancelled",
        deleteCheckedAt: expect.anything(),
        expiresAt: expect.objectContaining({ values: [86_400] }),
        lastCleanupError: null,
      }),
    );
    expect(mockDeleteFile.mock.invocationCallOrder[0]).toBeLessThan(
      mockDb.update.mock.invocationCallOrder[0]!,
    );
  });

  it("deletes a tombstone after the second successful object deletion", async () => {
    mockDb.select.mockReturnValue({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          orderBy: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue([
              {
                id: pendingIntent.id,
                userId: pendingIntent.userId,
                status: "cancelled",
              },
            ]),
          })),
        })),
      })),
    });
    mockUpdate.mockReturnValue({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn().mockResolvedValue([
            {
              ...pendingIntent,
              status: "cleaning",
              deleteCheckedAt: new Date(),
            },
          ]),
        })),
      })),
    });
    const deleteWhere = jest.fn().mockResolvedValue([]);
    mockDb.delete.mockReturnValue({ where: deleteWhere });
    mockDeleteFile.mockResolvedValue({ success: true });

    const { cleanupExpiredUploadIntents } = await import("./upload-intents");
    const result = await cleanupExpiredUploadIntents();

    expect(result).toEqual({
      scanned: 1,
      deleted: 1,
      deferred: 0,
      failed: 0,
    });
    expect(mockDeleteFile).toHaveBeenCalledWith(pendingIntent.fileKey);
    expect(mockDb.delete).toHaveBeenCalledTimes(1);
    expect(mockDeleteFile.mock.invocationCallOrder[0]).toBeLessThan(
      mockDb.delete.mock.invocationCallOrder[0]!,
    );
  });

  it("delays retry after an object deletion failure", async () => {
    mockDb.select.mockReturnValue({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          orderBy: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue([
              {
                id: pendingIntent.id,
                userId: pendingIntent.userId,
                status: "pending",
              },
            ]),
          })),
        })),
      })),
    });
    mockUpdate.mockReturnValue({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn().mockResolvedValue([pendingIntent]),
        })),
      })),
    });
    const failureWhere = jest.fn().mockResolvedValue([]);
    const failureSet = jest.fn(() => ({ where: failureWhere }));
    mockDb.update.mockReturnValue({ set: failureSet });
    mockDeleteFile.mockResolvedValue({
      success: false,
      error: "R2 unavailable",
    });

    const { cleanupExpiredUploadIntents } = await import("./upload-intents");
    const result = await cleanupExpiredUploadIntents();

    expect(result).toEqual({
      scanned: 1,
      deleted: 0,
      deferred: 0,
      failed: 1,
    });
    expect(mockDb.delete).not.toHaveBeenCalled();
    expect(failureSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "pending",
        expiresAt: expect.objectContaining({ values: [300] }),
        lastCleanupError: "R2 unavailable",
      }),
    );
  });
});
