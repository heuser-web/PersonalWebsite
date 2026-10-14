# Skill Observation Log

Observations captured during task-oriented work. Each entry identifies a
potential skill improvement or new skill opportunity.

**Status key:** OPEN = not yet actioned | ACTIONED = skill updated/created |
DECLINED = user decided not to pursue

---

## 2026-08-26 — IS101 Personal Website Project (WordPress build kit)

### Observation 1: Headless Chrome writes the artifact then refuses to exit — poll the file, don't wait on the process

**Status:** OPEN
**Date:** 2026-08-26
**Session context:** Generating logo PNGs and resume PDFs for a WordPress project on a Mac with no wkhtmltopdf, rsvg-convert, ImageMagick, cairosvg or PIL. Headless Chrome was the only rasterizer/PDF engine available.
**Skill:** frontend-design
**Type:** open-source
**Phase/Area:** Asset generation without a design toolchain

**Issue:** `chrome --headless=new --screenshot` reliably produced a correct PNG and then never exited, so a plain `subprocess.run(..., timeout=N)` blocked for the full timeout on every single render. A batch of four renders blew a 2-minute command budget twice. A second, subtler failure followed the first fix: polling for "output file exists and is stable" returned instantly against the *previous* run's file, so three renders silently reported success while shipping stale bytes. Byte-identical file sizes across runs were the only tell.

**Suggested improvement:** Add an "offline rasterization" note to the asset-generation guidance: when Chrome is the rendering engine, (a) delete the output path before launching, (b) poll for the artifact reaching a stable size rather than waiting on process exit, (c) kill the process group once stable, and (d) use a throwaway `--user-data-dir` per invocation, because a shared profile lock serializes and then deadlocks concurrent runs.

**Principle:** When a tool's side effect is the real deliverable and its exit is unreliable, treat the artifact as the completion signal — but only after clearing any prior artifact, or the staleness check silently passes and you ship the old output.

### Observation 2: SVG objectBoundingBox gradients vanish on zero-dimension shapes

**Status:** OPEN
**Date:** 2026-08-26
**Session context:** Building a brass-gradient wordmark logo in raw SVG. Hairline rules and a vertical divider used the same `url(#brass)` stroke as the letterforms.

**Skill:** frontend-design
**Type:** open-source
**Phase/Area:** SVG / brand asset construction

**Issue:** The gradient rendered correctly on text and rects but both `<line>` elements disappeared entirely. Cause: `linearGradient` defaults to `gradientUnits="objectBoundingBox"`, and a horizontal or vertical line has a bounding box with zero height or zero width, so the gradient's coordinate space collapses and the paint resolves to nothing. Nothing errors — the stroke just silently does not draw, which reads as "my line is missing" rather than "my paint is invalid."

**Suggested improvement:** Add to the SVG guidance: never apply an objectBoundingBox gradient to a `<line>`, or to any shape that is axis-aligned and flat. Either set `gradientUnits="userSpaceOnUse"` with explicit coordinates, or paint flat rules with a solid color. Flag the symptom explicitly ("stroke silently does not render") because there is no console warning to search for.

**Principle:** Silent-failure rendering bugs need to be documented by symptom, not by cause. The engineer sees "the element is missing" and will never search for "degenerate bounding box".

### Observation 3: Embeddable widgets need class specificity above the host theme's element+attribute selectors

**Status:** OPEN
**Date:** 2026-08-27
**Session context:** Building a self-contained chat widget to be pasted into a WordPress page whose theme also styles form controls globally.
**Skill:** frontend-design
**Type:** open-source
**Phase/Area:** Portable/embeddable component CSS

**Issue:** The widget styled its send button with a single class, `.xlbot__send` (specificity 0,1,0). The host theme styled all submit buttons with `button[type=submit]` (specificity 0,1,1) including `padding:.85rem 1.9rem`. The theme won. Combined with a global `box-sizing:border-box`, the inherited horizontal padding exceeded the button's declared 44px width, collapsing the content box to zero and making the 19px SVG icon invisible. The visible symptom was "a brass ellipse with nothing in it" — which reads as a broken icon, not as a specificity conflict. The text input had the same conflict, silently losing its pill radius to the theme's 8px.

