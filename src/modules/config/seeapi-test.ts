import type { TestResult } from './settings-test-specs';

/** Read-only credential check documented at https://www.seeapi.com/docs/authentication/. */
export async function testSeeAPI(
  configs: Record<string, string>
): Promise<TestResult> {
  const apiKey = (configs.seeapi_api_key || '').trim();
  if (!apiKey || apiKey.startsWith('••••••••')) {
    return { success: false, message: 'Missing config: seeapi_api_key' };
  }
  if (/\s/.test(apiKey)) {
    return {
      success: false,
      message:
        'Enter the complete SeeAPI API key without spaces or line breaks.',
    };
  }

  let endpoint: URL;
  try {
    const base =
      (configs.seeapi_base_url || '').trim() || 'https://api.seeapi.com';
    endpoint = new URL(base);
    if (
      endpoint.protocol !== 'https:' ||
      endpoint.username ||
      endpoint.password ||
      endpoint.search ||
      endpoint.hash
    ) {
      throw new Error('Invalid URL');
    }
    endpoint.pathname = `${endpoint.pathname.replace(/\/+$/, '')}/v1/credits`;
  } catch {
    return {
      success: false,
      message:
        'SeeAPI Base URL must be an HTTPS API root without credentials, a query string or a fragment.',
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      // Never forward a credential through an endpoint redirect.
      redirect: 'manual',
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      const messages: Record<number, string> = {
        401: 'SeeAPI rejected the API key. Check that the complete key is active.',
        403: 'SeeAPI denied access. Check the API key permissions.',
        429: 'SeeAPI rate limit reached. Try again later.',
      };
      return {
        success: false,
        message:
          messages[response.status] ||
          `SeeAPI request failed (HTTP ${response.status}).`,
      };
    }

    const data: unknown = await response.json().catch(() => null);
    if (
      !data ||
      typeof data !== 'object' ||
      Array.isArray(data) ||
      ('error' in data && data.error) ||
      ('success' in data && data.success === false)
    ) {
      return {
        success: false,
        message:
          'SeeAPI returned an unexpected response. Check the API root and key.',
      };
    }
    return {
      success: true,
      message:
        'SeeAPI authenticated successfully. Credit balance checked; no generation task was created.',
    };
  } catch {
    // Provider bodies and network errors may echo credentials; never return them.
    return {
      success: false,
      message:
        'Could not connect to SeeAPI. Check the API root, network connection and request timeout.',
    };
  }
}
