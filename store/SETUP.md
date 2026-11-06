# ReproShot - publish runbook

The extension is built and packaged (`dist/reproshot-v1.0.0.zip`). Everything that
can be done without an account is done. Two one-time accounts turn it on. Both are
Rez-only because they need an identity and a payout method.

## 1. ExtensionPay product (unlocks Pro billing) - ~5 min

1. Go to https://extensionpay.com and sign up (free; Grey Ridge).
2. Create a new extension. Set the **product id** to `reproshot`
   (this must match `EXTPAY_ID` in `extension/background.js`). If you pick a
   different id, change that one line and rebuild (`bash scripts/build.sh`).
3. Connect a Stripe account for payouts (ExtensionPay takes 5%, Stripe ~3%).
4. Add the pricing in the ExtensionPay dashboard (see `PRICING.md`):
   - Subscription: $4.99 / month
   - One-time: $39 lifetime
5. No code change beyond the id. `getUser()` / `openPaymentPage()` are already wired.

## 2. Chrome Web Store developer account (unlocks publishing) - ~10 min + review

1. Go to https://chrome.google.com/webstore/devconsole and pay the one-time
   $5 Google registration under the Grey Ridge Google account.
2. Click **Add new item** and upload `dist/reproshot-v1.0.0.zip`.
3. Fill the listing from `store/LISTING.md` (name, summary, description,
   category = Developer Tools, screenshots).
4. Privacy: the policy is already hosted at
   **https://rezearcher.github.io/reproshot/privacy.html** (GitHub Pages).
   Paste that URL into the **Privacy policy** field. Add the single-purpose
   description and the permission justifications from `store/LISTING.md`.
5. Submit for review. Chrome review is typically a few business days.

## After it is live

- Put the Web Store URL in `README.md` and the Grey Ridge site.
- Verify a real purchase unlocks Pro (buy, confirm the editor flips to Pro,
  confirm redaction + full-page + bug-report exports unlock).
- Measure installs weekly. Kill criterion from the opportunity card:
  under 1,000 installs by day 60 or under $100 MRR by day 120.

## Loading locally to test before publish (no account needed)

1. Open `chrome://extensions`, turn on Developer mode.
2. Click **Load unpacked** and select the `extension/` folder.
3. Open any web page, click the ReproShot icon, capture, annotate, export.
   Pro features show the upgrade prompt until ExtensionPay is live.
