import { NextRequest, NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/networking/getCorsHeaders";
import { deleteScheduledAction } from "@/lib/supabase/scheduled_actions/deleteScheduledAction";
import { selectScheduledActions } from "@/lib/supabase/scheduled_actions/selectScheduledActions";
import { deleteSchedule } from "@/lib/trigger/deleteSchedule";
import { validateDeleteTaskBody } from "@/lib/tasks/validateDeleteTaskBody";

/**
 * Deletes an existing task (scheduled action) by its ID
 * Also deletes the corresponding Trigger.dev schedule if it exists
 * Returns only the status of the delete operation
 *
 * Body parameters:
 * - id (required): The task ID to delete
 *
 * @param request - The request object containing the task ID in the body.
 * @returns A NextResponse with the delete operation status.
 */
export async function deleteTaskHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const validatedBody = validateDeleteTaskBody(body);
    if (validatedBody instanceof NextResponse) {
      return validatedBody;
    }

    const { id } = validatedBody;

    // Get scheduled action to check for trigger_schedule_id
    const scheduledActions = await selectScheduledActions({ id });
    const scheduledAction = scheduledActions[0];

    if (!scheduledAction) {
      return NextResponse.json(
        {
          status: "error",
          error: "Task not found",
        },
        {
          status: 404,
          headers: getCorsHeaders(),
        },
      );
    }

    // Delete from Trigger.dev if schedule exists
    if (scheduledAction.trigger_schedule_id) {
      await deleteSchedule(scheduledAction.trigger_schedule_id);
    }

    // Delete from database
    await deleteScheduledAction(id);

    return NextResponse.json(
      {
        status: "success",
      },
      {
        status: 200,
        headers: getCorsHeaders(),
      },
    );
  } catch (error) {
    console.error("Error deleting task:", error);
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
