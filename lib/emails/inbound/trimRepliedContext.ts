/**
 * Trims replied/forwarded context from email text.
 * Removes common email reply markers and quoted content.
 *
 * @param emailText - The email text that may contain replied context
 * @returns The email text with replied context removed
 */
export function trimRepliedContext(emailText: string): string {
  if (!emailText) {
    return emailText;
  }

  const lines = emailText.split("\n");
  const result: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const lowerLine = line.toLowerCase();

    // Stop at common reply markers
    if (
      (lowerLine.includes("on") &&
        (lowerLine.includes("wrote:") ||
          lowerLine.includes("écrit :") ||
          lowerLine.includes("escribió:") ||
          lowerLine.includes("schrieb:"))) ||
      lowerLine.includes("-----original message-----") ||
      lowerLine.includes("begin forwarded message") ||
      lowerLine.startsWith("from:") ||
      lowerLine.startsWith("sent:")
    ) {
      break;
    }

    // Stop at quoted lines (they indicate reply content)
    if (trimmed.startsWith(">")) {
      break;
    }

    result.push(line);
  }

  return result.join("\n").trim();
}
