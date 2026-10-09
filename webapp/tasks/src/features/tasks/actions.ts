"use server";

import type { TaskDTO } from "./task-mapper";
import { requestInfo } from "rwsdk/worker";
import { demoDelay } from "@/lib/demo-chaos";
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
