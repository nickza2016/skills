# Writing summaries and descriptions

The reader is a frontend developer deciding whether and when to call this endpoint.

## `summary`

Verb + object, under about six words: `Create item`, `List sub-accounts`, `Sign out`.

## `description`

Answer only these, in one to three sentences:

1. **What it does** for the caller.
2. **When to use it** (which screen or step), if not obvious.
3. **Who can call it**: the access level and permission, e.g. "Requires `item.create`."
4. **Effects the caller must handle**, e.g. "The current token stops working after this call." or "Suspended items are excluded."

Do not write:

- Implementation details: tables, SQL, pgstmt, caching, which package handles it.
- Things the endpoint does *not* do ("Does not query the database").
- Field-by-field restatement of the schema; put field meaning in the schema's `description` instead.
- Generic filler ("This endpoint is used to...", "Returns a response").

| Bad | Good |
|---|---|
| `Returns the text ok. Does not query the database.` | `Health check for load balancers. Returns ok while the service is running.` |
| `Inserts a row into operator_accounts using pgstmt and writes an audit log.` | `Creates a sub-account under the signed-in operator. Requires `account.create`.` |
| `This endpoint is used to get the list of items. It returns items and paginate.` | `Lists items for the item management table, newest first. Supports search by name and column sorting.` |

## Schema field descriptions

Add a `description` only when the name and type are not enough: units (`amount` in satang), formats, allowed values, nullability meaning (`suspendedAt` is `null` while active), or how a filter matches (`search` matches name, case-insensitive).
