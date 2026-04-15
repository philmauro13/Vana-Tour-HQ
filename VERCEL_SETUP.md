# Vercel Deployment Setup Guide

## Status: Partially Complete — Manual Auth Required

The code is ready to deploy. The following steps require human action (auth token or browser).

---

## What Was Built

1. **/dashboard/route** — Complete routing page with timeline, stops, mileage visualization, connected to `tour_dates` Supabase table ✅
2. **/dashboard/edit-day** — Editable day sheet with inline time/event/type editing + save to `day_sheets` table ✅
3. **/dashboard/more** — Active tour banner + crew invite modal wired to `tour_invitations` table ✅
4. **/dashboard/crew** — Task board with add task modal + localStorage persistence ✅
5. **/dashboard/documents** — Document vault with upload to Supabase Storage (`tour-hq-docs` bucket) + DB record. Shows bucket setup warning if not created. ✅

---

## Storage Bucket Setup (Required for Document Vault)

Before uploading files, create the Supabase storage bucket:

1. Go to: https://supabase.com/dashboard → your project → **Storage**
2. Click **New Bucket**
3. Name: `tour-hq-docs` (exact, lowercase, no spaces)
4. Set: **Private** (NOT public)
5. Done — file uploads will work immediately

---

## Vercel Deploy Steps

### Step 1: Obtain Vercel Token

Vercel CLI requires an API token. No stored token was found on this machine.

**Option A — Browser (fastest):**
1. Go to https://vercel.com/account/tokens
2. Create a token named "Tour HQ"
3. Copy the token

**Option B — CLI non-interactive (requires token):**
```powershell
vercel login --token YOUR_TOKEN_HERE
```

### Step 2: Deploy via CLI

Once you have a Vercel token:

```powershell
cd C:\Users\philm\.openclaw\workspace\vana-tour-hq
vercel login --token YOUR_VERCEL_TOKEN
vercel --yes
```

Or with environment variables:

```powershell
$VERCEL_TOKEN = "your-token"
vercel env add NEXT_PUBLIC_SUPABASE_URL
# (paste: https://edxiwaduxwaitxlahkzl.supabase.co)
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# (paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkeGl3YWR1eHdhaXR4bGFoa3psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MzU5NDAsImV4cCI6MjA5MTExMTk0MH0.8qsJpjcw0e56LOzB0bPSwlWe5AX4_nGc_tjmAKbTYtE)
vercel --yes
```

---

## GitHub Repo Setup

No GitHub credentials found on this machine. To create a repo:

**Option A — Manual:**
1. Go to https://github.com/new
2. Name: `vana-tour-hq`, Private, no README
3. Then push:
```powershell
cd C:\Users\philm\.openclaw\workspace\vana-tour-hq
git init
git add .
git commit -m "Tour HQ Next.js app"
git remote add origin https://github.com/philmauro13/vana-tour-hq.git
git branch -M master
git push -u origin master
```

**Option B — Use GitHub web flow:**
Create repo at github.com, then push via HTTPS with a Personal Access Token.

---

## Environment Variables Needed

The app already reads from `.env.local` for local dev:
```
NEXT_PUBLIC_SUPABASE_URL=https://edxiwaduxwaitxlahkzl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

For Vercel, add these two via `vercel env add` or Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL` = `https://edxiwaduxwaitxlahkzl.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the anon key shown above

---

## Schema Already Deployed?

Run this in your Supabase SQL Editor to verify/create all tables:
File: `C:\Users\philm\.openclaw\workspace\vana-tour-hq\supabase-schema.sql`