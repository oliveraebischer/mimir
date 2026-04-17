# Mimir

Universal AI Memory Layer with Persona support.
Users own their context. AI providers (Claude, Gemini, GPT) connect via MCP as clients.

## Concept

- **Persona**: a named context slice per user (e.g. "work", "personal", "investor")
- **Memory**: a structured entry belonging to a Persona
- **Provider**: an AI client with scoped read/write access to specific Personas
- **Access Rule**: defines which Provider can access which Persona, and with what permissions

## Stack

- Runtime: Node.js with TypeScript
- DB: Supabase (PostgreSQL, hosted)
- Protocol: MCP (Model Context Protocol) via @modelcontextprotocol/sdk
- Deploy target: Railway (later)

## Memory entry structure

```json