**Suggested improvement:** Add an "embeddable component" rule to the frontend-design guidance: any component intended to be pasted into an unknown host page must (a) scope every control rule as `.root .element` so it clears element+attribute selectors, (b) explicitly reset the properties a host is most likely to set on form controls — `padding`, `margin`, `width`, `min-width`, `border-radius`, `justify-self` — rather than assuming defaults, and (c) be visually verified rendered *inside* the host stylesheet, never in isolation.

**Principle:** A portable component's CSS competes with a stylesheet it has never seen. Defaults are not neutral there — anything left unset is an opening for the host, and the failure surfaces as a visual defect rather than a cascade error.

### Observation 4: Verify responsive breakpoints in a sized iframe, not with headless --window-size

**Status:** OPEN
**Date:** 2026-08-27
**Session context:** Checking the mobile layout of a custom WordPress theme by screenshotting the static preview with headless Chrome at `--window-size=414,1500`.

**Skill:** frontend-design
**Type:** open-source
**Phase/Area:** Responsive visual verification

**Issue:** The capture came back showing a desktop layout cropped to 414px — no hamburger, nav missing, content running off the right edge. It read exactly like a real overflow bug, and I started hunting a CSS fault: checked brace balance, confirmed the `max-width:900px` block was at depth 0, diffed the preview stylesheet against the theme. All correct. The actual cause was that `--window-size` did not produce a 414px *layout* viewport — the page laid out wider and the screenshot simply cropped it. Loading the same page in a `<iframe width="414">` inside a normal-width window rendered the mobile layout perfectly: hamburger present, no overflow, type scaling correctly. Roughly twenty minutes went into debugging CSS that was never broken.

**Suggested improvement:** Add to the visual-verification guidance: to check a breakpoint, embed the page in an iframe of the exact target width and screenshot the host page, rather than resizing the headless window. The iframe establishes a real containing block at that width, so media queries and viewport units resolve the way they would on the device. Reserve `--window-size` for full-page desktop captures. Corollary for diagnosis: when a "responsive bug" shows *desktop* styling at a small size, suspect the harness before the stylesheet — a genuine overflow bug still applies the small-screen rules.

**Principle:** A measurement tool that silently reports the wrong condition is worse than no measurement, because it manufactures a plausible bug. Before debugging what a harness shows you, confirm the harness is reproducing the condition you think it is.

### Observation 5: backdrop-filter on a sticky header traps every position:fixed descendant

**Status:** OPEN
**Date:** 2026-08-27
**Session context:** Driving a custom WordPress theme in a browser after building it. The mobile nav drawer lives inside the sticky site header and is `position:fixed; inset:0 0 0 auto`.

**Skill:** frontend-design
**Type:** open-source
**Phase/Area:** Sticky headers / off-canvas navigation

**Issue:** Clicking the hamburger opened the drawer, but it rendered as a short box clipped to the header's height instead of a full-height panel. Cause: `.rh-header` had `backdrop-filter: saturate(180%) blur(14px)` for a frosted effect, and backdrop-filter — like `transform`, `filter`, `perspective` and `will-change` — makes the element a **containing block for `position:fixed` descendants**. The drawer's `inset:0` therefore resolved against the header box, not the viewport. Nothing errors, and every static screenshot looked perfect because the drawer is only visible once opened.

**Suggested improvement:** Add to the layout guidance: before putting an off-canvas panel, modal, or any `position:fixed` element inside a header/toolbar, check that no ancestor establishes a containing block — `transform`, `filter`, `backdrop-filter`, `perspective`, `contain: paint`, or `will-change` on any of those. Either render the panel as a sibling of the header rather than a child, or drop the offending property at the breakpoint where the panel is used. A quick audit: `getComputedStyle` up the ancestor chain for those six properties.

