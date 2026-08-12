---
slug: api-keys-oauth-device-flow-saas-agents
title: API Keys vs OAuth vs Device Flow for SaaS Agents and CLI Tools
publishedDate: 2026-08-12
author: admin
excerpt: >-
  Choose a secure authentication flow for SaaS agents, scripts, and CLIs by comparing API keys, OAuth, browser sessions, and device authorization.
tags:
  - API Keys
  - OAuth
  - Device Flow
  - CLI Auth
  - SaaS Security
featured: false
---

A machine client should not impersonate a browser. Copying session cookies into a script makes revocation, scope, expiry, and audit behavior ambiguous. A production SaaS needs explicit authentication choices for unattended services, local command-line tools, integrations, and interactive users.

## Use browser sessions for browser users

Cookie sessions are appropriate when a person is actively using the web application. The browser handles secure, HTTP-only cookies and CSRF protections; the server can rotate or revoke the session through the normal authentication system.

They are a poor automation credential. A cookie may carry broader access than a script needs, and browser login changes can break a hidden automation dependency without a clear error contract.

## Use API keys for controlled automation

API keys fit server-to-server integrations, CI jobs, and scripts whose operator can store a secret securely. A useful implementation needs more than a random string:

- show the plaintext key only once;
- store only a cryptographic digest;
- attach a stable owner and key ID;
- support expiry and revocation;
- record last-used metadata without storing request secrets;
- enforce the same authorization checks as browser requests;
- expose a versioned API with predictable error responses.

UllrAI SaaS Starter prefixes its machine credentials so accidental leakage is easier to recognize. The API boundary accepts the key, resolves its owner, and continues through shared permission logic rather than granting a parallel set of powers.

API keys are not ideal when a local user should approve access without copying a long-lived secret into a terminal.

## Use a device flow for local CLI authorization

A browser-approved device flow separates the terminal from the user's primary credential:

1. The CLI requests a short-lived device code.
2. The user opens a verification URL in a trusted browser.
3. The browser session approves the named device and requested access.
4. The CLI polls with the device code until approval or expiry.
5. The server issues a bounded access token and a rotating refresh token.

The device code is not a bearer token for the user's account. It is short-lived, single-purpose, and useless after approval, denial, or expiry. Polling is rate-limited, and refresh-token rotation invalidates the previous token so a replay can be detected.

The dashboard should show authorized CLI sessions with device labels, creation time, last use, and a revoke action. That makes local automation visible to the account owner.

## Use OAuth for third-party delegated access

OAuth is the right choice when an external product needs delegated access without receiving the user's password or a manually copied platform key. It adds real operational obligations: client registration, redirect validation, state and PKCE handling, scopes, consent, token rotation, and revocation.

Do not add OAuth merely because “integrations” might exist later. API keys and a first-party device flow cover many initial machine workflows with a smaller attack surface. Add delegated OAuth when a real third-party client and scope model require it.

## Compare the choices

| Client                  | Recommended credential | Why                                                              |
| ----------------------- | ---------------------- | ---------------------------------------------------------------- |
| Interactive web app     | Browser session        | Secure cookie lifecycle and existing user consent                |
| Personal script or CI   | API key                | Simple secret storage, direct revocation, predictable API use    |
| First-party local CLI   | Device flow            | Browser approval without copying a permanent key                 |
| Third-party integration | OAuth                  | Delegated scopes and consent without sharing primary credentials |

## Security invariants shared by every flow

Whichever flow you choose:

- never put credentials in URLs;
- never log bearer tokens or API keys;
- compare stored secret digests safely;
- rate-limit creation, polling, and authentication failures;
- validate callback and redirect origins;
- make revocation effective immediately;
- keep authorization separate from authentication;
- test expired, replayed, revoked, and wrong-owner credentials.

The most important architecture choice is not the token format. It is ensuring that every credential resolves to the same permission model and that each credential can be identified and revoked independently.

Explore the implementation in the [agent-friendly SaaS guide](/blog/agent-friendly-saas-template), then place it in context with the [Next.js 16 SaaS starter architecture](/blog/nextjs-16-saas-starter-architecture) and the [source repository](https://github.com/UllrAI/SaaS-Starter).
