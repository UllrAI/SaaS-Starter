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
| Next.js SaaS starter developer documentation     | Implementation | `/blog/saas-starter-kit-developer-guide`       | Complete setup reference; GitHub source click       |
| Stripe Next.js billing production guide          | Implementation | `/blog/stripe-nextjs-billing-production-guide` | Billing spoke; GitHub source click                  |
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
| `github_source_click`                  | A maintained GitHub/source CTA is clicked                        | `source`, `article`, `locale` (blog CTAs)  |
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

Campaign start: 2026-08-13. Outcome review: 2026-11-10. Public-source qualification
was refreshed on 2026-10-02. This is an audit of 20 prospects, not evidence of 20
qualified or completed submissions. No paid links, mass submission, reciprocal
networks, or generic guest posts.

Statuses describe the next real action:

- `qualified`: a relevant public submission route and sufficient asset are known;
  eligible now, but **not submitted**. The maintainer still needs the relevant account.
- `submitted`: an actual submission URL exists; only publisher review remains.
- `publisher-action`: an account, channel-rule check, or firsthand publisher
  decision is needed before eligibility can be established. An invitation is not
  proof that promotion is allowed.
- `milestone-blocked`: a required asset or editorial fit is missing. These are
  excluded from the current submission wave, not left waiting for an outcome.

Asset references below resolve to maintained source and articles:

