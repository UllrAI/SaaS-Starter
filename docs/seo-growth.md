# SEO growth operations

This runbook keeps search, product analytics, and third-party estimates separate
while giving maintainers one repeatable workflow for `starter.ullrai.com`.

## Measurement contract

| Source                | Use                                                                  | Do not use it for                                                 |
| --------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Google Search Console | Google impressions, clicks, queries, pages, indexing                 | Sessions or conversions                                           |
| Bing Webmaster Tools  | Bing impressions, clicks, crawl and index status                     | Google performance                                                |
| Umami                 | First-party visits, referrers, journeys, named conversion events     | Billing truth or historical traffic before the dedicated property |
| TabAPI                | External SERP/backlink discovery and directional authority estimates | First-party traffic totals                                        |

Never add these sources into one traffic number. Use complete comparable periods,
record the data extraction date, and annotate releases before comparing trends.

## Index inventory and baseline

Release v0.1.3 expects 26 canonical URLs when billing is enabled:

| Template                            | English | Simplified Chinese | Expected total |
| ----------------------------------- | ------: | -----------------: | -------------: |
| Homepage and public marketing pages |       8 |                  8 |             16 |
| Blog posts                          |       8 |                  2 |             10 |
| Total                               |      16 |                 10 |             26 |

The sitemap intentionally excludes `/api/*`, `/auth/*`, `/dashboard/*`,
`/device`, `/login`, `/signup`, and `/payment-status`. Those paths remain
non-indexable through robots rules and page metadata where applicable.

Baseline on 2026-08-12: GSC had no submitted sitemap under
`sc-domain:ullrai.com`; the homepage and English developer guide were indexed,
while `/login` and `/signup` were excluded by `noindex`. Bing access was limited
to the `https://ullrai.com/` URL-prefix property and had no dedicated
`starter.ullrai.com` view. The public sitemap contained 23 URLs before the three
phase-one articles were added.

After every release that changes routes or metadata:

1. Fetch `/robots.txt` and `/sitemap.xml`; compare sitemap URLs with the inventory.
2. Inspect the homepage, pricing, blog index, both developer-guide locales, one
   English-only article, and `/login` in GSC and Bing.
3. Confirm each public page returns 200, a self-canonical, the intended locale,
   and reciprocal `hreflang` where a translation exists.
4. Confirm every article has one H1 and valid Article plus BreadcrumbList JSON-LD.
5. Record submitted, indexed, excluded, and error counts in issue #61 every 28 days.

Owner: repository maintainer. Initial recrawl review: 2026-08-20. Ongoing review:
every 28 complete days.

## Keyword-to-page map

One primary intent is assigned to each page. Related phrases support the primary
intent; they must not trigger a second near-duplicate page.

| Primary intent                                   | Buyer stage    | Canonical page                                 | Role and conversion                                 |
| ------------------------------------------------ | -------------- | ---------------------------------------------- | --------------------------------------------------- |
| open-source Next.js 16 SaaS starter              | Consideration  | `/blog/nextjs-16-saas-starter-architecture`    | Architecture hub; GitHub source click               |
| Next.js SaaS starter developer documentation     | Implementation | `/blog/saas-starter-kit-developer-guide`       | Complete setup reference; clone-command copy        |
| Creem Next.js billing production guide           | Implementation | `/blog/creem-nextjs-billing-production-guide`  | Billing spoke; pricing view and checkout start      |
| API keys vs OAuth vs device flow for SaaS agents | Consideration  | `/blog/api-keys-oauth-device-flow-saas-agents` | Machine-auth spoke; GitHub source click             |
| agent-friendly SaaS template                     | Awareness      | `/blog/agent-friendly-saas-template`           | Concept introduction; continue to auth spoke        |
| Next.js SaaS starter features                    | Decision       | `/features`                                    | Product capability summary; signup click            |
| Next.js SaaS starter pricing                     | Decision       | `/pricing`                                     | Plan and checkout decision; payment start           |
| UllrAI SaaS Starter                              | Navigational   | `/`                                            | Brand/product hub; signup, GitHub, and clone events |

The architecture hub links to all implementation spokes. Each spoke links back to
the hub, the full developer guide, relevant product pages, and source. Chinese
content is published only when it is fully localized; English-only pages do not
emit fake Chinese alternates.

## Umami event definitions

Production uses a dedicated website ID and a `starter.ullrai.com` domain filter.
Forks and local deployments must create separate Umami websites.

| Event                                  | Fires when                                                       | Useful dimensions                          |
| -------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------ |
| `github_source_click`                  | A maintained GitHub/source CTA is clicked                        | `location`                                 |
| `clone_command_copy`                   | The homepage clone command is copied                             | `location`                                 |
| `signup_click`                         | A maintained signup CTA is clicked                               | `source`                                   |
| `signup_submit` / `login_submit`       | Auth form submission starts                                      | `method`                                   |
| `signup_link_sent` / `login_link_sent` | Magic-link request succeeds                                      | `method`                                   |
| `signup_success`                       | Better Auth creates a new user and follows its new-user callback | —                                          |
| `pricing_view`                         | Pricing options mount                                            | —                                          |
| `payment_start`                        | A checkout session succeeds before redirect                      | `tier_id`, `payment_mode`, `billing_cycle` |
| `payment_success`                      | Controlled payment status reaches success                        | `payment_mode`                             |

