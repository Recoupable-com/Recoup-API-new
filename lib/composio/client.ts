import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";
import { getComposioApiKey } from "./getComposioApiKey";

const apiKey = getComposioApiKey();

export const getComposioClient = (): Composio<VercelProvider> => {
  return new Composio<VercelProvider>({
    apiKey,
    provider: new VercelProvider(),
  });
};
