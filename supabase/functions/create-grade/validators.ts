import { CreateGradeRequest } from "./types.ts";

export function validateRequest(body: unknown): CreateGradeRequest {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request body.");
  }

  const request = body as CreateGradeRequest;

  if (!request.gradeName?.trim()) {
    throw new Error("Grade name is required.");
  }

  if (!Array.isArray(request.divisions) || request.divisions.length === 0) {
    throw new Error("At least one division is required.");
  }

  return request;
}