- **Source**: [MIT repository](https://github.com/ullrai/SaaS-Starter).
- **Architecture**: [Next.js 16 architecture](https://starter.ullrai.com/blog/nextjs-16-saas-starter-architecture),
  supported by `src/app`, `src/components/layout/app-document.tsx`, and the
  [deployment runbook](deployment-zeabur.md).
- **Billing**: [Stripe production guide](https://starter.ullrai.com/blog/stripe-nextjs-billing-production-guide),
  supported by `src/lib/billing/provider.ts` and the Stripe webhook implementation.
- **Auth**: [machine-auth guide](https://starter.ullrai.com/blog/api-keys-oauth-device-flow-saas-agents),
  supported by `src/lib/auth`, `src/lib/api-keys`, and `src/lib/device-auth`.
- **Guide**: [developer guide](https://starter.ullrai.com/blog/saas-starter-kit-developer-guide),
  including `src/components/forms/auth-form.tsx`, `src/schemas/auth.schema.ts`,
  `content-collections.ts`, and `src/lib/uploads/upload-intents.ts`.

| Prospect                             | Audience / asset fit                                                           | Exact contact and public rules                                                                                                                                                                                                                                                                                             | Maintenance / review evidence                                                                                                                      | Status and next action                                                                                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vercel Templates                     | Next.js template users; Source + Architecture                                  | [Submission form](https://vercel.com/templates/submit), confirmed by [official staff](https://community.vercel.com/t/submitting-a-template/6016); [review feedback](https://community.vercel.com/t/feedback-on-template-submission/8372/11) requires working deployment, clear environment setup, and matching demo/source | Official catalog and reviewer feedback; form could not be read in this audit                                                                       | `milestone-blocked`: no verified matching Vercel deployment path, including the separate Worker. Do not claim one-click compatibility from the Zeabur demo                 |
| Zeabur Templates                     | Deployment users; Source + deployment runbook                                  | [Account Template tab](https://zeabur.com/account); [marketplace review rules](https://zeabur.com/docs/en-US/template/maintain-template) require deployable YAML, complete metadata/variables, and no embedded secrets                                                                                                     | Official maintenance guide describes deployment validation and publication review                                                                  | `milestone-blocked`: reusable marketplace YAML and its deployment test are absent; a working manually configured service is insufficient                                   |
| Stripe developer community           | Billing implementers; Billing                                                  | [Official developer-chat invite](https://stripe.com/go/developer-chat), linked from [Stripe contact](https://stripe.com/contact); no public showcase policy verified                                                                                                                                                       | Official support/community route exists; no editorial acceptance evidence                                                                          | `publisher-action`: join with maintainer account and verify a suitable channel/rules. Remove the unsupported “Community Resources showcase” claim                          |
| Better Auth community                | Auth implementers; Auth                                                        | [Official community](https://better-auth.com/community) → [Discord](https://discord.gg/better-auth); promotion rules are not publicly readable                                                                                                                                                                             | Official community directory is active; no showcase acceptance established                                                                         | `publisher-action`: verify channel rules before a focused auth discussion; a generic launch post is not qualified                                                          |
| Drizzle community                    | PostgreSQL/ORM implementers; Architecture + `src/database/client.ts`           | [Official Discord](https://discord.gg/yfjTbVXMW4), linked from [Drizzle](https://orm.drizzle.team/); channel rules require member inspection                                                                                                                                                                               | Official project lists the channel; this is not evidence that starter promotions are accepted                                                      | `publisher-action`: confirm a sharing channel and use the migration/query case study                                                                                       |
| Next.js Show and Tell                | Framework developers; Architecture + Source                                    | [Show-and-tell category](https://github.com/vercel/next.js/discussions/categories/show-and-tell); post a working project and implementation details, disclose maintainer role                                                                                                                                              | Public showcase category contains September 2026 project discussions                                                                               | `submitted`: [Next.js #99588](https://github.com/vercel/next.js/discussions/99588), October 2; observe moderation/feedback                                                 |
| shadcn/ui Show and Tell              | UI implementers; Architecture + Source                                         | [Show-and-tell category](https://github.com/shadcn-ui/ui/discussions/categories/show-and-tell); describe actual components and boundaries                                                                                                                                                                                  | Public category contains Next.js 16 starter/dashboard posts in September 2026                                                                      | `submitted`: [shadcn/ui #12110](https://github.com/shadcn-ui/ui/discussions/12110), October 2; observe moderation/feedback                                                 |
| React Hook Form Show and Tell        | Form implementers; Guide + auth form/schema                                    | [Organization Show-and-tell](https://github.com/orgs/react-hook-form/discussions/categories/show-and-tell); focus on the form integration                                                                                                                                                                                  | [SaaS form/dashboard example](https://github.com/orgs/react-hook-form/discussions/13313) posted March 2026; owner-pinned sharing discussions       | `submitted`: [React Hook Form #13818](https://github.com/orgs/react-hook-form/discussions/13818), October 2; observe moderation/feedback                                   |
| Content Collections Show and Tell    | Content-layer implementers; Guide + `content-collections.ts`                   | [Show-and-tell category](https://github.com/sdorra/content-collections/discussions/categories/show-and-tell) explicitly accepts projects made with the library                                                                                                                                                             | Non-archived project, repository activity on October 1; category exists but no acceptance history demonstrated                                     | `submitted`: [Content Collections #811](https://github.com/sdorra/content-collections/discussions/811), October 2; observe moderation/feedback                             |
| Cloudflare developer community       | R2 implementers; Guide + upload-intent source                                  | [Official developer Discord](https://discord.cloudflare.com/); [community page](https://www.cloudflare.com/community/) includes project sharing                                                                                                                                                                            | Official invitation describes developer project sharing; exact R2 channel rules remain unverified                                                  | `publisher-action`: member must select/check the channel before a focused R2 upload case study                                                                             |
| DEV Community                        | Developers reading practical tutorials; Billing or Auth                        | [Editor](https://dev.to/new); [cross-post/canonical instructions](https://dev.to/help/writing-editing-scheduling) and [conduct rules](https://dev.to/code-of-conduct); credit source, disclose affiliation and applicable AI assistance                                                                                    | Current official publishing help explicitly supports cross-posting with canonical URLs                                                             | `qualified`: eligible now with publisher account; publish one useful source-backed article, not a short advertisement                                                      |
| Hashnode                             | Developers reading technical articles; Architecture                            | [Homepage Sign in / Get started](https://hashnode.com/); [conduct rules](https://hashnode.com/code-of-conduct) prohibit spam/SEO abuse and require accurate attributed work                                                                                                                                                | Official conduct updated June 2026; homepage documents Markdown import retaining canonical URLs                                                    | `qualified`: eligible now after account/blog setup; architecture draft below, set original canonical                                                                       |
| Hacker News Show HN                  | Technical builders who can try/inspect software; Source                        | [Submit](https://news.ycombinator.com/submit); [Show HN rules](https://news.ycombinator.com/showhn.html): personally made, nontrivial, tryable work; no blog-only submission or vote solicitation                                                                                                                          | Current official Show HN instructions give the review bar                                                                                          | `qualified`: source is cloneable software; maker must post and answer questions, clearly state service credentials required. Use Source, not the article as submission URL |
| Indie Hackers                        | Independent SaaS builders; Architecture / release case study                   | [New post](https://www.indiehackers.com/new-post) redirects to account sign-in; [official about](https://www.indiehackers.com/about) welcomes transparent stories and feedback                                                                                                                                             | Official founder description and working login handoff; exact posting/moderation rules not verified                                                | `publisher-action`: inspect authenticated publishing rules; discuss actual decisions without invented revenue, customer, or outcome claims                                 |
| Product Hunt                         | Product/developer-tool discovery; Source + demo                                | [Launch entry](https://www.producthunt.com/launch); [submission checklist](https://www.producthunt.com/launch/preparing-for-launch): personal account, clean URL, thumbnail, at least two gallery images                                                                                                                   | Current official launch guide allows self-submission and states required assets                                                                    | `milestone-blocked`: current launch thumbnail/gallery set and maker availability not verified. Prepare only the required assets; do not invent a marketing project         |
| Reddit r/nextjs                      | Next.js practitioners; Architecture + Source                                   | [Community/current pinned thread](https://www.reddit.com/r/nextjs/); [checked weekly showoff post](https://www.reddit.com/r/nextjs/comments/1wdm09l/weekly_showoff_thread_share_what_youve_created/) restricts showcases to that thread                                                                                    | Moderator-maintained weekly showoff route; no standalone promotion assumed                                                                         | `qualified`: eligible as a comment with Reddit account. Re-select the current pinned thread when posting; draft below, not submitted                                       |
| `unicodeveloper/awesome-nextjs`      | Curated Next.js boilerplate discovery; Source                                  | [Contribution rules](https://github.com/unicodeveloper/awesome-nextjs/blob/master/CONTRIBUTING.md): duplicate check, one suggestion per PR, short Title Case entry                                                                                                                                                         | [Boilerplate PR #605](https://github.com/unicodeveloper/awesome-nextjs/pull/605) merged September 21, 2026; source absent from README on October 2 | `qualified`: eligible now with GitHub account; exact entry/PR text below, no external PR created                                                                           |
| `xcomptek/awesome-saas-boilerplates` | Curated SaaS starter comparison; Source                                        | [Existing submission #227](https://github.com/xcomptek/awesome-saas-boilerplates/pull/227); do not open a duplicate                                                                                                                                                                                                        | October 2 API check: OPEN, non-draft, no reviews/comments, last update August 19; other entries merged August 29                                   | `submitted`: reviewer result only. Recheck on November 10; never count OPEN as accepted                                                                                    |
| OpenAlternative                      | People comparing open-source replacements; Source                              | [Submit](https://openalternative.co/submit) requires login; [about/fit](https://openalternative.co/about); [package page](https://openalternative.co/submit/neovim) sells listing/backlink tiers                                                                                                                           | Live public package selection shows paid visibility options; no free editorial route verified                                                      | `milestone-blocked`: category fit and a free editorial route remain unproven. Exclude paid listing/backlink packages from this campaign                                    |
| AlternativeTo                        | People comparing installable software; Source, if approved as a developer tool | [Official FAQ/add-app procedure](https://alternativeto.net/faq/): verified account, Suggest new app, moderated review; clean official URL, English original description                                                                                                                                                    | Official FAQ warns against clone/low-effort listings and explains manual review delays                                                             | `milestone-blocked`: starter-versus-software category fit is unproven. Not a blanket starter prohibition; do not present a template as a hosted SaaS product               |

Snapshot after the four authorized GitHub discussion submissions on October 2:
**5 qualified but unsubmitted, 5 submitted, 5 publisher actions, and 5
milestone-blocked**. The five actual submissions can be observed for publisher
review/moderation or feedback. Issue #62 still has execution work; a prepared draft
or account requirement is not a submission.
Do not retain unsuitable prospects simply to reach twenty. If the campaign is
narrowed to curated lists, record that explicit scope decision and dispositions
rather than silently marking the remaining queue complete.

### Actual submission log

On October 2, the maintainer explicitly authorized submitting the prepared posts.
Before posting, GitHub API searches for `author:visoar`, `UllrAI`, and
`starter.ullrai.com` found no prior discussion in the four destinations. The
current Show and Tell categories, conduct rules and discussion templates were
checked. React Hook Form's organization discussions were verified to be backed
by `react-hook-form/react-hook-form`, so its exact category was used through the
standard repository discussion API.

| Submitted (UTC)     | Surface / exact result URL                                                                              | Asset / submitter                                       | Outcome                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------- |
| 2026-10-02 14:32:09 | [Next.js Show and Tell #99588](https://github.com/vercel/next.js/discussions/99588)                     | Architecture + route/Worker/release source; `visoar`    | `submitted`; API creation and subsequent read confirmed |
| 2026-10-02 14:32:14 | [shadcn/ui Show and Tell #12110](https://github.com/shadcn-ui/ui/discussions/12110)                     | Architecture + UI primitives/layout source; `visoar`    | `submitted`; API creation and subsequent read confirmed |
| 2026-10-02 14:32:19 | [Content Collections Show and Tell #811](https://github.com/sdorra/content-collections/discussions/811) | Guide + content config/loader/Markdown source; `visoar` | `submitted`; API creation and subsequent read confirmed |
| 2026-10-02 14:32:24 | [React Hook Form Show and Tell #13818](https://github.com/orgs/react-hook-form/discussions/13818)       | Guide + auth form/schema/tests source; `visoar`         | `submitted`; API creation and subsequent read confirmed |

Each post discloses maintainer affiliation and AI-assisted drafting with the
maintainer's authorization. All links are clean source/article URLs. The returned
category was `show-and-tell` and author was `visoar` for all four posts. Creation
is not editorial endorsement or demonstrated referral traffic; four GitHub posts
also do not mean four new referring domains. Record any moderation, response or
referral result at the November 10 observation review.

### Prepared submission text

The four GitHub discussion drafts below were expanded with direct source links
and submitted with maintainer authorization; their actual URLs are recorded below.
The other entries remain drafts for the maintainer after checking the account and
latest surface rules. Start from the following focused text;
include the linked source/asset, not unsupported “production-ready” guarantees.
When AI assistance is disclosed, describe the actual assistance and human review.

| Surface               | Draft title / text                                                                                                                                                                                                                                                                                                                                                          | Linked evidence                                                                   |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Next.js               | **Next.js 16 SaaS starter: separate marketing/app roots and a Worker.** “I maintain UllrAI SaaS Starter, an MIT Next.js 16 project with Better Auth, Stripe, Drizzle/PostgreSQL and a separate background Worker. This write-up explains the root layouts and migration-before-promotion workflow. I would welcome feedback on those boundaries.”                           | Architecture + Source + deployment runbook                                        |
| shadcn/ui             | **A shadcn/ui SaaS workbench with localized public pages.** “I maintain an MIT starter using shadcn/ui and shared layout containers. The source shows the protected workbench and the public English/Chinese reading surfaces. I would welcome feedback on the component/layout organization.”                                                                              | Source: `src/components/ui`, `src/components/layout`; Architecture                |
| React Hook Form       | **React Hook Form + Zod in a localized magic-link form.** “Our open-source starter uses one form schema with localized validation and explicit request/loading/success states. The form and schema are linked below; I would welcome feedback on the integration.”                                                                                                          | Source: `src/components/forms/auth-form.tsx`, `src/schemas/auth.schema.ts`; Guide |
| Content Collections   | **Localized Markdown articles with Content Collections in Next.js 16.** “I maintain a starter with repository-managed English/Chinese Markdown. Content Collections validates article metadata; the content layer resolves translated posts without inventing missing locale variants. Here are the config and content-loading implementation.”                             | Source: `content-collections.ts`, `src/lib/content/blog.ts`; Guide                |
| DEV                   | **Keeping Stripe webhook processing idempotent in a Next.js SaaS.** “This guide follows the implementation in our MIT starter: validate the webhook, claim provider events transactionally, and update billing state through the provider boundary. It also documents local test setup and release checks. I maintain the linked project.”                                  | Billing + Source; set Billing as canonical                                        |
| Hashnode              | **What belongs in the web app, Worker, and release workflow?** “This architecture walkthrough follows a Next.js 16 starter's actual code: separate marketing/protected layouts, PostgreSQL job processing, and committed migrations before production promotion. I maintain the project; the linked source and runbooks show each boundary.”                                | Architecture + Source; set Architecture as canonical                              |
| Show HN               | **Show HN: An MIT Next.js 16 SaaS starter with billing and machine auth.** Maker text: “I maintain this starter. Clone/run instructions are in the README; auth email, billing and storage require your own service credentials. The source includes Better Auth, Stripe, Drizzle/PostgreSQL, R2 and a separate Worker. Feedback on the operational boundaries is welcome.” | Source as submission URL; Guide/runbooks in maker comment                         |
| Reddit weekly showoff | “I maintain an MIT Next.js 16 SaaS starter. The architecture article shows separate public/protected roots, Better Auth, Stripe, Drizzle/PostgreSQL and a Worker. The source and migration/deployment runbooks are linked so the implementation can be inspected. Feedback on these boundaries is welcome.”                                                                 | Architecture + Source; only the current weekly thread                             |

For `unicodeveloper/awesome-nextjs`, add one entry under **Boilerplates**:

```markdown
- [UllrAI SaaS Starter](https://github.com/ullrai/SaaS-Starter) - MIT Next.js 16 SaaS starter with Better Auth, Stripe, Drizzle/PostgreSQL, Cloudflare R2, and English/Chinese localization.
```

Prepared PR title: **Add UllrAI SaaS Starter boilerplate**. Prepared body:
“Adds an MIT Next.js 16 SaaS starter to Boilerplates. The repository includes
Better Auth, Stripe, Drizzle/PostgreSQL, R2 and localized public pages, with setup
and deployment documentation. Source: https://github.com/ullrai/SaaS-Starter.
The October 2 README check found no existing UllrAI/SaaS-Starter entry.” Re-run
the duplicate check immediately before submitting.

For a future Product Hunt submission, the prepared tagline is **Open-source
Next.js SaaS starter with billing and auth** (under 60 characters). Description:
“MIT Next.js 16 starter with Better Auth, Stripe, PostgreSQL/Drizzle, R2 uploads,
English/Chinese content and a separate background Worker. Clone the source and
follow the setup and migration/deployment runbooks. Bring your own service
credentials.” This does not complete its missing thumbnail/gallery or account work.

For every actual action, issue #62 records date, exact surface, asset, submission
URL, submitter, outcome (`submitted`, `accepted`, `declined`, or `no response`), and
any stale URL correction. Use
`utm_source=<surface>&utm_medium=referral&utm_campaign=seo_growth_2026q3` only
where the publisher allows tracking links. Product Hunt and AlternativeTo require
clean official URLs; curated repository entries use clean source URLs. Use Umami
referrer reports when tracking parameters are prohibited. The 90-day comparison
uses qualified referring domains, referral visits, `github_source_click`, and
branded search, not backlink count alone.

## Review schedule

| Date       | Review                                                                                 |
| ---------- | -------------------------------------------------------------------------------------- |
| 2026-08-20 | Sitemap processing, production Umami host isolation, first events, redirect recrawl    |
| 2026-09-30 | Six complete weeks of developer-guide impressions, CTR, and position                   |
| 2026-11-04 | Twelve weeks of cluster impressions, non-brand queries, top-20 pages, assisted signups |
| 2026-11-10 | 90-day authority campaign: qualified referring domains and referral conversions        |

## 2026-10-01 review

Read-only sources: GSC `sc-domain:ullrai.com`, filtered to
`https://starter.ullrai.com/`; Umami dedicated production website
`f059d8b7-d9a7-4972-9d1c-d7bf6187b769`. GSC final data currently ends on
2026-09-28; September 29–30 are not treated as zero. The comparable 28-day
periods are 2026-09-01–09-28 and 2026-08-04–08-31. Umami uses the same dates
with an exclusive end boundary. Raw aggregate responses are retained in
`docs/seo-review-data/2026-10-01/`; no account credentials or visitor-level data.

| GSC page / metric                            |   Current |             Previous |
| -------------------------------------------- | --------: | -------------------: |
| All starter pages: impressions               |       130 |                   77 |
| All starter pages: clicks / CTR              |    0 / 0% |               0 / 0% |
| All starter pages: average position          |      6.75 |                37.47 |
| English guide: impressions                   |        14 |                   15 |
| English guide: average position              |      6.36 |                19.27 |
| Chinese guide: impressions                   |         9 |                    4 |
| Chinese guide: average position              |      5.00 |                 5.25 |
| Architecture hub: impressions / position     | 14 / 6.57 |             1 / 9.00 |
| Machine-auth spoke: impressions / position   | 6 / 31.00 | No returned page row |
| Stripe billing spoke: impressions / position |  9 / 7.22 |           30 / 65.00 |

Both guide locales still have zero clicks. The complete six-week post-release
window 2026-08-13–09-23 versus 2026-07-02–08-12 shows English guide impressions
12 versus 27 and position 12.25 versus 16.93; Chinese impressions 12 versus 1,
position 5.08 versus 5.00. The latest 28-day ranking improvement is encouraging,
but English reach has not grown and CTR has not improved. Sparse impressions and
privacy-filtered empty query rows prevent non-brand or query-intent conclusions.
The aggregate position shift also reflects a changing mix of pages; it is not
proof that every page improved. No guide rewrite is warranted from this sample.

Umami clean event reaggregation reports 57 visitors / 57 visits / 90 pageviews
versus 58 / 64 / 134. The previous window includes days before the dedicated
property was created on August 12, so it is not a complete comparable baseline.
No spam events were removed in either result. Current hostname metrics contain
only `starter.ullrai.com`. Current event counts are `pricing_view=5`,
`signup_click=5`, `github_source_click=1`; these are site-wide counts, not
article-attributed conversions or assisted signups. GSC clicks and Umami visits
remain separate measurements.

Production HTML fetched on October 1 with a browser user agent returns 200 in
both guide locales: one H1, self-canonical, en/zh-Hans/x-default alternates,
and Article/Breadcrumb data in the Next.js script bootstrap. Organization/WebSite
JSON-LD is directly present. This verifies emitted data, not a Google Rich Results
validation or indexing freshness check. Search-tool cached HTML still shows an
older duplicate-H1 version; it is not used to contradict the live response.

- #63: six-week review completed. October 2 code review found remaining body
  drift despite the correct page metadata. The refreshed English and Chinese
  guides correct runtime requirements, root layouts, authentication endpoints,
  upload completion, module paths, and migration-before-promotion order. Close
  #63 after its correction PR merges and the rendered checks pass; its next CTR
  sample belongs to #66, rather than keeping the documentation fix open.
- #66: the published cluster stays in place. Its shared article link renderer
  now labels repository source CTAs with `github_source_click`, `source=blog_article`,
  `article=<slug>`, and `locale`. The billing article now includes the same source
  CTA. Verify event receipt after deployment; October 1 site-wide events cannot
  be retroactively attributed. November 4 still needs non-brand queries,
  top-20 pages, and article conversion evidence. Report assisted signups only
  when session paths establish article assistance, not from site-wide signup totals.
- #62: [existing upstream PR #227](https://github.com/xcomptek/awesome-saas-boilerplates/pull/227)
  was verified OPEN without review/comment on October 2. The qualification
  snapshot now includes four authorized GitHub discussion submissions and leaves
  5 eligible submissions unsent, 5 publisher actions, and
  5 excluded/blocked prospects. Complete or explicitly dispose of that execution
  work before treating #62 as observation only. Review the real submitted results
  on November 10; a five-domain gain is an outcome target, not a guaranteed closure gate.
- #67: #111 and #112 are merged; their implementation work is complete. Retain
  the November 10 combined review for #62 and #66, and update #63 once the
  documentation correction merges. Do not combine search clicks, visits, or
  external backlink estimates into one traffic total. This review did not fetch
  Bing or fresh referring-domain data, so no change is claimed there.
