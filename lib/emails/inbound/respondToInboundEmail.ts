import { NextResponse } from "next/server";
import type { ResendEmailReceivedEvent } from "@/lib/emails/validateInboundEmailEvent";
import { sendEmailWithResend } from "@/lib/emails/sendEmail";
import selectAccountEmails from "@/lib/supabase/account_emails/selectAccountEmails";
import { getMessages } from "@/lib/messages/getMessages";
import getGeneralAgent from "@/lib/agents/generalAgent/getGeneralAgent";
import { getResendClient } from "@/lib/emails/client";

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
    const from = original.from;
    const toArray = [from];

    // Fetch the email content from Resend API
    const resend = getResendClient();
    const { data: emailContent } = await resend.emails.receiving.get(original.email_id);

    if (!emailContent) {
      throw new Error("Failed to fetch email content from Resend");
    }

    // Extract text or HTML content, preferring text for cleaner processing
    const emailText = emailContent.text || emailContent.html || "";

    const accountEmails = await selectAccountEmails({ emails: [from] });
    if (accountEmails.length === 0) throw new Error("Account not found");
    const accountId = accountEmails[0].account_id;

    // Pass the email content to the agent
    const decision = await getGeneralAgent({ accountId, messages: getMessages(emailText) });
    const agent = decision.agent;
    const chatResponse = await agent.generate({
      prompt: emailText,
    });
    const payload = {
      from: "hi@recoupable.com",
      to: toArray,
      subject,
      html: `<p>Thanks for your email!</p><p>account_id: ${accountId}</p><p>${chatResponse.text}</p>`,
      headers: {
        "In-Reply-To": messageId,
      },
    };

    const result = await sendEmailWithResend(payload);

    if (result instanceof NextResponse) {
      return result;
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("[respondToInboundEmail] Failed to respond to inbound email", error);
    return NextResponse.json({ error: "Internal error handling inbound email" }, { status: 500 });
  }
}
