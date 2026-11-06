# ReproShot pricing

## The model

| Tier | Price | What unlocks |
| --- | --- | --- |
| Free | $0 | Visible-area capture, box/arrow/text annotation, PNG download, copy image |
| Pro (sub) | $4.99 / month | Everything in Free plus full-page capture, redaction/blur, one-click bug-report export (Markdown + Jira/Linear) |
| Pro (lifetime) | $39 one-time | Same as Pro, paid once |

## Why these numbers

The comparable paid bug-and-feedback tools price per seat and route every capture
through their servers:

- Marker.io, BugHerd, and Jam.dev sit at roughly $16-39 per user per month and
  target teams.
- GoFullPage, a generic capture extension with no bug-report workflow, is quoted
  near $10k/mo in the opportunity research.

ReproShot is deliberately under all of them and is priced for the individual QA
tester, support agent, or developer who cannot expense a per-seat SaaS. The
lifetime option captures the large share of extension buyers who prefer one
payment over a subscription (the leading comps report most revenue coming from
one-time and lifetime deals).

## Take rate

ExtensionPay charges 5% and Stripe roughly 2.9% + $0.30. On a $4.99 subscription
that is about $0.69 in fees, leaving roughly $4.30. On the $39 lifetime it is
about $2.26 in fees, leaving roughly $36.74. There is no server cost: the
extension runs entirely in the user's browser, so gross margin is effectively the
net-of-fees amount.

## Changing prices

Prices live in the ExtensionPay dashboard, not in the code, so they can be tuned
without a new store submission.
