# Plausible installation verification

Date: 2026-11-15. Checked in the user's Tabbit browser.

The onboarding page was waiting for the first pageview. The configured site-specific script was already present in the production page, loaded successfully with HTTP 200, and initialized correctly. Opening the public homepage produced a browser-generated request to the configured statistics service's `/api/event`, which returned HTTP 202.

The verification tab automatically moved from the provisioning URL to `https://stats.cadcraft.org/southparkmaker.com`. The dashboard showed one current visitor, one visit and one pageview, with `/` in Top pages. These are the verification visit, not evidence of a new customer. No synthetic event was posted directly to the collection API.

The saved Plausible script configuration was read back and matched the installed script. No source or analytics-configuration change was needed to complete this verification.

The administrator's saved App Description still contained an old no-cost claim from the previous copy revision. That description was updated through the existing settings UI, the API reported success, and a subsequent authenticated read confirmed the old wording was removed. Other settings were preserved.
