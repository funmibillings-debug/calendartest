# CSM Hub — Claude Code Instructions

## Branch Workflow (Required)

**Never commit directly to `main`.** Always start work on a feature branch.

Before making any changes:
```bash
git checkout main && git pull origin main
git checkout -b <type>/<short-description>
# examples:
#   feature/slack-notifications
#   fix/coverage-banner-missing
#   chore/update-env-example
```

When the work is done:
```bash
git push -u origin <branch-name>
gh pr create
```

Branch naming:
- `feature/` — new functionality
- `fix/` — bug fixes
- `chore/` — config, deps, docs, refactors with no behaviour change

## Project Overview

Internal Next.js 14 dashboard for the CodeRabbit Enterprise CSM team. Shows all upcoming customer calls, supports coverage coordination, new-hire shadowing, and gives the VP capacity visibility.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS v3 · Radix UI · NextAuth (Google OAuth) · Google Apps Script (calendar feed) · Salesforce REST API · Slack Web API · Upstash Redis · Resend

## Key Architecture Notes

- **Calendar data** comes from a Google Apps Script web app (`APPS_SCRIPT_URL`), not the googleapis library. The script reads the Customer Success shared calendar + Funmi's primary calendar. To add more CSMs, add their calendar ID to `CALENDAR_IDS` in the deployed script.
- **shadcn/ui v4 is incompatible** with Tailwind v3. All `components/ui/` files use Radix UI + CVA directly — do not run `npx shadcn add` or it will break the build.
- **All API routes** must have `export const dynamic = 'force-dynamic'` to prevent static evaluation at build time.
- **Redis** is initialized lazily via a Proxy — do not call `redis.*` at module load time, only inside request handlers.
- **Resend** is initialized lazily via `getResend()` — same reason.

## Team Emails

| Name | Email | Role |
|---|---|---|
| Funmi Billings | funmi@coderabbit.ai | App owner, Enterprise CSM |
| Daniel | daniel@coderabbit.ai | VP CS |
| Josh Brown | josh@coderabbit.ai | Enterprise CSM |
| Darren Molloy | darren@coderabbit.ai | Enterprise CSM |
| Matt Parker | matt.parker@coderabbit.ai | Enterprise CSM |
| Mathias Wetzel | mathias@coderabbit.ai | Enterprise CSM |
| Raf Ayala | rafael@coderabbit.ai | Enterprise CSM |
| Brett Goodman | brett@coderabbit.ai | Enterprise CSM |

## Environment Variables

See `.env.local.example` for all required vars. Key ones:

| Var | Purpose |
|---|---|
| `APPS_SCRIPT_URL` | Google Apps Script web app URL (calendar feed) |
| `APPS_SCRIPT_SECRET` | Secret token checked by the Apps Script |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | NextAuth Google OAuth |
| `NEXTAUTH_SECRET` | NextAuth session signing key |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Caching + coverage state |
| `SLACK_BOT_TOKEN` | Slack DM notifications |
| `RESEND_API_KEY` | Email (weekly digest + coverage emails) |
| `SALESFORCE_*` | Salesforce REST API for customer enrichment |

## Setup Still Needed (Phase 2)

- Google OAuth client (Client ID + Secret) — blocks login; needs GCP access
- Upstash Redis instance
- Slack app + bot token
- Resend domain verification
- Salesforce connected app
