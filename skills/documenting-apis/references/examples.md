# Request and response examples

Use OpenAPI 3.1 `examples` (named, plural) under each media type. Values must match what the code accepts and the encoder sends.

## Request body

- At least one example named `basic` with every required field.
- When there are optional fields, add `full` with every field set.
- Lists: include `paginate` (`page`, `perPage`) and, when sortable, `sort` (`column`, `order`).

## Responses

Typed application errors use **HTTP 200** with `ok: false`, so success and errors share the `200` response. Put all of them in `200.content.application/json.examples`:

- `success`: a realistic result.
- One example per error the call can return, named after the error in lowerCamelCase (`itemNotFound`, `itemAlreadyExists`, `unauthorized`, `forbidden`).
- Include middleware errors for the route's group: signed-in routes add `missingAuthorization`, `invalidAuthorization`, `unauthorized`; verified routes also add the verification error.

Validation errors use **HTTP 400** with code `VALIDATION`. Give one example whose `items` are real messages from that function's `Valid()`.

For functions with no result, run or read the encoder to see whether success is `{"ok":true}` or `{"ok":true,"result":null}`, and show exactly that.

Lists: the success example includes `paginate` with `page`, `perPage`, `next`, and `totalCount` only if the endpoint calls `CountTotal`.

## Example

```yaml
/item.create:
  post:
    tags: [Item, M02_2026_11_16]
    summary: Create item
    description: Creates an item owned by the signed-in account. Requires `item.create`.
    x-changes:
      - { release: M01_2026_10_10, change: created }
      - { release: M02_2026_11_16, change: "Added optional `note`." }
    requestBody:
      required: true
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ItemCreateParams' }
          examples:
            basic: { value: { name: Sword } }
            full: { value: { name: Sword, note: Starter weapon } }
    responses:
      '200':
        description: Success, or a typed error with `ok` false.
        content:
          application/json:
            schema:
              oneOf:
                - $ref: '#/components/schemas/ItemCreateOK'
                - $ref: '#/components/schemas/Error'
            examples:
              success:
                value: { ok: true, result: { id: 0f3c9a52-6b1e-4d8f-9a7c-2e5b1d4c8f10 } }
              itemAlreadyExists:
                value: { ok: false, error: { code: ITEM_ALREADY_EXISTS, message: "item: already exists" } }
              forbidden:
                value: { ok: false, error: { code: FORBIDDEN, message: "iam: forbidden" } }
              unauthorized:
                value: { ok: false, error: { code: UNAUTHORIZED, message: unauthorized } }
      '400':
        $ref: '#/components/responses/Validation'
```

The error `code`/`message` values above are illustrative; copy the real ones from the code and `rest.go`.
