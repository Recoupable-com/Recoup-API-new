import { NextResponse } from "next/server";
import type { ResendEmailReceivedEvent } from "@/lib/emails/validateInboundEmailEvent";
import { sendEmailWithResend } from "@/lib/emails/sendEmail";
import selectAccountEmails from "@/lib/supabase/account_emails/selectAccountEmails";
import { getMessages } from "@/lib/messages/getMessages";
import getGeneralAgent from "@/lib/agents/generalAgent/getGeneralAgent";
import { getEmailContent } from "@/lib/emails/inbound/getEmailContent";
import { getFromWithName } from "@/lib/emails/inbound/getFromWithName";
import { getEmailRoomId } from "@/lib/emails/inbound/getEmailRoomId";
import { getEmailRoomMessages } from "@/lib/emails/inbound/getEmailRoomMessages";
import { ChatRequestBody } from "@/lib/chat/validateChatRequest";
import insertMemoryEmail from "@/lib/supabase/memory_emails/insertMemoryEmail";
import insertMemories from "@/lib/supabase/memories/insertMemories";
import filterMessageContentForMemories from "@/lib/messages/filterMessageContentForMemories";
import { createNewRoom } from "@/lib/chat/createNewRoom";
import { generateUUID } from "@/lib/uuid/generateUUID";

/**
 * Responds to an inbound email by sending a hard-coded reply in the same thread.
 * Builds the reply payload and sends it via Resend.
 *
 * @param event - The validated Resend email received event.
 * @returns A NextResponse with the Resend API response or an error response.
 */
export async function respondToInboundEmail(
  event: ResendEmailReceivedEvent,
): Promise<NextResponse> {
  try {
    const original = event.data;
    const subject = original.subject ? `Re: ${original.subject}` : "Re: Your email";
    const messageId = original.message_id;
    const emailId = original.email_id;
    const to = original.from;
    const toArray = [to];
    const from = getFromWithName(original.to);
    const accountEmails = await selectAccountEmails({ emails: [to] });
    if (accountEmails.length === 0) throw new Error("Account not found");
    const accountId = accountEmails[0].account_id;

    const emailContent = await getEmailContent(emailId);
    const emailText = emailContent.text || emailContent.html || "";

    const roomId = await getEmailRoomId(emailContent);

    // Ensure room exists - create if it doesn't exist
    // Generate a roomId if one wasn't found from email references
    const finalRoomId = roomId || generateUUID();
    const promptMessage = getMessages(emailText)[0];
    if (!roomId) {
      await createNewRoom({
        accountId,
        roomId: finalRoomId,
        artistId: undefined,
        lastMessage: promptMessage,
      });
    }

    // Insert the prompt message with emailId as the id to prevent duplicate processing
    // If this email was already processed, the insert will fail with a unique constraint violation
    try {
      await insertMemories({
        id: emailId,
        room_id: finalRoomId,
        content: filterMessageContentForMemories(promptMessage),
      });
    } catch (error: unknown) {
      // If duplicate (unique constraint violation), return early to prevent duplicate response
      if (error && typeof error === "object" && "code" in error && error.code === "23505") {
        console.log(`[respondToInboundEmail] Email ${emailId} already processed, skipping`);
        return NextResponse.json({ message: "Email already processed" }, { status: 200 });
      }
      throw error;
    }

    const chatRequestBody: ChatRequestBody = {
      accountId,
      messages: getMessages(emailText),
      roomId: finalRoomId,
    };
    const decision = await getGeneralAgent(chatRequestBody);
    const agent = decision.agent;

    const messages = await getEmailRoomMessages(finalRoomId, emailText);

    const chatResponse = await agent.generate({
      messages,
    });
    const payload = {
      from,
      to: toArray,
      subject,
      html: chatResponse.text,
      headers: {
        "In-Reply-To": messageId,
      },
    };

    const result = await sendEmailWithResend(payload);

    // Save the assistant response message
    const assistantMessage = getMessages(chatResponse.text, "assistant")[0];
    await insertMemories({
      id: assistantMessage.id,
      room_id: finalRoomId,
      content: filterMessageContentForMemories(assistantMessage),
    });

    // Link the inbound email with the prompt message memory (using emailId as the memory id)
    // The user message was already inserted with emailId as the id, so we use that directly
    await insertMemoryEmail({
      email_id: emailId,
      memory: emailId,
      message_id: messageId,
      created_at: original.created_at,
    });

    if (result instanceof NextResponse) {
      return result;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[respondToInboundEmail] Failed to respond to inbound email", error);
    return NextResponse.json({ error: "Internal error handling inbound email" }, { status: 500 });
  }
}