**Principle:** Several innocuous-looking visual properties silently change positioning semantics. When a fixed element is sized or clipped to an ancestor instead of the viewport, the bug is in the ancestor's paint properties, not in the element's own CSS.

### Observation 6: An HTML comment that documents comment syntax terminates itself

**Status:** OPEN
**Date:** 2026-08-27
**Session context:** A resume HTML file rendered to PDF. An optional Experience section was commented out, with instructions inside the comment telling the reader how to re-enable it.

**Skill:** frontend-design
**Type:** open-source
**Phase/Area:** Template authoring / commented-out blocks

**Issue:** The instruction read: "delete this comment wrapper (the `<!--` and the `-->`)". The literal `-->` inside the comment **closed it early**. Everything after that point — the remaining instructions and the entire placeholder Experience section with `((JOB TITLE))` and `((EMPLOYER))` — rendered as visible content and printed into a graded PDF deliverable. HTML has no comment escaping and no nesting, so this is unavoidable rather than a typo. It survived a full visual QA pass because the leak sat on the part of the page that earlier layout checks had already scrolled past, and only surfaced when the PDF was viewed end-to-end in a browser.

**Suggested improvement:** Add an authoring rule: never write `--` or `-->` inside an HTML comment; describe the markers in words ("delete the comment-opening line above and the comment-closing line below") instead of quoting them. Add a cheap mechanical check to any pipeline that emits HTML — count `<!--` against `-->` per file and flag inequality — and, for anything rendered to PDF, grep the extracted text for known placeholder tokens before shipping.

**Principle:** Documentation written inside a syntax cannot quote that syntax's own delimiters. Any format with unescapable terminators — HTML comments, CDATA, heredocs, fenced code — turns a self-referential explanation into a parse bug, and the failure mode is silent content leakage rather than an error.

### Observation 7: Verify a timed animation with a seek hook, not a virtual clock

**Status:** OPEN
**Date:** 2026-08-27
**Session context:** Building a multi-phase Star Wars-style intro (prelude, logo pull-back, perspective crawl) sequenced by JS timers plus CSS animations, and needing to confirm each phase looked right.

**Skill:** frontend-design
**Type:** open-source
**Phase/Area:** Verifying time-based animation

**Issue:** The obvious approach — headless Chrome with `--virtual-time-budget=8000` — produced a frame with all three phases stacked on top of each other. Virtual time fires every pending `setTimeout` almost immediately, so phases meant to start 0s, 4.3s and 7s apart all began at once and their CSS animations ran concurrently. The capture was not a picture of t=8s; it was a picture of a timeline that had collapsed. Ten minutes went into "fixing" an overlap bug that did not exist. The fix was to add a `?intro=<ms>` hook to the component: instead of running timers, it applies each phase's class with a computed negative `animation-delay` and `animation-play-state: paused`, painting exactly the composite frame that moment would show.

**Suggested improvement:** Add to the visual-verification guidance: to inspect a timed sequence, build a seek hook into the component (negative `animation-delay` + paused play state, driven by a query param) rather than trying to sample a real or virtual clock. It is a few lines, it is deterministic, it survives into production as a debugging aid for whoever maintains the animation, and it makes any single moment reproducible in a screenshot.

**Principle:** Time-based UI needs a scrubber, not a stopwatch. Any verification method that samples a running clock is racing the thing it measures; exposing an explicit seek makes the state addressable instead.

### Observation 8: Glass UI needs a textured backdrop or it is just a white box

**Status:** OPEN
**Date:** 2026-08-27
**Session context:** Applying a `backdrop-filter` glass card treatment to project cards on a personal site.

**Skill:** frontend-design
**Type:** open-source
**Phase/Area:** Glass / translucent surface design

