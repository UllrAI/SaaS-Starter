export class MachineAuthError extends Error {
  code: string;
  status: number;
  details: Record<string, unknown> | null;

  constructor(params: {
    code: string;
    message: string;
    status: number;
    details?: Record<string, unknown> | null;
  }) {
    super(params.message);
    this.name = "MachineAuthError";
    this.code = params.code;
    this.status = params.status;
    this.details = params.details ?? null;
  }
}

export function toMachineAuthError(error: unknown): MachineAuthError {
  if (error instanceof MachineAuthError) {
    return error;
  }

  if (error instanceof Error) {
    return new MachineAuthError({
      code: "INTERNAL_ERROR",
      message: "Authentication service unavailable.",
      status: 500,
    });
  }

  return new MachineAuthError({
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred.",
    status: 500,
  });
}
