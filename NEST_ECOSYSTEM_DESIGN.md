# Nest Ecosystem Design Language

> Agent contract for building a starter page that feels native to the modern NestJS ecosystem.

## Mission

Design and implement a developer-facing starter page with the visual confidence, technical energy, and editorial composition associated with the current NestJS website. The result should feel at home beside NestJS products without becoming a pixel-for-pixel clone.

Use the system below as a binding design contract. Preserve the product's own name, content, and identity. Do not copy NestJS illustrations, logo artwork, page copy, or proprietary brand assets unless the project already has permission to use them.

## Visual thesis

The experience is a cinematic developer product: near-black space, crisp white typography, one vivid crimson signal color, large editorial statements, technical diagrams, and restrained interface chrome. It should feel fast, modular, architectural, and serious—not like a generic SaaS template.

Five qualities must be visible:

1. **Dark-first and high contrast.** The canvas is almost black, not charcoal dashboard gray.
2. **Typography-led.** Scale and composition create hierarchy before cards or borders do.
3. **Crimson as signal.** Red marks energy, active state, code flow, and key moments; it is not wallpaper.
4. **Technical imagery.** Prefer modules, nodes, dependency lines, code fragments, grids, and structural motion.
5. **Minimal chrome.** Surfaces stay flat and spacious; avoid surrounding every thought with a card.

## Source-aligned foundation

The current official NestJS site uses a custom implementation rather than a public component design system. Its observable foundation includes:

- React Router, React, Tailwind CSS, Sass, GSAP/Motion, Three.js/OGL, and Embla.
- Manrope for UI and display text.
- Geist Mono for code and technical labels.
- A base canvas of `#050303`, white text, and Nest crimson `#ea2845`.
- Large medium-weight display typography, compact pill CTAs, technical motion, and mostly transparent navigation chrome.

Use these facts as a starting point, not as permission to reproduce official artwork.

## Design tokens

Start with these semantic CSS tokens. Components must consume semantic tokens rather than hard-coded colors.

```css
:root {
  color-scheme: dark;

  --font-sans: "Manrope", "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Geist Mono", "SFMono-Regular", Consolas, monospace;

  --bg-canvas: #050303;
  --bg-raised: #0d090a;
  --bg-subtle: #151011;
  --bg-inverse: #ffffff;

  --text-primary: #ffffff;
  --text-secondary: #c9c4c5;
  --text-muted: #898384;
  --text-inverse: #050303;

  --accent: #ea2845;
  --accent-hover: #f13d58;
  --accent-pressed: #cf1935;
  --accent-soft: rgb(234 40 69 / 14%);
  --accent-glow: rgb(234 40 69 / 28%);

  --line-subtle: rgb(255 255 255 / 10%);
  --line-strong: rgb(255 255 255 / 22%);
  --focus: #ff5a72;
  --success: #49c27d;
  --warning: #f0b44d;
  --danger: #ea2845;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;
  --space-24: 6rem;
  --space-32: 8rem;

  --radius-control: 999px;
  --radius-panel: 0.5rem;
  --radius-media: 0.75rem;

  --container: 80rem;
  --gutter: clamp(1.25rem, 4vw, 4rem);

  --duration-fast: 150ms;
  --duration-base: 300ms;
  --duration-slow: 700ms;
  --ease-standard: cubic-bezier(.4, 0, .2, 1);
  --ease-out: cubic-bezier(0, 0, .2, 1);
}
```

The core Nest-like palette is intentionally narrow. Add new colors only for semantic system feedback or meaningful data visualization.

## Typography

Typography carries the identity. Use Manrope with medium rather than ultra-bold display weights.

```css
.display-xl {
  font: 500 clamp(4rem, 8.2vw, 7rem) / 0.95 var(--font-sans);
  letter-spacing: -0.045em;
}

.display-lg {
  font: 500 clamp(2.75rem, 5vw, 4.5rem) / 1 var(--font-sans);
  letter-spacing: -0.035em;
}

.heading-xl {
  font: 500 clamp(2.25rem, 3.5vw, 3rem) / 1.17 var(--font-sans);
  letter-spacing: -0.025em;
}

.heading-md { font: 600 1.25rem / 1.35 var(--font-sans); }
.body-lg    { font: 400 1.125rem / 1.65 var(--font-sans); }
.body       { font: 400 1rem / 1.5 var(--font-sans); }
.label      { font: 600 0.875rem / 1.25 var(--font-sans); }
.technical  { font: 500 0.75rem / 1.4 var(--font-mono); letter-spacing: 0.08em; text-transform: uppercase; }
```

Rules:

- Hero headlines may occupy two to four lines and become part of the composition.
- Do not bold every heading. Medium weight plus scale is the primary hierarchy.
- Keep body copy narrow: generally `45–65ch`.
- Use monospace only for code, metadata, coordinates, API concepts, counters, and diagram labels.
- Avoid gradient text, outlined display text, and random all-caps marketing labels.

