# ReproShot

Capture a web page, mark it up, and copy a bug report that already has the
browser, OS, URL, and viewport filled in. A Manifest V3 Chrome extension that
runs entirely in the browser. No account, no cloud, no tracking on the free tier.

Built by Grey Ridge Signals Group LLC.

**Try it with no install:** https://rezearcher.github.io/reproshot/demo.html — the
annotate + bug-report editor runs standalone in your browser. The extension adds
one-click visible and full-page capture so you skip the upload step.

## Why

A useful bug report needs a screenshot, some arrows pointing at the problem, and
the environment it happened in. Most people skip the environment line, so whoever
receives the report has to chase it down. ReproShot fills it in automatically and
hands you a clean, paste-ready report for Jira, Linear, GitHub, Slack, or email.

## Features

- Visible-area capture (free) and full-page scroll-stitch capture (Pro)
- Annotate: boxes, arrows, text labels
- Redact: pixelate tokens, emails, and customer data before sharing (Pro)
- Auto environment table: URL, browser + version, OS, viewport, screen, language, timestamp
- Export: download PNG, copy image, copy Markdown bug report, copy for Jira/Linear (Pro)
- Private: nothing leaves your machine

## Project layout

```
extension/      the unpacked MV3 extension (load this folder in chrome://extensions)
  manifest.json
  background.js  capture + full-page stitch + ExtPay billing bridge
  popup.*        toolbar popup
  editor.*       annotation canvas and exports
  ExtPay.js      vendored ExtensionPay client (billing)
  icons/
scripts/
  gen_icons.py   regenerate the icon set
  build.sh       package dist/reproshot-vX.Y.Z.zip for the Web Store
store/
  LISTING.md     Web Store listing copy + permission justifications
  PRIVACY.md     privacy policy (host this and link it in the listing)
  SETUP.md       one-time publish runbook (ExtensionPay + Web Store)
PRICING.md       tiers and rationale
```

## Develop

```bash
# load unpacked
# chrome://extensions -> Developer mode -> Load unpacked -> select extension/

npm run icons   # regenerate icons
npm run lint    # eslint
npm run build   # produce dist/reproshot-vX.Y.Z.zip
```

## Publish

See `store/SETUP.md`. In short: register the ExtensionPay product id `reproshot`,
create a Chrome Web Store developer account, upload the built zip, fill the listing
from `store/LISTING.md`, link the hosted privacy policy, and submit.

## Privacy

ReproShot does not collect or transmit your data. See `store/PRIVACY.md`.
