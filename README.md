# Access KYC onboarding reference

Access is a web application for guided identity verification. Applicants can create an account, verify contact details, capture an identity document and selfie, resume an application, submit it for review, and check its status. The interface can show partner context while keeping the core journey partner neutral.

This repository is a working integration with the Neuro Agent and Legal services. It is useful as an implementation example, but it is **not a standalone KYC backend**: account creation, private storage, verification, Legal submission, and identity transfer require a compatible service environment and credentials. Do not send real applicant data to a development or test tenant.

## Contents

- [Requirements](#requirements)
- [Run locally](#run-locally)
- [Configuration](#configuration)
- [How the journey works](#how-the-journey-works)
- [Project map](#project-map)
- [Checks](#checks)
- [Deployment](#deployment)
- [Security and reuse](#security-and-reuse)
- [Contributing](CONTRIBUTING.md)
- [Security policy](SECURITY.md)

## Requirements

- Node.js 20 or newer and npm. The pinned Next.js version also supports Node.js 18.18 or newer.
- Access to the Agent API package referenced in `package.json` and a compatible Agent/Neuron environment.
- Agent account-creation credentials for the server route. A complete submission also needs the corresponding Legal service configured in that environment.
- A browser with camera access for document and selfie capture. Use `localhost` or HTTPS so the browser can grant camera permission.

## Run locally

```bash
git clone https://github.com/Trust-Anchor-Group/kyc-onboarding-reference.git
cd kyc-onboarding-reference
npm ci
cp .env.example .env.local
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env.local` in place of `cp`. Fill in `.env.local` with values from your own service environment before testing account creation or submission. Open <http://localhost:3000> for the landing page; `/onboarding`, `/login`, and `/dashboard` are the other main routes.

The application can render without working Agent credentials, but account creation and the complete KYC journey cannot succeed without the external services. Local development must use a non-production tenant and synthetic identity data.

### Legal submission from localhost

The current Legal integration validates the browser's `Referer` and expects an origin it can resolve. For a local end-to-end Legal test, start the app on the default HTTP port and open <http://localhost>:

```bash
npm run dev -- --port 80
```

This may require permission to bind port 80 on your machine. Changing `NEXT_PUBLIC_AGENT_API_URL` does not change the browser's `Referer`; it selects the remote Agent host.

## Configuration

Copy `.env.example` to `.env.local`. Next.js loads `.env.local` automatically, and `.gitignore` excludes it. Restart the development server after changing environment values.

| Variable | Used by | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_AGENT_API_URL` | Browser and server | Full HTTPS URL of the Agent/Neuron host. The browser also loads its `Events.js` script. |
| `NEXT_PUBLIC_AGENT_API_URI` | Browser | Hostname used in the `NEURON` meta tag and Agent host selection. |
| `AGENT_API_URL` | Server | Optional Agent URL for the server routes; defaults to `NEXT_PUBLIC_AGENT_API_URL`. |
| `AGENT_API_KEY` | Server | API key for `POST /api/agent/account/create`. |
| `AGENT_SECRET` | Server | Signing secret for `POST /api/agent/account/create`. |
| `NEXT_PUBLIC_ACCESS_PARTNER` | Browser | Optional partner name displayed in the entry experience. Omit for a generic entry. |

`NEXT_PUBLIC_*` values are embedded in browser code and must never contain secrets. Keep `AGENT_API_KEY` and `AGENT_SECRET` server side. Configure deployment credentials in your hosting provider's secret store; never add them to the repository.

## How the journey works

1. The visitor starts at `/` or resumes at `/login`.
2. The onboarding flow gathers identity and address details, verifies contact information, and captures evidence.
3. Account creation uses a server route that signs the request to Agent. The browser uses the Agent client for authenticated operations.
4. After account verification, `state.json` in private Agent Content becomes the canonical KYC application state. It contains an allowlisted set of form fields and document descriptors. Document bytes live in separate private Content resources. A zero-tag Agent Vault record is used for discovery, not as a second copy of the form.
5. Submission creates the Legal identity and attachments in the configured service. The dashboard reads the resulting status and supports the approved identity transfer flow.

The pre-account portion is ephemeral. New journeys do not create Redis sessions or store a KYC form draft in application-managed browser storage. Theme preferences and a minimal account-recovery hint are separate from the KYC application state. The storage and submission contracts are implemented in `src/app/lib/agentKycPersistence.mjs`, `agentKycDocuments.mjs`, and `legalApplyPreflight.mjs`.

## Project map

| Path | What it contains |
| --- | --- |
| `src/app/page.js` | Landing page and generic/partner entry. |
| `src/app/onboarding/` | Guided KYC steps and capture workspaces. |
| `src/app/login/`, `src/app/dashboard/` | Resume and application status views. |
| `src/app/api/agent/` | Server account-creation and private Content proxy routes. |
| `src/app/context/`, `src/app/lib/` | Agent integration, journey state, persistence, and validation. |
| `tests/agent-kyc-persistence/` | Node tests for persistence, recovery, submission, and journey logic. |
| `public/` | Assets loaded by the application; these are separate from applicant uploads. |

Partner context can be supplied with `NEXT_PUBLIC_ACCESS_PARTNER`. The `__entry` and `__ux` query parameters in the code are development-only visual/acceptance fixtures and are disabled in production.

## Checks

```bash
npm run lint
npm run test:agent-persistence
npm run build
npm audit --audit-level=low
```

The automated tests cover local logic and use synthetic values in code. No identity photos or screenshot artifacts are committed for the test suite. These checks do not certify the external Agent or Legal services, a production deployment, or regulatory compliance.

`package.json` overrides the PostCSS version bundled by Next.js 15.5.26 to address an upstream dependency advisory. Recheck the override when upgrading Next.js and remove it once the upstream package includes the fix.

## Deployment

Deploy to a host that supports Next.js server routes and provides the environment variables above. The included GitHub Actions workflow runs dependency, lint, test, and build checks on pushes and pull requests to `main`; it does not deploy the app. Configure the hosting provider and its credentials for your own environment. A build passing locally does not confirm that the connected Agent and Legal services accept the deployed origin.

## Security and reuse

- Never commit `.env.local`, credentials, real identity documents, applicant data, or production screenshots. Use synthetic fixtures in tests and examples.
- Browser-exposed `NEXT_PUBLIC_*` values and files under `public/` are available to visitors. Treat the public repository and its full Git history as readable by anyone if you publish it.
- Review and rotate any credentials that may have appeared in previous commits before changing repository visibility. Check that you have redistribution rights for the code, fonts, logos, and other brand assets.
- This repository currently has no license file. Public visibility alone does not grant reuse rights. The owners should add an approved license before inviting outside reuse.

The `public/` directory includes Access branding, app store badges, and a font used by this app. Before adapting the example, replace these with images and brand assets you own or are licensed to use. Update this guidance after the team reviews the project license and asset rights.

For changes, open a focused pull request with the relevant test results and a description of any effect on application state, external service calls, or applicant data handling.
