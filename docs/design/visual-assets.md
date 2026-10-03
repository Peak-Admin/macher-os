# Handwerk OS — Visual Asset & Image Language Specification
**Purpose:** Canonical context for Claude Code when designing or implementing visual elements in Handwerk OS / Handwerker OS.

> **Stand Oktober 2026:** In der Software (`src/os`) ersetzen Fenster-Skizzen – Drahtgitter-Fenster mit Glas-Icon – die
> Objektfotos (Türen, Widget-Köpfe, Leerzustände; `SkizzenKachel`, `Leer`). Die Objektfotos dieser Spezifikation gelten
> weiter für die Website. Regeln: `docs/design/festlegungen.md` („Fenster-Skizze“).

---

## 1. Core Principle

Handwerk OS is software for tradespeople and craft businesses.

The target user is often **anti-IT**, does not want to learn software, and should understand the interface almost immediately.

Therefore:

> **The software should feel like a digital toolbox — not like enterprise software.**

The visual language should use familiar objects, materials and metaphors from the real world of tradespeople.

The interface itself stays:
- simple
- elegant
- calm
- modern
- high quality
- obvious
- low cognitive load
- mobile-friendly
- usable by non-technical users

Visual assets should make the product easier to understand and more emotionally familiar — **not more decorative or complex**.

---

# 2. Central Visual Metaphor

## “Das digitale Werkzeug”

Use the following mental model across Handwerk OS:

| Software concept | Visual metaphor |
|---|---|
| Apps / Modules | Tools |
| Home | Workbench |
| App collection | Tool wall / toolbox |
| Onboarding | Packing / setting up the toolbox |
| Setup | Setting up the workshop |
| Tasks | Jobs to be done |
| Projects | Job sites / work orders |
| Automations | Something that runs by itself |
| AI | Digital office assistant / office worker |
| Settings | Wrench / adjustment |
| Help | Toolbox / helping hand |
| Progress | Ladder / build progress |

This metaphor should remain subtle.

Do **not** turn the software into a game, cartoon or literal workshop simulation.

---

# 3. Canonical Core Asset Library

These are the preferred visual objects for Handwerk OS.

## Tier 1 — Primary Assets

These objects are broadly understandable across many trades and should form the main visual vocabulary.

| Asset | Meaning / Use | Priority |
|---|---|---:|
| Hammer | Work, doing, completing | 100 |
| Folding ruler / Zollstock | Planning, measuring, calculation | 100 |
| Carpenter pencil | Notes, planning, quote | 99 |
| Toolbox | Apps, modules, services | 99 |
| Cordless drill / Akkuschrauber | Execution, productivity | 99 |
| Wrench | Settings, maintenance | 98 |
| Spirit level / Wasserwaage | Quality, checking, alignment | 97 |
| Screwdriver | Setup, configuration | 96 |
| Brick | Project, construction, building | 96 |
| Safety vest | Employees, job site, field work | 95 |
| Ladder | Progress, next step | 94 |
| Clipboard / work order | Job, checklist, order | 94 |
| Saw | Execution, workshop | 93 |
| Work gloves | Employees, work, protection | 92 |
| Work boots | Field work, job site | 92 |
| Key ring | Property, handover, vehicle, access | 91 |
| Material box | Inventory, warehouse, materials | 91 |
| Construction plan / blueprint | Documents, planning | 91 |
| Cable reel | Electrical / job site | 88 |
| Tool wall | Overview, app collection | 88 |

---

# 4. Secondary Everyday Assets

These objects are useful because they feel authentic to actual working life.

Use them selectively.

- construction helmet
- job-site radio
- thermos flask
- coffee mug
- delivery note
- clipboard
- rolled blueprint
- extension cable
- tool bag
- measuring tape
- laser measuring device
- cutter knife
- sealant gun
- material crate
- Euro pallet
- van key
- invoice sheet
- marker pen
- masking tape
- screws
- nuts
- bolts
- hooks
- labels
- storage bins

Especially strong combinations:

> Coffee mug + folding ruler + blueprint + carpenter pencil

This feels like real tradesperson everyday life without becoming kitschy.

---

# 5. Machines & Power Tools

Use machines sparingly because they dominate visually.

Preferred:

