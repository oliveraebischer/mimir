import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { validateApiKey } from "./auth.js";
import {
  listPersonas,
  listPersonasSchema,
  readMemories,
  readMemoriesSchema,
  writeMemory,
  writeMemorySchema,
  deleteMemory,
  deleteMemorySchema,
} from "./tools.js";

const TOOL_DEFINITIONS = [
  {
    name: "list_personas",
    description: "List all personas this provider has access to.",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "read_memories",
    description: "Read memories for a persona. Optionally filter by key.",
    inputSchema: {
      type: "object" as const,
      properties: {
        persona_id: { type: "string", description: "UUID of the persona" },
        key: { type: "string", description: "Filter by exact key (optional)" },
      },
      required: ["persona_id"],
    },
  },
  {
    name: "write_memory",
    description:
      "Create or update a memory entry for a persona. Requires read_write permission.",
    inputSchema: {
      type: "object" as const,
      properties: {
        persona_id: { type: "string", description: "UUID of the persona" },
        key: { type: "string", description: "Memory key" },
        value: { type: "string", description: "Memory value" },
        source: { type: "string", description: "Origin of this memory (optional)" },
        confidence: {
          type: "number",
          minimum: 0,
          maximum: 1,
          description: "Confidence score 0-1 (optional)",
        },
        notes: { type: "string", description: "Additional notes (optional)" },
      },
      required: ["persona_id", "key", "value"],
    },
  },
  {
    name: "delete_memory",
    description:
      "Delete a memory entry by key. Requires read_write permission.",
    inputSchema: {
      type: "object" as const,
      properties: {
        persona_id: { type: "string", description: "UUID of the persona" },
        key: { type: "string", description: "Memory key to delete" },
      },
      required: ["persona_id", "key"],
    },
  },
];

export async function startServer(): Promise<void> {
  const server = new Server(
    { name: "mimir", version: "0.1.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOL_DEFINITIONS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const apiKey = process.env.MIMIR_API_KEY;
    if (!apiKey) {
      throw new Error("MIMIR_API_KEY environment variable not set");
    }

    const providerId = await validateApiKey(apiKey);
    const args = (request.params.arguments ?? {}) as Record<string, unknown>;

    let result: unknown;

    switch (request.params.name) {
      case "list_personas": {
        const input = listPersonasSchema.parse(args);
        result = await listPersonas(providerId, input);
        break;
      }
      case "read_memories": {
        const input = readMemoriesSchema.parse(args);
        result = await readMemories(providerId, input);
        break;
      }
      case "write_memory": {
        const input = writeMemorySchema.parse(args);
        result = await writeMemory(providerId, input);
        break;
      }
      case "delete_memory": {
        const input = deleteMemorySchema.parse(args);
        result = await deleteMemory(providerId, input);
        break;
      }
      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
