# Google Search Console API access — one-time setup (~5 min)

This lets `scripts/seo-monitor.mjs` (and Claude sessions) submit the sitemap,
read index coverage, and track impressions/clicks for tavadiena.lv without
manual console clicks. Only you can do these steps — they run under your
Google account.

## 1. Create a service account + key

1. Open <https://console.cloud.google.com/> (any project, or create one, e.g. `tavadiena-seo`).
2. **APIs & Services → Library** → search **"Google Search Console API"** → **Enable**.
3. **IAM & Admin → Service Accounts → Create service account**
   - Name: `gsc-monitor` (no project roles needed — access is granted in GSC, not IAM).
4. Open the new service account → **Keys → Add key → Create new key → JSON** → download.
5. Save the file to:

   ```sh
   mkdir -p ~/.config/tavadiena
   mv ~/Downloads/<downloaded-key>.json ~/.config/tavadiena/gsc-sa.json
   chmod 600 ~/.config/tavadiena/gsc-sa.json
   ```

## 2. Grant it access to the GSC property

1. Copy the service account email (looks like `gsc-monitor@<project>.iam.gserviceaccount.com`).
2. Open <https://search.google.com/search-console> → property **https://tavadiena.lv/**
   → **Settings → Users and permissions → Add user** → paste the email → permission **Full**.

## 3. Verify

```sh
node scripts/seo-monitor.mjs
```

Expected: public checks pass AND a `GSC sitemap: submitted=true …` section with
traffic numbers appears. Before the key exists the script still runs — it just
prints `GSC: no key at ~/.config/tavadiena/gsc-sa.json` and skips the API part.

The key never goes into the repo (it lives in `~/.config/tavadiena/`), and the
weekly monitor routine picks it up automatically once present.