- cordless drill
- drill
- circular saw
- angle grinder
- jigsaw
- compressor
- construction laser
- multimeter
- pipe wrench

The **cordless drill** is one of the strongest hero objects besides the hammer.

---

# 6. Material World

Handwerk OS should have a consistent physical material language.

Preferred materials:

- warm workbench wood
- multiplex plywood
- OSB
- brushed steel
- galvanized metal
- concrete
- brick
- tool steel
- leather
- durable workwear fabric
- cardboard
- blueprint paper
- masking tape
- pencil markings

These can be used for:

- subtle card backgrounds
- empty states
- section illustrations
- decorative separators
- onboarding visuals
- app/module covers
- marketing hero visuals
- small depth layers behind cards

## Important

The base UI must remain clean.

Materials should be subtle accents, not full-screen texture noise.

---

# 7. Module-to-Asset Mapping

Claude should use this mapping as the default visual association.

| Area / Module | Preferred Visual Asset |
|---|---|
| Home | Workbench |
| Jobs / Aufträge | Clipboard + carpenter pencil |
| Projects | Blueprint + work order |
| Quotes / Angebote | Folding ruler + paper |
| Calendar | Job-site calendar / marker |
| Customers | Key ring or subtle handshake |
| Employees | Work gloves + helmet |
| Time Tracking | Robust watch / time card |
| Materials | Material crate |
| Warehouse / Lager | Shelf + labeled storage bins |
| Vehicles | Van key |
| Documents | Rolled blueprint |
| Invoices | Invoice sheet on workbench |
| AI Office Assistant | Phone + notepad + pencil |
| Automations | Tool/process running on its own |
| Settings | Wrench |
| Help & Support | Toolbox |
| Onboarding | Open toolbox |
| News | Job-site newspaper / note sheet |
| Vacation | Work boots / calendar |
| Training | Tool manual / blueprint |
| Tasks | Hammer / clipboard |
| Quality | Spirit level |
| Measurements | Folding ruler / laser measure |

The mapping can be adapted when a more intuitive object exists for a specific trade.

---

# 8. Visual Style

## Desired Look

Assets should feel:

- premium
- realistic
- tactile
- modern
- slightly editorial
- authentic
- calm
- familiar
- professional

Preferred rendering:

> Single object, isolated, soft natural studio light, realistic materials, slight signs of real use, no excessive dirt, transparent background where possible.

Recommended asset formats:
- AVIF preferred for production web assets
- WebP acceptable
- PNG only when transparency or pipeline constraints require it
- SVG for simple icons

---

# 9. What to Avoid

Do **not** use:

- generic SaaS gradients
- neon AI aesthetics
- futuristic holograms
- excessive glassmorphism
- cartoon construction workers
- playful children's illustrations
- rustic “old workshop” clichés
- dirty or unsafe-looking job sites
- random stock photography
- visually crowded backgrounds
- dozens of tiny decorative tools
- overly literal skeuomorphic UI
- complex metaphors users need to interpret

Handwerk OS should never look like:

> “Software trying to look like a construction site.”

It should look like:

> “A modern operating system that understands how tradespeople think.”

---

# 10. UX Rule: Visuals Must Support Understanding

Every image or object needs a reason.

Before adding a visual asset, ask:

1. Does this help the user understand the function faster?
2. Does this create familiarity?
3. Does it improve orientation?
4. Does it reduce text?
5. Does it make the product feel more relevant to tradespeople?

If the answer is no, do not add it.

---

# 11. Density Rule

Handwerk OS should prefer:

> **one strong visual object over five weak decorative elements.**

Recommended:

- 1 hero object per major screen
- 1 small visual cue per important card
- simple icons for repeated navigation
- no unnecessary decoration inside dense workflows

Functional areas such as:
- invoices
- tables
- CRM lists
- job lists
- calendar
- forms

should remain primarily functional.

---

# 12. Home Screen Application

The Home Screen may visually combine only a few strong widgets.

Possible widgets:

- Onboarding / First Steps
- Mission Mittelstand Contact
- Recent / Active Projects
- News
- Help & Support
- Vacation Tasks
- Set Up AI Office Assistant

Use object imagery selectively.

Example:

### Onboarding
Open toolbox with a few tools already placed inside.

### Active Projects
Clipboard or blueprint.

