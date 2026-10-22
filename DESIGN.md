# BugReporter design

Read this before changing UI. Tokens live in `src/app/tokens.css`; global element styles in `src/app/globals.css`.

## World: "the defect tag"

On a factory floor a broken part gets a tag: a flat signal-orange card, a punched hole, a few printed fields filled in by hand, and a severity box ticked. BugReporter is that tag for software. The visual language is Swiss / International Typographic Style printing, limited to two surfaces:

- **The field** (`--field`, signal orange) is the tag. It carries the identity: the reporter's intro column, the triage header band, the sign-in page and the favicon. Only `--field-ink` is printed on it: no secondary ink, no data colour.
- **The paper** (`--paper`) is where work happens: the form, the queue, a report's details. Black ink, one secondary ink, and two meaning colours (`--high`, `--resolved`).

**Mode: Operate.** People come to file a report or work through the queue. Standard controls (radios, inputs, selects, tabs, buttons) stay recognisable; the world contributes type, palette, density and one signature move.

**Signature move: the severity scale.** Severity is drawn as three square cells filled from the left (`■■■` high, `■■□` medium, `■□□` low) next to its word. The scale appears on the form's radio options, every queue row and the report details, so it reads without colour and the same way everywhere. Only "High" also takes the `--high` ink.

## Use scene

The reporter is someone who just hit a problem, often on a laptop in daylight, sometimes on a phone. The maintainer triages at a desk. Both are light-surface scenes, so the product is light only.

## Colour (primary ink ≥8:1, secondary ink ≥7:1, verified with `contrast.py`)

| Token         | Hex       | Use                               | Contrast      |
| ------------- | --------- | --------------------------------- | ------------- |
| `--field`     | `#FF8547` | identity surface                  |               |
| `--field-ink` | `#0E0A07` | all text and rules on the field   | 8.17 on field |
| `--paper`     | `#F5F3EE` | working surface                   |               |
| `--surface`   | `#FFFFFF` | input wells                       |               |
| `--ink`       | `#0E0A07` | primary text, primary button fill | 17.8 on paper |
| `--ink-2`     | `#4A403A` | secondary text, hints, metadata   | 9.1 on paper  |
| `--high`      | `#A3140B` | high severity, errors, delete     | 7.1 on paper  |
| `--resolved`  | `#14532D` | resolved status                   | 8.2 on paper  |

Rules (`--rule`, `--rule-strong`) and the empty severity cell are mixed from ink and paper with `color-mix()`; never hard-code them. The field can't hold two inks at 7:1, so never put `--ink-2`, `--high` or `--resolved` on it.

## Type

- **Schibsted Grotesk** (variable, 400–900), a newspaper grotesque, self-hosted with `@fontsource-variable/schibsted-grotesk`. It is the only voice:
    - Display (`--fs-display`): weight 800, tracking −0.035em, line-height 0.9. The reporter intro and the queue count.
    - Headings: weight 700, sentence case.
    - Body: 400 at 17px, measure ≤70ch.
- **JetBrains Mono** (variable) only for machine values: report references (`BR-3F9A1C`), URLs and version strings.
- Tabular numerals only on bare counts (`.numeric`), never on prose or dates: Schibsted's tabular set also widens the period, comma and colon.
- **Nothing renders below 15px.** The small end is 15 / 16 / 17px. Labels are sentence case. No tracked uppercase eyebrows, no section numbers.

## Grid and space

- 12 columns from 960px. The reporter page puts the field in columns 1–5 (sticky, full height) and the form in 7–12. Below 960px the field becomes a band above the form.
- Triage content is a single measure of up to 1200px: header band, then the queue.
- Space steps on a 4px base (`--s-1` … `--s-9`): tight inside a group, generous between groups, more above a heading than below.

## Shape, depth and motion

- **Rules, not boxes.** A 2px ink rule opens each section; 1px tint rules separate queue rows. No cards.
- Corners are square. Controls get 2px. The only shadow is on the delete confirmation dialog, which floats.
- Motion is limited to 150ms colour/outline transitions on controls, plus a confirmation that slides in once when a report is received. `prefers-reduced-motion` turns both off.
- Focus is a 2px ink outline with a 2px offset, on both surfaces.

## Icon

Icons are authored inline SVG with a single 1.75px stroke in `currentColor` (`src/components/icons.tsx`). The mark and favicon are the tag itself: an orange rectangle with a clipped corner and a punched hole.

## Refuse

Gradients, glass or blur, cards and tiles, stat tiles, eyebrow labels, pill chips, emoji, centred hero blocks, coloured left borders, entrance animations on sections, dark mode by category, and any colour outside the table above.
