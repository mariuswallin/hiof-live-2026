"use server";

import type { TaskDTO } from "./task-mapper";
import { requestInfo } from "rwsdk/worker";
import { demoDelay, demoFailure } from "@/lib/demo-chaos";
import { service } from "./task-service";

export type CreateTaskFormValues = { title: string; dueDate: string };

export type CreateTaskFormState =
  | { ok: true; data: TaskDTO }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        fieldErrors: Record<string, string[]>;
      };
      values: CreateTaskFormValues;
    }
  | null;

export type CreateTaskFormAction = (
  prevState: CreateTaskFormState,
  formData: FormData,
) => Promise<CreateTaskFormState>;

export async function createTaskAction(
  _prevState: CreateTaskFormState,
  formData: FormData,
): Promise<CreateTaskFormState> {
  // <input name="title" />
  const values: CreateTaskFormValues = {
    title: String(formData.get("title") ?? " "),
    dueDate: String(formData.get("dueDate") ?? ""),
  };

  const { ctx, request } = requestInfo;
  await demoDelay(request, 1200);

  const result = await service.create({
    title: values.title,
    dueDate: values.dueDate || undefined,
  });

  return result.ok
    ? {
        ok: true,
        data: result.data,
      }
    : {
        ok: false,
        error: result.error,
        values,
      };
}

export async function toggleTaskCompleted(id: string, completed: boolean) {
  const { ctx, request } = requestInfo;

  await demoDelay(request, 1000);
  const chaos = demoFailure(request);

  if (chaos) return { ok: false as const, error: chaos.message };

  const result = await service.update(id, { completed });

  return result.ok
    ? {
        ok: true as const,
        data: result.data,
      }
    : {
        ok: false as const,
        error: result.error.message,
      };
}
