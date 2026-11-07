# ReproShot - Chrome Web Store listing copy

## Name
ReproShot - Bug Capture, Annotate & Report

## Summary (132 char max)
Capture a full page, mark it up, and copy a bug report with the browser, OS, URL and viewport already filled in. All local.

## Category
Developer Tools

## Language
English

## Website / support URL
https://rezearcher.github.io/reproshot/

## Try before you install (link in description + first screenshot caption)
https://rezearcher.github.io/reproshot/demo.html — the full annotate + bug-report editor runs in the browser with no install, so reviewers and buyers can confirm the value before adding the extension.

## Full description

Filing a good bug report takes three annoying steps: take the screenshot, draw on it, and then type out "Chrome 141, macOS, 1440x900, here is the URL." ReproShot does the last two for you.

Click the toolbar button and ReproShot grabs the page. The editor opens with arrow, box, and text tools so you can point at the problem. Press one button and it copies a clean report with the environment table already written, ready to paste into Jira, Linear, GitHub, a Slack message, or an email.

Want to see it first? Try the editor in your browser, no install: https://rezearcher.github.io/reproshot/demo.html

WHAT YOU GET

- One-click capture of the visible area, or the full scrolling page (Pro)
- Fast annotation: boxes, arrows, and text labels
- Redaction: blur out tokens, emails, and customer data before you share (Pro)
- Auto-filled environment: URL, browser and version, operating system, viewport, screen, language, and timestamp
- One-click bug report to your clipboard as Markdown, or formatted for Jira and Linear (Pro)
- Download the annotated PNG or copy the image straight to your clipboard

PRIVATE BY DESIGN

ReproShot runs entirely in your browser. Your screenshots and notes never leave your machine. There is no account to create for the free tier, no cloud, and no tracking. Compare that to team bug tools that upload every capture to someone else's server.

WHO IT IS FOR

QA testers, support agents, product managers, and developers who file or receive bug reports and are tired of chasing people for "what browser were you on?"

FREE AND PRO

The free tier covers visible-area capture, annotation, and PNG export. Pro unlocks full-page capture, redaction, and the one-click bug-report exports. One small subscription or a one-time purchase, handled securely at checkout. No per-seat pricing games.

## Screenshots to produce (1280x800)
1. The editor with an arrow and a red box over a broken button, environment table visible on the right.
2. The "Copy bug report" result pasted into a Linear ticket.
3. A redacted capture with an API key blurred out.
4. The popup showing "Capture visible area" and "Capture full page."
5. A full-page stitched capture of a long article or dashboard.

## Permission justifications (for review form)
- activeTab: capture the page only after the user clicks the toolbar button.
- scripting: measure the page and read environment facts for the capture, on the active tab only.
- storage: hand the capture to the editor tab and remember the user's tool choice.
- downloads: save the annotated PNG the user asked for.
- host permission to extensionpay.com: process the optional Pro purchase.
- optional host permissions: only requested if the user turns on full-page capture, which needs to scroll the page.
