# Character generation API

The first version uses existing users, credits and `ai_task` rows. It adds no tables and leaves the shared D1 connection unchanged. API keys stay in encrypted administrator settings. No provider key is configured by this implementation and no paid inference call has been made during verification.

## Capabilities

`GET /api/characters/config` returns the standard `{code, message, data}` envelope with:

```json
{ "enabled": false, "photoEnabled": false, "costCredits": 10 }
```

Saving a **Fal** API key in Admin → Settings → AI enables text and photo generation. Saving a **Replicate** token enables text generation as a fallback when no Fal key is set. Gemini is not enabled because the current admin settings have no Gemini key field. A configured key indicates availability, not proof that its provider account has a valid billing balance.

Server-owned model catalog:

| Flow          | Provider       | Model                            |
| ------------- | -------------- | -------------------------------- |
| Text          | Fal, preferred | `fal-ai/flux-1/schnell`          |
| Photo         | Fal            | `fal-ai/flux/dev/image-to-image` |
| Text fallback | Replicate      | `black-forest-labs/flux-schnell` |

Model identifiers and accepted parameters were checked against [Fal text API](https://fal.ai/models/fal-ai/flux-1/schnell/api), [Fal image API](https://fal.ai/models/fal-ai/flux/dev/image-to-image/api), and [Replicate model reference](https://replicate.com/black-forest-labs/flux-schnell/api/api-reference). Fal supports base64 data URIs for reference photos, so photos require neither a public upload nor a server-side URL fetch. Photos are sent to the selected inference provider. Results use provider-hosted image URLs; the provider may expire these files, so users should download results.

## Generate

`POST /api/characters/generate` requires a signed-in session, same-origin `Origin`, and `application/json`. Body:

```ts
{
  prompt: string;                 // trimmed, 3–1500 characters
  aspectRatio?: '1:1' | '3:4';    // defaults to 1:1; text generation only
  image?: {
    data: string;                 // canonical base64 bytes, without data: prefix
    mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  };
}
```

A reference image is limited to 3 MiB. The server bounds the streamed request before parsing and checks raster signatures against the declared MIME. It rejects unknown fields, external image URLs, client-provided providers/models/prices and oversized prompts. Photo generation preserves the uploaded image dimensions; hide the aspect-ratio picker for that mode or crop on the client before encoding.

The server applies IP and account rate limits. It checks provider availability before creating or charging a task. Each generation costs **10 credits**, deducted atomically with the existing task creation flow. The user must have enough credits; this implementation does not auto-grant credits or bypass charging for administrators.

Response, normally HTTP 202:

```json
{
  "code": 0,
  "message": "ok",
  "data": { "taskId": "internal UUID", "status": "pending", "images": [] }
}
```

The returned ID is the internal task ID, not the provider queue ID. Errors use HTTP 400 (input), 401 (sign-in), 402 (credits), 403 (origin), 429 (rate limit), 502 (submission failure, refunded), or 503 (unavailable). Error envelopes contain a safe English message without upstream response bodies.

## Poll

`GET /api/characters/<taskId>` requires the owner’s session. Poll every 2–3 seconds; it returns:

```ts
{
  taskId: string;
  status: 'pending' | 'processing' | 'success' | 'failed' | 'canceled';
  images: string[]; // at most one HTTPS result URL; populated only on success
  error?: string;  // safe terminal failure description
}
```

Task completion happens when polled. A terminal task never regresses because a slower concurrent poll returns later. Failed/canceled tasks restore their original consumed credit record through `revoke()`, whose atomic claim makes repeated or concurrent refunds idempotent. Subsequent terminal reads repair an interrupted refund. A transient provider query error returns 503 without resubmitting or refunding a running job; Fal’s terminal model/validation result errors are marked failed and refunded. A submit that never stored an upstream receipt becomes failed after 30 minutes when revisited. No background runner or webhook is added in this first version.

The database stores the user’s prompt, aspect ratio, photo-presence flag, provider queue ID and output image URL. It does not store the reference photo, raw provider response, key or provider diagnostics.

## Validation

`node --import tsx --test tests/characters.test.ts`

The suite uses an isolated temporary SQLite database to exercise real atomic task/credit writes. It covers disabled-provider no-charge behavior, auth and origin refusal, input bounds and SSRF prevention, ownership, server-controlled charging, concurrent refunds and terminal-state races. It makes no paid provider requests.
