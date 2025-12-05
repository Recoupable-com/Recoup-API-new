import { NextRequest, NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { insertScheduledAction } from "@/lib/supabase/scheduled_actions/insertScheduledAction";
import { updateScheduledAction } from "@/lib/supabase/scheduled_actions/updateScheduledAction";
import { createSchedule } from "@/lib/trigger/createSchedule";
import { validateCreateTaskBody } from "@/lib/tasks/validateCreateTaskBody";

/**
 * Creates a new task (scheduled action)
 * Returns the created task in an array, matching GET response shape
 *
 * Body parameters:
 * - title (required): The title of the task
 * - prompt (required): The prompt for the task
 * - schedule (required): The cron schedule string
 * - account_id (required): The account ID
 * - artist_account_id (required): The artist account ID
 * - model (optional): The model to use for the task
 *
 * @param request - The request object containing the task data in the body.
 * @returns A NextResponse with the created task.
 */
export async function createTaskHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const validatedBody = validateCreateTaskBody(body);
    if (validatedBody instanceof NextResponse) {
      return validatedBody;
    }

    const { schedule } = validatedBody;

    const tasks = await insertScheduledAction(validatedBody);

    const created = tasks[0];
    if (!created || !created.id) {
      throw new Error("Failed to create task: missing Supabase id for scheduling");
    }

    const triggerSchedule = await createSchedule({
      cron: schedule,
      deduplicationKey: created.id,
      externalId: created.id,
    });

    if (!triggerSchedule.id) {
      throw new Error("Failed to create Trigger.dev schedule: missing schedule id");
    }

    const updated = await updateScheduledAction({
      id: created.id,
      trigger_schedule_id: triggerSchedule.id,
    });

    return NextResponse.json(
      {
        status: "success",
        tasks: [updated],
      },
      {
        status: 200,
        headers: getCorsHeaders(),
      },
    );
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Internal server error",
      },
      {
        status: 500,
        headers: getCorsHeaders(),
      },
    );
  }
}