## Page composition

### Header

- Transparent over the canvas; no floating glass capsule.
- Max-width container with generous horizontal gutters.
- Brand at left, primary navigation centered or left-weighted, utility actions at right.
- Navigation labels are `16px / 500` with clear hover and focus behavior.
- Use one compact white primary button and one quiet secondary action.
- A dropdown can be deep black with a subtle hairline border and grouped product links.
- On mobile, collapse navigation into a full-width dark sheet—not a tiny desktop menu.

### Hero

- Use a deliberately composed, edge-aware display headline rather than a generic centered marketing stack.
- At desktop size, target a `clamp(4rem, 8.2vw, 7rem)` hero with approximately `0.95` line height.
- Pair the headline with a concise product proposition and no more than two primary actions.
- Let a technical visual share or interrupt the hero composition: a module graph, dependency flow, animated code structure, or restrained 3D field.
- Use red as a precise visual event: a node, route, cursor, underline, particle path, or active phrase.
- Do not add a badge above the headline unless it communicates real release/status information.

### Content rhythm

Alternate between:

- editorial statement sections,
- structured technical demonstrations,
- edge-to-edge visual regions,
- compact product capability groups,
- credible ecosystem/community proof.

Avoid repeating identical card grids. Each section should have a distinct job and composition.

### Capability presentation

Explain product architecture through diagrams and meaningful examples. Good motifs include:

- connected modules,
- dependency-injection paths,
- decorators and metadata,
- request pipelines,
- layered services,
- code fragments that assemble into a system.

When cards are necessary, keep them low-chrome: flat dark surfaces, one thin divider, minimal radius, no decorative shadow.

### Footer

Use a quiet, structured footer with strong alignment and smaller typography. It may contain ecosystem columns, community links, status/legal information, and one controlled brand moment. Do not turn it into another oversized CTA section.

## Component specifications

### Buttons

Primary button:

- White surface, near-black label.
- `40–44px` height, `20–22px` radius, `16px / 700` text.
- Horizontal padding around `20–24px`.
- Hover: slight surface dimming or a subtle `translateY(-1px)`; never a large glow.

Secondary button:

- Transparent surface with white label.
- Optional subtle hairline border.
- Same geometry as primary.
- Hover may reveal a faint white surface.

Accent button:

- Reserved for a high-priority product action.
- Crimson surface with white text.
- Do not use both white and crimson as competing primary CTAs in the same cluster.

### Links

- Text links remain simple.
- Use a short underline, arrow shift, or color transition on hover.
- External links show a small external-link indicator where ambiguity matters.

### Panels

- Background: `--bg-raised` or transparent.
- Border: `1px solid var(--line-subtle)` only when containment is needed.
- Radius: `8–12px`; never default to huge soft cards.
- Avoid drop shadows on static content.
- Use padding of `24–32px` and align inner content to the page grid.

### Code and terminal surfaces

- Use Geist Mono.
- Keep syntax color restrained: white/gray code with crimson for the primary concept and limited semantic colors.
- Provide a visible copy action and keyboard focus.
- Code blocks should show real starter code, not filler.

### Forms

- Inputs are dark, bordered, and direct; they do not need pill geometry.
- Minimum control height is `44px`.
- Focus uses a visible crimson/pink ring with sufficient contrast.
- Errors appear near the relevant field with text, not color alone.

### Icons

- Prefer simple line icons with consistent `1.5–2px` stroke.
- Use Phosphor or Lucide consistently; do not mix weights casually.
- Do not put every icon in a colored rounded square.

## Technical visual language

Create original diagrams and animation rather than copying Nest artwork.

- Use fine white/gray paths and nodes on the near-black canvas.
- Highlight only the active route in crimson.
- Build visuals from circles, lines, brackets, module frames, code tokens, and subtle point fields.
- Prefer meaningful state transitions: modules connect, requests propagate, dependencies resolve, layers reveal.
- A faint red radial glow may support a focal point, but it must not become a generic gradient orb.
- Decorative visuals should remain subordinate to product meaning.

## Motion

Motion should express system behavior.

- Micro-interactions: `150–200ms`.
- Content entrance: `450–700ms` with small distance and stagger.
- Hero/diagram sequences may be slower, but must settle and permit reading.
- Use scroll motion sparingly to reveal relationships rather than move every object.
- Avoid perpetual animation except for subtle ambient systems.
- Honor `prefers-reduced-motion`; replace spatial sequences with immediate or cross-fade states.
- Never animate basic page text merely to look expensive.

## Responsive behavior

### Desktop, 1200px and above

- Use the full editorial scale and asymmetric compositions.
- Keep content within an approximately `1280px` container while allowing selected visuals to bleed outward.
- Support side-by-side narrative and technical visual layouts.

### Tablet, 768–1199px