**Issue:** The glass tokens were correct — translucent fill, saturated backdrop blur, inset specular highlight, hairline border — and the rendered result was indistinguishable from a plain white card. The cards sat on a flat white section, so there was nothing behind them to blur or refract. `backdrop-filter` on a uniform background is a no-op by definition. The same components read correctly the moment a soft multi-colour gradient wash was moved behind them. A related trap surfaced in the same build: a WebGL particle layer was invisible because it sat beneath the hero's existing 62-94% opacity vignette, so the effect existed but nothing of it survived to the screen.

**Suggested improvement:** Add a precondition to any glass/translucency guidance: specify the backdrop before the surface. Glass requires variation behind it — a gradient, an image, a canvas, overlapping content. If the section is a flat fill, either add the backdrop or use an opaque card and skip the blur cost entirely. Same check for any decorative layer: after adding it, confirm nothing above it in the stacking order is opaque enough to erase it.

**Principle:** Effects defined by what is behind them are meaningless without a backdrop to act on. Design the layer beneath before styling the layer on top, and verify the stacking order lets the effect reach the screen.

### Observation 9: A media-query override placed before its base rule half-applies

**Status:** OPEN
**Date:** 2026-08-27
**Session context:** Adding a `max-width:640px` block to shrink an intro title and reposition a skip button, inserted programmatically into an existing stylesheet.

**Skill:** frontend-design
**Type:** open-source
**Phase/Area:** CSS cascade / programmatic stylesheet edits

**Issue:** The media block was inserted a few rules above the base `.rh-intro__skip` rule. It set `bottom:auto; top:1.4rem` to move the button; the later base rule re-declared `bottom:2.25rem` but said nothing about `top`. The result was an absolutely-positioned element with BOTH `top` and `bottom` resolved, which stretches it to fill the container — the button rendered as a pill spanning almost the whole viewport height. Media queries add no specificity, so source order alone decided it, and only *half* the override was undone, which is what made the symptom so strange. Brace-balance and syntax checks all passed; nothing was malformed.

**Suggested improvement:** When appending or injecting CSS into an existing file, place responsive overrides **after** the rule they modify, and prefer anchoring the insertion to the end of the relevant section rather than to a nearby selector match. When an override toggles a positioning property to `auto`, set the complementary property explicitly in the same block (`top`/`bottom`, `left`/`right`) so a partially-lost override cannot leave a box constrained on both axes.

**Principle:** Media queries carry no extra specificity, so a "responsive override" earlier in the file is just an earlier declaration. Partial overrides are worse than none: half-applied positioning produces geometry no one wrote.

### Observation 10: An unescaped & in a sed replacement silently duplicates the match

**Status:** OPEN
**Date:** 2026-08-27
**Session context:** A one-line `sed -i '' 's|old|new|'` to swap a tagline in an HTML partial, where the replacement contained HTML entities.

**Skill:** frontend-design
**Type:** open-source
**Phase/Area:** Scripted file edits

**Issue:** The replacement text was `Las Vegas &rarr; Reno &middot; 2026`. In sed, an unescaped `&` in the replacement means "the entire matched text", so each entity expanded into the whole original line. The result was a nested, malformed paragraph containing three copies of the old content. Nothing errored, the file stayed valid-looking, and the corruption only surfaced as garbled overlapping text in a rendered screenshot several steps later. HTML entities make this especially likely, because `&` is the first character of every one of them.

**Suggested improvement:** Add to the tooling guidance: never use `sed` for replacements containing `&`, `\`, or the delimiter — which in practice means never use it for HTML, entities, or URLs with query strings. Use a Python (or equivalent) literal string replace, where the replacement has no metacharacters. If sed is unavoidable, escape `&` as `\&`. Verify any scripted content edit by printing the changed line back, not by trusting a zero exit code.

**Principle:** Replacement strings are not literals in most stream editors. Any tool where the replacement has its own syntax will silently corrupt content that happens to use that syntax — and content-safe replacement is exactly what a general-purpose language does better.

