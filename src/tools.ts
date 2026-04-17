import { z } from "zod";
import { db } from "./db.js";

export type ToolHandler<TInput> = (
  providerId: string,
  input: TInput
) => Promise<unknown>;

// ── list_personas ──────────────────────────────────────────────────────────

export const listPersonasSchema = z.object({});

export const listPersonas: ToolHandler<z.infer<typeof listPersonasSchema>> =
  async (providerId) => {
    const { data, error } = await db
      .from("access_rules")
      .select("persona_id, permission, personas(id, name, description)")
      .eq("provider_id", providerId);

    if (error) throw new Error(error.message);

    type PersonaRow = { name: string; description: string | null } | null;
    return (data ?? []).map((row) => {
      const persona = row.personas as unknown as PersonaRow;
      return {
        id: row.persona_id,
        name: persona?.name,
        description: persona?.description,
        permission: row.permission,
      };
    });
  };

// ── read_memories ──────────────────────────────────────────────────────────

export const readMemoriesSchema = z.object({
  persona_id: z.string().uuid(),
  key: z.string().optional(),
});

export const readMemories: ToolHandler<z.infer<typeof readMemoriesSchema>> =
  async (providerId, { persona_id, key }) => {
    await assertAccess(providerId, persona_id, "read");

    let query = db
      .from("memories")
      .select("id, key, value, source, confidence, notes, created_at, updated_at")
      .eq("persona_id", persona_id);

    if (key) query = query.eq("key", key);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return data ?? [];
  };

// ── write_memory ───────────────────────────────────────────────────────────

export const writeMemorySchema = z.object({
  persona_id: z.string().uuid(),
  key: z.string().min(1),
  value: z.string().min(1),
  source: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  notes: z.string().optional(),
});

export const writeMemory: ToolHandler<z.infer<typeof writeMemorySchema>> =
  async (providerId, { persona_id, key, value, source, confidence, notes }) => {
    await assertAccess(providerId, persona_id, "read_write");

    const { data, error } = await db
      .from("memories")
      .upsert(
        { persona_id, key, value, source, confidence, notes },
        { onConflict: "persona_id,key" }
      )
      .select()
      .single();

    if (error) throw new Error(error.message);

    return data;
  };

// ── delete_memory ──────────────────────────────────────────────────────────

export const deleteMemorySchema = z.object({
  persona_id: z.string().uuid(),
  key: z.string().min(1),
});

export const deleteMemory: ToolHandler<z.infer<typeof deleteMemorySchema>> =
  async (providerId, { persona_id, key }) => {
    await assertAccess(providerId, persona_id, "read_write");

    const { error, count } = await db
      .from("memories")
      .delete({ count: "exact" })
      .eq("persona_id", persona_id)
      .eq("key", key);

    if (error) throw new Error(error.message);

    return { deleted: count ?? 0 };
  };

// ── helpers ────────────────────────────────────────────────────────────────

async function assertAccess(
  providerId: string,
  personaId: string,
  required: "read" | "read_write"
): Promise<void> {
  const { data, error } = await db
    .from("access_rules")
    .select("permission")
    .eq("provider_id", providerId)
    .eq("persona_id", personaId)
    .single();

  if (error || !data) {
    throw new Error("Access denied: no rule found for this provider/persona");
  }

  if (required === "read_write" && data.permission !== "read_write") {
    throw new Error("Access denied: read-only access");
  }
}
