import { createHash } from "crypto";
import { db } from "./db.js";

export async function validateApiKey(apiKey: string): Promise<string> {
  const hash = createHash("sha256").update(apiKey).digest("hex");

  const { data, error } = await db
    .from("providers")
    .select("id")
    .eq("api_key_hash", hash)
    .single();

  if (error || !data) {
    throw new Error("Invalid API key");
  }

  return data.id as string;
}