### AI Office Assistant
Desk phone + notepad + carpenter pencil.

### Help
Toolbox.

### News
Paper note / small bulletin visual.

Do not create a separate huge illustration for every widget.

---

# 13. Trade-Specific Variants

The system should later support different trades without changing the core UI.

Examples:

## Electrician
- cable reel
- multimeter
- insulated screwdriver
- wire
- electrical plan

## Plumber / HVAC
- pipe wrench
- copper pipe
- fitting
- valve
- pressure gauge

## Carpenter
- wood
- saw
- folding ruler
- carpenter pencil
- clamp

## Painter
- paint roller
- brush
- masking tape
- paint bucket

## Roofer
- roofing hammer
- roof tile
- safety rope

## Mason
- trowel
- brick
- mortar bucket

Core UX stays the same.

Only the visual accent layer may change.

---

# 14. Icon System

Navigation icons should remain minimal and instantly recognizable.

Do not replace every icon with a photo.

Use:

- simple line icons for functional navigation
- realistic / 3D object assets for hero moments and selected cards

Recommended split:

### Functional UI
Lucide-style minimal icons.

### Emotional / visual layer
Realistic isolated craft objects.

This keeps the interface elegant.

---

# 15. Asset Component Architecture

Where possible, implement a reusable asset system.

Example conceptual structure:

```ts
type MacherVisualAsset =
  | "hammer"
  | "folding-ruler"
  | "carpenter-pencil"
  | "toolbox"
  | "cordless-drill"
  | "wrench"
  | "spirit-level"
  | "work-gloves"
  | "clipboard"
  | "blueprint"
  | "key-ring"
  | "material-crate"
  | "cable-reel"
  | "construction-helmet"
  | "coffee-mug"
  | "workbench";
```

Possible component:

```tsx
<MacherAsset
  asset="folding-ruler"
  size="md"
  treatment="isolated"
  decorative
/>
```

Do not hardcode images individually across screens if a reusable system is practical.

---

# 16. Accessibility

Decorative assets:

```html
alt=""
```

or equivalent decorative semantics.

Functional images must have concise meaningful alternative text.

Never rely on an object image alone to communicate critical information.

Text labels and familiar UI patterns remain primary.

---

# 17. Performance

Visual assets must not make Handwerk OS feel slow.

Rules:

- AVIF preferred
- responsive image sizes
- lazy-load below-the-fold visuals
- preload only true hero assets
- avoid massive transparent PNGs
- keep decorative images optimized
- avoid unnecessary animation

The product should feel instant, especially on mobile devices and job-site connections.

---

# 18. Motion

Motion may be used very subtly.

Good examples:

- toolbox lid opening during onboarding
- checkmark appearing after completing a step
- tool shifting slightly when a task is completed
- AI office assistant visual becoming active

Avoid:

- constant movement
- bouncing icons
- gamified animations
- long transitions
- distracting 3D scenes

---

# 19. Canonical Starter Asset Pack

The first production asset library should contain:

1. Hammer
2. Folding ruler / Zollstock
3. Carpenter pencil
4. Cordless drill
5. Toolbox
6. Spirit level
7. Work gloves
8. Key ring
9. Clipboard
10. Blueprint
11. Wrench
12. Material crate
13. Cable reel
14. Construction helmet
15. Coffee mug
16. Workbench

This pack is sufficient to establish the Handwerk OS visual identity.

---

# 20. Overall Design Principle

The user should never think:

> “This is clever software.”

The desired reaction is:

> “Ah, klar. So funktioniert das.”

Handwerk OS should translate software concepts into familiar real-world concepts whenever this makes the interface easier.

The product remains:

**simple first · obvious first · useful first · visual second**

Visual identity supports usability.

It must never compete with it.

---

# 21. Canonical Claude Code Instruction

When implementing or redesigning Handwerk OS screens:

> Use the Handwerk OS visual language defined in this document. Prefer familiar trade objects and physical metaphors over abstract SaaS visuals. Keep interfaces extremely simple, elegant and obvious for non-technical tradespeople. Use realistic craft assets as a restrained visual layer, while functional UI remains clean and minimal. Never introduce visual complexity merely to make the product look more “designed.” Every visual element must support comprehension, orientation or familiarity.

This document is the canonical baseline for visual assets in Handwerk OS.