- Reduce hero scale and prevent awkward one-word lines.
- Reorder visuals beneath the primary message when horizontal space becomes fragile.
- Collapse complex navigation and simplify high-density diagrams.

### Mobile, below 768px

- Use `44–64px` hero type depending on copy length.
- Keep side gutters around `20px`.
- Stack actions or allow two compact actions only when they fit comfortably.
- Replace wide graphs with focused step sequences or horizontally scrollable, labeled diagrams.
- Preserve the black/white/crimson identity; do not turn mobile into a generic card feed.

## Accessibility contract

- Meet WCAG 2.2 AA contrast for text and controls.
- Every interactive element has hover, focus-visible, active, disabled, and loading states where applicable.
- Focus rings must be visible against both black and white surfaces.
- Use semantic landmarks and a logical heading order.
- Support full keyboard navigation and escape behavior for menus/dialogs.
- Provide alt text for informative diagrams; mark ornamental fields as decorative.
- Never encode meaning with crimson alone.
- Prevent motion, WebGL, or autoplay effects from blocking content or controls.

## Content voice

Write like a technically credible product team:

- concise,
- declarative,
- specific,
- confident without hype,
- centered on architecture, reliability, productivity, and scale.

Prefer “Compose services with explicit module boundaries” over “Supercharge your next-gen workflow.” Use real product terms and real starter code.

## Forbidden defaults

Do not use:

- gradient text,
- glowing blue/purple AI gradients,
- glassmorphism,
- a centered badge + headline + paragraph + CTA boilerplate hero,
- repetitive three-card feature rows,
- Bento grids without content-driven rationale,
- testimonials or metrics invented by the agent,
- large border radii on every surface,
- shadows on static containers,
- a card around every text block,
- stock dashboard styling,
- generic neon cyberpunk effects,
- random red decoration with no semantic role,
- copied NestJS graphics, logos, or copy without explicit permission.

## Starter-page blueprint

Use this structure as a strong default, adapting it to the actual product:

1. **Transparent header** — brand, ecosystem navigation, docs/community link, primary start action.
2. **Editorial hero** — product-specific statement, short proof-oriented copy, two actions maximum, one original technical visual.
3. **Architecture statement** — a large left-aligned claim paired with a real system diagram.
4. **Core capabilities** — varied compositions showing three to five real capabilities; avoid identical cards.
5. **Code-to-system demo** — code on one side, visualized output/architecture on the other.
6. **Ecosystem strip** — real integrations, packages, or community signals with restrained branding.
7. **Closing action** — compact and direct, integrated into the page rather than isolated in a giant rounded box.
8. **Structured footer** — documentation, ecosystem, community, and project links.

## Implementation rules for agents

Before coding:

1. Read the project requirements and existing component system.
2. Write a one-sentence product-specific visual thesis under this broader Nest-like direction.
3. List the real content and user actions required on the page.
4. Choose one product-specific technical motif.
5. Sketch the information hierarchy before choosing components.

While coding:

- Use semantic HTML and reusable product components.
- Keep global tokens centralized.
- Use CSS Grid for major composition and Flexbox for local alignment.
- Make the hero responsive to copy length, not only viewport width.
- Lazy-load expensive 3D/animation work and provide a static fallback.
- Do not add a dependency solely for a trivial animation.
- Preserve Core Web Vitals and avoid layout shift from font/image loading.
- Include realistic content and complete interaction states.

After coding:

1. Render at desktop, tablet, and mobile widths.
2. Verify keyboard navigation and reduced motion.
3. Inspect headline wrapping, spacing rhythm, and button hierarchy.
4. Remove any section that resembles a generic AI/SaaS template.
5. Confirm that crimson remains a signal rather than a blanket treatment.
6. Confirm that the page still feels product-specific when the logo is hidden.

## Acceptance checklist

The page is complete only if all answers are yes:

- Does it immediately read as a dark, technical, Nest-adjacent developer experience?
- Is the identity carried by typography, composition, and technical storytelling—not just red?
- Is the canvas near-black with crisp white hierarchy and controlled crimson accents?
- Are display headings medium-weight, tightly tracked, and editorially composed?
- Is there at least one original, meaningful technical visual?
- Are cards used only when containment has a functional reason?
- Do all controls have accessible interactive states?
- Does mobile preserve the concept rather than merely stack desktop sections?
- Are performance and reduced-motion fallbacks present for rich effects?
- Is all product copy truthful and specific?
- Are official NestJS artwork, logos, and copy excluded unless explicitly authorized?

## Agent invocation

Append the project request below this file and tell the implementation agent:

> Follow `NEST_ECOSYSTEM_DESIGN.md` as the binding art-direction and UI contract. First state the page-specific visual thesis and information hierarchy in five concise bullets. Then implement the page, render it at desktop and mobile widths, inspect the result against the acceptance checklist, and revise obvious generic AI patterns before finishing.

