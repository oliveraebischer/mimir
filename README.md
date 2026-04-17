# Mimir

Universal AI Memory Layer with Persona support. Users own their context; AI providers (Claude, Gemini, GPT) connect via MCP as clients.

## What it does

- **Personas** are named context slices per user (e.g. "work", "personal").
- **Memories** are structured key/value entries scoped to a persona.
- **Providers** are AI clients with scoped access controlled by **Access Rules**.

## Setup

### 1. Supabase

1. Create a new [Supabase](https://supabase.com) project.
2. Run `supabase/schema.sql` in the SQL editor to create the schema.
3. Copy your project URL and service role key.

### 2. Environment

```bash
cp .env.example .env
# Fill in SUPABASE_URL and SUPABASE_SERVICE_KEY
```

### 3. Install & build

```bash
npm install
npm run build
```

### 4. Register a provider

Insert a row into `providers` with a SHA-256 hash of your chosen API key:

```sql
insert into providers (name, api_key_hash)
values ('claude', encode(sha256('your-secret-key'::bytea), 'hex'));
```

Then grant it access to a persona:

```sql
insert into access_rules (provider_id, persona_id, permission)
values ('<provider-uuid>', '<persona-uuid>', 'read_write');
```

## Adding to Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "mimir": {
      "command": "node",
      "args": ["/absolute/path/to/mimir/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_KEY": "your-service-role-key",
        "MIMIR_API_KEY": "your-secret-key"
      }
    }
  }
}
```

## MCP Tools

| Tool | Description | Permission required |
|------|-------------|---------------------|
| `list_personas` | List accessible personas | read |
| `read_memories` | Read memories for a persona | read |
| `write_memory` | Create or update a memory entry | read_write |
| `delete_memory` | Delete a memory entry by key | read_write |