After deployment, view the production HTML and confirm exactly one tracker,
the dedicated website ID, and `data-domains="starter.ullrai.com"`. Trigger one
GitHub or clone event, confirm it arrives, then review hostname and events after
seven complete days (2026-08-20). Historical aggregate data from the shared
property is not a baseline.

## Qualified discovery and backlink campaign

Campaign start: 2026-08-13. Outcome review: 2026-11-10. Use the source repository,
architecture article, billing guide, or auth threat-model guide as the target
asset. Campaign links use `utm_source=<surface>&utm_medium=referral&utm_campaign=seo_growth_2026q3`.
No paid links, mass submission, reciprocal networks, or generic guest posts.

`Ready` means the public submission route is known; it does not mean a submission
has been sent. Communication requiring a maintainer profile, community membership,
or editorial judgment is logged in issue #62 before it is sent.

| Prospect                       | Relevance / editorial bar                                         | Contact path                                                  | Target asset                   | Status                                       |
| ------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------ | -------------------------------------------- |
| Vercel Templates               | Official Next.js template catalog; deployability review           | `https://vercel.com/templates/submit`                         | Repository + architecture hub  | Ready after production smoke test            |
| Zeabur Template Marketplace    | Official deployment marketplace; tested YAML and docs required    | Zeabur template publish CLI/dashboard                         | Repository + deployment guide  | Needs reusable template asset                |
| Creem Community Resources      | Official billing ecosystem showcase                               | Creem Discord community/showcase                              | Billing production guide       | Needs maintainer community post              |
| Better Auth community          | Direct authentication audience; technical discussion only         | Better Auth GitHub Discussions/Discord                        | Auth threat-model guide        | Needs discussion tailored to community rules |
| Drizzle community              | Direct ORM/PostgreSQL implementation audience                     | Drizzle Discord/community channels                            | Architecture hub               | Needs database-focused case study            |
| Next.js community              | Direct framework audience; high moderation bar                    | Next.js GitHub Discussions                                    | Architecture hub               | Needs concise implementation write-up        |
| shadcn/ui community            | Relevant UI stack and starter discovery                           | shadcn/ui GitHub Discussions/community                        | Architecture hub               | Research current showcase policy             |
| React Hook Form community      | Form-stack implementation audience                                | GitHub Discussions                                            | Developer guide form section   | Research before outreach                     |
| Content Collections ecosystem  | Exact content-layer integration                                   | Project GitHub Discussions/issues where showcases are allowed | Architecture hub               | Maintainer relationship first                |
| Cloudflare developer community | R2 direct-upload architecture relevance                           | Cloudflare Developer Discord/forum                            | Developer guide upload section | Needs focused R2 case study                  |
| DEV Community                  | Editorial developer audience; self-published, disclosure required | `dev.to/new`                                                  | Auth or billing guide          | Ready after release                          |
| Hashnode                       | Editorial developer audience; canonical support required          | Author dashboard                                              | Architecture hub               | Ready after release                          |
| Hacker News Show HN            | Strong technical bar; launch must invite scrutiny                 | `news.ycombinator.com/submit`                                 | Repository + architecture hub  | Hold for meaningful milestone                |
| Indie Hackers                  | SaaS builder audience; transparent build narrative                | Product/community post                                        | Release case study             | Needs outcome data                           |
| Product Hunt                   | Product discovery; launch assets and active maintainer needed     | Product Hunt launch dashboard                                 | Production demo + repository   | Needs launch package                         |
| Reddit r/nextjs                | Exact framework audience; strict self-promotion norms             | Community post after rule review                              | Architecture hub               | Needs rule review and useful summary         |
| GitHub `awesome-nextjs` lists  | Maintained curated lists; PR review                               | Repository contribution guide/PR                              | Repository                     | Qualify list freshness before PR             |
| GitHub SaaS boilerplate lists  | Comparison intent; maintenance quality varies                     | Curated repository contribution PR                            | Repository                     | Shortlist maintained lists only              |
| OpenAlternative                | Open-source alternative discovery                                 | Project submission form                                       | Repository                     | Verify category and editorial fit            |
| AlternativeTo                  | Product comparison discovery; community moderation                | Add/suggest application flow                                  | Production demo                | Verify open-source listing fit               |

For every action, issue #62 records: date, exact surface, asset, campaign URL,
submitter, outcome (`submitted`, `accepted`, `declined`, or `no response`), and
any stale URL correction. The 90-day comparison uses qualified referring domains,
Umami referral visits, `github_source_click`, and branded search—not backlink count
alone.

## Review schedule

| Date       | Review                                                                                 |
| ---------- | -------------------------------------------------------------------------------------- |
| 2026-08-20 | Sitemap processing, production Umami host isolation, first events, redirect recrawl    |
| 2026-09-30 | Six complete weeks of developer-guide impressions, CTR, and position                   |
| 2026-11-04 | Twelve weeks of cluster impressions, non-brand queries, top-20 pages, assisted signups |
| 2026-11-10 | 90-day authority campaign: qualified referring domains and referral conversions        |
