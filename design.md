---
name: ullrai-design-guidelines
description: "Design and implementation rules for UllrAI SaaS Starter surfaces. Use for every user-facing page, component, email, and generated product UI."
---

# Design UllrAI surfaces with clarity and edge

This document is the design source of truth for the repository. It adapts the
decision-first structure, typographic discipline, shared grid, restraint, and
accessibility standards of [Vercel's design guidance](https://vercel.com/design.md)
to UllrAI's actual product. It does not copy Vercel's monochrome brand or
product chrome.

UllrAI should feel precise, direct, technical, and ready for production. The
visual signature is a cool indigo primary, square geometry, visible structure,
and compact evidence-led composition. Confidence comes from clear hierarchy and
working product states, not decoration.

## Protect these priorities

When requirements compete, protect them in this order:

1. Preserve user data, meaning, permissions, localization, and task accuracy.
2. Make the user's goal, current state, and next action immediately clear.
3. Preserve the repository's framework, semantic containers, tokens, and UI
   primitives.
4. Maintain UllrAI authorship through indigo, square geometry, strong type, and
   disciplined borders.
5. Refine responsive behavior, accessibility, and details without weakening
   the hierarchy.

## Brand character

- **Square and engineered.** The default radius is zero. Controls, panels,
  cards, code blocks, previews, badges, and menus use square corners.
- **Indigo, not monochrome.** Keep the existing `primary` indigo as the main
  action and emphasis color. Never replace it with Vercel black.
- **Calm, not sterile.** Use indigo and measured contrast to establish a focal
  point. Supporting surfaces stay quiet.
- **Direct, not promotional.** Prefer concrete outcomes and real capabilities
  over hype, generic praise, or invented certainty.
- **Structured, not boxed.** Use spacing, alignment, and dividers before adding
  another container.

The following shapes are intentional exceptions to square geometry because the
shape carries meaning: avatars, status dots, switch tracks and thumbs, loading
spinners, chart points, and circular icon-only controls whose hit area remains
clear. A badge, tab, card, input, dialog, or ordinary button is not an exception.

## Color and tokens

`styles/theme.css` owns all application color, radius, shadow, and typography
tokens. Components consume semantic tokens instead of literal colors.

- `background` is the continuous page canvas.
- `card` is a neutral grouped surface, not a default wrapper for every section.
- `muted` supports secondary regions and passive states.
- `primary` is reserved for the primary action, selected state, focus, key link,
  or the single strongest visual anchor in a section.
- `destructive` communicates destructive or failed states only.
- `border` separates real regions. Stronger hierarchy uses a two-pixel border,
  not a soft shadow.
- Chart colors encode distinct series or states and must never be the only cue.

Both light and dark themes must preserve the same hierarchy. Do not introduce a
third page-local palette or hardcoded product color. Black media scrims are
allowed only when necessary to keep text or controls readable over an image or
video.

## Depth and boundaries

The default surface is flat. Cards and inputs do not receive ambient shadows.
Use borders, background contrast, and whitespace first.

Hard offset shadows may be used for one deliberately elevated or illustrative
object, such as the homepage product preview. Floating overlays may use one
small hard shadow to separate them from the page. Do not use blur-heavy shadows,
glows, glass effects, backdrop blur, or nested elevation.

Every border must explain a boundary, selection, warning, table row, or control.
If removing a border does not reduce comprehension, remove it.

## Typography

Inter is the Latin interface and reading typeface; Simplified Chinese uses the
platform sans-serif fallback. JetBrains Mono is reserved for commands, paths,
code, tokens, timestamps, identifiers, and aligned technical values. Do not set
ordinary prices, dates, labels, or prose in monospace.

Use the existing Tailwind type scale. Do not add arbitrary font sizes when a
named scale step works.

- One page-defining `h1` establishes the first read.
- Section headings state a concrete question, capability, or outcome.
- Body copy uses regular weight and a comfortable line height.
- Labels are sentence case. Do not use all-caps, wide tracking, decorative
  eyebrows, or numbered section ornaments.
- Equivalent peers use identical size, weight, leading, and numeric treatment.
- Reading prose should remain near 60–68 characters per line.
- Large text should wrap intentionally. Fix copy or measure before shrinking it.

Use full sentences rather than concatenated fragments. User-visible copy must
live in both locale catalogs and follow the repository's `next-intl` rules.

## Grid, containers, and spacing

Use the semantic containers in `src/components/layout/page-container.tsx`:

- `ShellContainer` for global chrome and wide product compositions.
- `SectionContainer` for standard marketing sections and page bodies.
- `ReadingContainer` for articles and legal content.
- `CompactContainer` for authentication forms.
- `FocusContainer` for status pages and bounded single-task flows.

Full-bleed background and content width are separate decisions. A full-width
section still places its content in a semantic container.

Use a shared edge and a stable reading path. Desktop compositions may use 12
columns, tablet 6, and mobile 4. Major comparisons, admin tables, charts, upload
workbenches, and AI canvases may use the full available width. Prose should not.

Spacing communicates relationships:

- Heading to its first paragraph is close.
- Items inside a component use compact gaps.
- Peer groups use consistent gaps and aligned internal rows.
- A new section receives clearly more space than a new paragraph.
- One parent owns each gap; avoid stacked margins from both parent and child.

Avoid equal card grids when the content is not truly peer information. Let the
decisive capability or action take more space when it matters.

## Composition

The first viewport must reveal what the surface is for, what state it is in, and
what the user can do next. It should not be a ceremonial title followed by a
generic card grid.

Choose geometry before components:

- Comparison: aligned rows or columns on the same visual basis.
- Process or dependency: sequence and connection.
- Magnitude or rank: aligned position or length on one declared scale.
- Exact lookup: semantic table.
- One conclusion: concise prose beside or above its evidence.
- One task: make the working form, editor, uploader, or calculator the focal
  object.

Every major section should add a new answer. Do not repeat the same feature,
recommendation, or value in a badge, title, card, and conclusion.

## Component rules

### Buttons and links

- One primary button per local decision group.
- Secondary actions use outline or ghost treatment.
- Link styling stays visibly link-like; do not turn every link into a button.
- Labels start with a clear verb when the action is not obvious.
- Icon-only controls require an accessible name and a familiar icon.
- Hover and active states change color, border, or position by at most a small
  deliberate amount. Never bounce or dramatically scale controls.

### Cards and panels

- Use a card only for a real grouped object, selectable option, or bounded task.
- Cards are flat by default and never nest decorative cards.
- Align title, description, values, and actions across peer cards.
- A selected or recommended card uses a stronger border and an explicit text
  label. Do not rely on color or shadow alone.

### Badges and status

- Badges communicate status, category, or a compact count.
- They are rectangular, sentence case, and quiet unless the state is critical.
- Do not use a badge as a decorative eyebrow above every title.
- Pair status color with text or an icon.

### Forms

- Use native semantics, persistent visible labels, and clear units.
- Help text appears only when it prevents an error or explains a constraint.
- Preserve invalid values so users can correct them.
- Place the error next to the field and summarize it when the form is long.
- Focus is always visible. Disabled and loading states must remain legible.
- Inputs, selects, textareas, checkboxes, and tab controls use square geometry.
  Switches retain their standard track shape.

### Dialogs, menus, sheets, and tooltips

- Use overlays only when the task should interrupt or remain in context.
- Titles describe the decision or task, not the component type.
- Keep motion short and functional, and respect reduced-motion settings.
- Portaled surfaces use the same tokens and square geometry as the page.
- Tooltips supplement a visible control; they never contain required
  instructions.

### Tables and data

- Use semantic `table`, header, body, row, and caption structure.
- Left-align text and right-align numeric columns, including their headers.
- Use tabular numerals for aligned values.
- Keep units, periods, bases, filters, and totals next to the data they qualify.
- Tables own the available evidence width and may scroll locally on narrow
  screens. Do not shrink labels to unreadable text.
- Charts use a shared scale, direct labels when possible, and a text alternative.

### Empty, loading, success, and error states

- Empty states explain why the area is empty and offer one useful next action.
- Skeletons preserve the final layout and do not pulse indefinitely.
- Success states confirm what changed and where the result lives.
- Error states explain the recovery action without exposing raw provider errors.
- Never ship fake success, placeholder data, or dead-end controls.

## Surface-specific guidance

### Marketing

Lead with the product outcome and working proof. The homepage may keep its hard
offset product preview as the signature composition. Supporting sections use
fewer cards, left-aligned editorial headings, and indigo only for the strongest
anchor. Avoid gradients, decorative grid backgrounds, glass headers, floating
badges, and repetitive centered section intros.

### Authentication and status flows

Keep the form or status card as the only focal object. Global navigation is
minimal. Background decoration must not compete with labels, validation, or the
next action.

### Dashboard and settings

The persistent sidebar establishes navigation. Page headers align titles,
descriptions, and actions to the same grid. Prefer section dividers and full-
width task surfaces to a collection of elevated cards. Dense operational views
prioritize scan speed, table alignment, state clarity, and keyboard access.

### Billing and pricing

Put payment mode and billing period controls before the tiers. Compare tiers on
the same basis, align prices and included features, and label the recommendation
in text. Price is proportional hierarchy, not a decorative monospace billboard.
Explain renewal timing and the checkout transition before the primary action.

### Blog and legal content

Use `ReadingContainer` and the shared Markdown styles. Images are evidence or
content, not decoration. Captions, dates, and authorship remain subordinate but
readable. Headings follow a strict order and tables preserve lookup width.

### Uploads and media

The drop zone is a task surface, not a decorative dashed card. Show accepted
formats and limits before selection, expose progress and cancellation, and keep
file identity visible. Rounded media is not part of the product language;
previews use square crops unless the source itself is circular.

### AI chat and canvas

Chat remains the conversational path and Canvas the work surface. User messages
may use a muted bounded block; assistant content stays unboxed. The composer is
always reachable. Tool approval, reasoning, attachments, and generated
artifacts must expose their state in text and remain usable on mobile.

### Email

Match the same indigo, square geometry, direct hierarchy, and sentence-case
copy, while using email-safe inline styles. Do not rely on dark mode or complex
layout for comprehension.

## Accessibility and responsive behavior

- Use landmarks, one descriptive `h1`, ordered headings, native controls, and
  semantic tables.
- Provide a skip link on global application shells when repeated navigation
  precedes the main content.
- Meet WCAG AA contrast. Color is never the only state cue.
- Keep targets at least 40 CSS pixels where the layout allows; never make the
  only target smaller than 32 pixels.
- Preserve source order as reading order.
- Reflow before shrinking. Grid and flex children use `min-width: 0` where
  content could overflow.
- Do not hide page overflow to conceal a layout problem.
- Test keyboard navigation, visible focus, zoom/reflow, light and dark themes,
  and reduced motion.

## Motion

Default to stillness. Motion may explain a state change, preserve continuity,
or confirm an action. Do not use decorative pinging, auto-scrolling marquees,
typing cursors, bounce, parallax, hover image movement, or scroll-reveal effects.
The complete experience must work with reduced motion.

## Hard rejects

Do not ship:

- decorative gradients, glows, blobs, grid textures, glass, or backdrop blur;
- soft ambient shadows on ordinary cards, inputs, buttons, or panels;
- pill-shaped metadata, ordinary labels, or tabs;
- all-caps labels, wide letter spacing, or decorative eyebrows;
- a generic centered hero followed by interchangeable card grids;
- icons in colored tiles when a text label is clearer;
- nested cards, borders used to repair weak hierarchy, or color without meaning;
- arbitrary font sizes, tiny muted copy, or mismatched peer typography;
- fake screenshots, placeholder flows, stock decoration, or unsupported claims;
- visible controls that do not work.

## Implementation and review

Before adding a new visual pattern, check the relevant implementation in
`src/components`, `styles/theme.css`, `styles/globals.css`, and this file. Reuse
an existing semantic container and UI primitive before creating a new one.

Review every meaningful UI change in this order:

1. **First read:** purpose, state, and next action are obvious.
2. **Hierarchy:** one focal object leads; supporting content is quieter.
3. **Alignment:** shared edges, baselines, peer rows, and actions line up.
4. **Restraint:** remove any surface, border, badge, icon, or copy that adds no
   meaning or affordance.
5. **States:** loading, empty, error, success, disabled, selected, and destructive
   states are complete.
6. **Access:** semantics, focus, labels, contrast, target size, and reading order
   are sound.
7. **Themes and reflow:** light, dark, desktop, and narrow layouts preserve the
   same hierarchy without overflow.
8. **Localization:** English and Simplified Chinese stay in parity and do not
   mix languages within one shipped view.

The target is UllrAI judgment: strong structure, square geometry, indigo
authorship, real product states, and unusually low friction.
