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


### Observation 11: Phone photos headed for a public site carry GPS — strip metadata as a pipeline step

**Status:** OPEN
**Date:** 2026-11-10
**Session context:** Adding a student's own phone photos (a party at a residence, a camping trip, a city view) to a personal-website gallery and About page.

**Skill:** New skill candidate: web-image-intake (or an addition to frontend-design)
**Type:** open-source
**Phase/Area:** Asset intake — user-supplied images

**Correction (2026-11-23):** the GPS finding below is unproven. The check searched 200 KB for the byte pair 0x8825 in either order, which matches random data 199 times out of 200. EXIF with make/model/timestamps was real (sips read it); GPS presence was never established and the originals are gone. The strip itself is verified by parsing segments: only APP0/APP2 remain.

**Issue:** All three supplied JPEGs contained an EXIF block with camera make/model and capture timestamps, and (claimed, unproven) a GPS IFD. One was taken at a private residence. Resizing with macOS `sips` does NOT drop EXIF, and Spotlight (`mdls`) reported null coordinates only because the temp files were never indexed — a false all-clear. Reading the JPEG segments directly is the only reliable check. Python had no PIL and there was no exiftool, so the fix was a ~30-line stdlib script that drops APP1/APP3–APP15/COM and keeps APP0 (JFIF) and APP2 (ICC), asserting afterwards that no Exif/XMP header remains.

**Suggested improvement:** For any skill that takes user photos onto the web: (1) check pixel orientation first — stripping EXIF also drops the Orientation tag, so only strip when the pixels are already upright, or bake the rotation in first; (2) resize (long edge ~2000px gallery, ~1200px cards); (3) strip metadata with a byte-level segment filter and assert the result; (4) never trust a metadata indexer's "null" as proof of absence.

**Principle:** A resize step is not a privacy step. Every publish pipeline for user photos needs an explicit, verified metadata strip, because the dangerous field (location) is invisible in the image and survives most common image tools.

### Observation 12: "Add these to my gallery" needs a provenance screen when the gallery is graded on ownership

**Status:** OPEN
**Date:** 2026-11-10
**Session context:** A student sent five images to add to a personal-site gallery whose grading rubric requires the photos to be their own.

**Skill:** New skill candidate: web-image-intake (pairs with Observation 11)
**Type:** open-source
**Phase/Area:** Asset intake — user-supplied images

**Issue:** Two of the five were plainly not the user's photographs: a flat Greek-letter organization graphic and a generic "code on a monitor" stock-style image (52 KB, no camera EXIF, the other three had iPhone/smart-glasses EXIF). Following the instruction literally would have put a copyright problem on the one page graded on ownership. The user's stated intent (show membership + show love of web design) could be met without them: one of their own photos already showed the organization's flag and banner, and the web-design interest went into About Me copy.

**Suggested improvement:** When ingesting user images for a page with an ownership/copyright requirement, screen each one: camera EXIF present? photographic vs flat graphic? tiny file size typical of a web download? Exclude likely-downloaded images by default, say so plainly, and meet the user's underlying intent another way (their own photo that shows the same thing, or copy). Also check images that ARE theirs for things a professional page may not want: identifiable bystanders, alcohol, or a photographer who is someone else — flag, don't silently drop.

**Principle:** Read an asset request against the constraint it will be judged by, not just the instruction. Camera metadata is useful evidence twice: once to prove provenance, then it must be stripped before publishing.

### Observation 13: "Cleaner" is not permission to switch off a feature the user built

**Status:** OPEN
**Date:** 2026-11-23
**Session context:** A "make it cleaner and more professional" pass on a personal site, followed by "restart the dev server, make sure animation is visible".

**Skill:** frontend-design
**Type:** open-source
**Phase/Area:** Redesign scope; motion verification

**Issue:** The clean-up pass turned a signature opening animation off by default and dropped it from the preview, on taste. Every screenshot in that pass used reduced-motion emulation, so the removal and two older bugs went unseen: a replay function that was called but never defined, and a WebGL layer rendered at roughly alpha cubed because blendFunc(SRC_ALPHA, ONE) was paired with premultipliedAlpha:false. A real-time DevTools-protocol run (normal motion, wall clock, frame hashes, console errors) found all of it in one go.

**Suggested improvement:** Under "polish", keep signature features on and propose removals as a question. After any visual change, do one pass with motion ENABLED: capture frames at real times, assert consecutive frames differ, click the controls, and collect console errors. For additive WebGL on a transparent canvas use premultipliedAlpha:true with blendFuncSeparate(SRC_ALPHA, ONE, ONE, ONE).

**Principle:** A verification mode that disables a feature cannot verify it. "Running" is not "visible"; look at the pixels.

### Observation 14: "Verified in a fresh browser" does not cover a visitor who has already seen it

**Status:** OPEN
**Date:** 2026-11-23
**Session context:** A once-per-session intro animation passed a clean-profile real-time test, yet the user reported twice that it never played.

**Skill:** frontend-design
**Type:** open-source
**Phase/Area:** Verification of gated or stateful effects

**Issue:** The test always started from an empty browser profile, so the "already seen" gate (sessionStorage) was never exercised on a reload. The user, iterating in one tab, hit it every time. Two further hazards were also invisible to a clean-profile test: heuristic HTTP caching of unstamped JS/CSS after rebuilds, and a skip-on-scroll handler that a resting trackpad can trigger.

**Suggested improvement:** For any effect that is conditional (once per session/visit, first-run, seen flags), test the full state matrix with real navigation: fresh open, reload, in-site link, back/forward, forced override. Stamp asset URLs with a version or mtime in dev builds. Make dismiss-on-scroll require deliberate travel and a grace period. Give the owner a forced-replay URL parameter.

**Principle:** A gate that is correct for the visitor is a bug for the developer iterating on the page. Test the states the user will actually be in, and when a user says it is not working, suspect your own gating before their environment.

### Observation 15: A linked reference video must be watched frame by frame before planning from it

**Status:** OPEN
**Date:** 2026-11-23
**Session context:** User linked a short-form social video and asked for a plan to make their site animated "like this".

**Skill:** New skill candidate: video-reference-teardown
**Type:** open-source
**Phase/Area:** Intake of visual references

**Issue:** The caption and page metadata only contained marketing copy ("cinematic scrolls, 3D experiences"), which would have produced a generic parallax plan. The actual frames showed something specific: an ink-hatched graphic novel with press-and-hold interactions, a visitor choice whose color carries through the rest of the story, line-work wipes between scenes, and inset panels at a different parallax. No ffmpeg or yt-dlp was installed. What worked: resolve the short link, read the page's embedded JSON for duration and play address, fetch with the page's cookies, then a ~40-line AVFoundation Swift tool that samples every 0.5s into timestamped 5x2 contact sheets (47 frames in 5 images, readable in one pass). Reading the in-frame captions also identified the featured site, which the caption never named. A separate pre-plan check found the AI art tool had zero credits, which would have invalidated an art-generation-based plan.

**Suggested improvement:** For any "make it like this video" request: (1) get frames, not just the caption; (2) list the mechanics separately from the look, because mechanics transfer and the look should not be copied; (3) map each mechanic to the user's own material; (4) check budget and tool availability before proposing an asset pipeline.

**Principle:** A reference is only useful at the level of detail you actually observed. Separate the transferable mechanic from the borrowed style, and confirm the plan's inputs exist before proposing it.

### Observation 16: Scroll-driven 3D reads as designed when line density is solved in screen space

**Status:** OPEN
**Date:** 2026-11-23
**Session context:** Built a nine-scene scroll-driven WebGL home page in one day, all geometry in code, engraved-line look.

**Skill:** 3d-web-experience
**Type:** open-source
**Phase/Area:** Scroll-Driven 3D; Model Pipeline

**Issue:** The skill covers libraries and GLB pipelines but nothing for a no-assets build, which is what a same-day deadline with zero art budget needs. What worked: (1) one continuous world on a road curve with a distance parameter, camera keyframes that are either car-relative or anchored to a place, and monotone scroll-to-distance easing so the subject slows at stops; (2) CSS sticky for pinning instead of a scroll library, so native scroll is never hijacked; (3) an engraving shader whose hatch density is chosen from fwidth() in octaves and cross-faded, which fixed both coarse bands up close and moire far away in one change; (4) a single point cloud with several "home" positions, reused as galaxy, city lights, sky and title; (5) always-on motion from three sources (scroll, idle, pointer), then asserted by a script that hashes frames at 41 scroll stops.

**Suggested improvement:** Add a "no-asset scroll world" pattern with those five parts and the screen-space hatch snippet. Add a verification step: real-time browser, motion on, frame-hash at idle and between stops, plus hold/keyboard/touch/reduced-motion checks.

**Principle:** A strict rendering rule (tone = line thickness at constant screen density) makes simple geometry look authored. Put the art direction in the shader, not the models.

### Observation 17: Own-element clip-path can stop IntersectionObserver from ever firing

**Status:** OPEN
**Date:** 2026-11-23
**Session context:** Caption cards revealed with clip-path never appeared, and no error was logged.

**Skill:** New skill candidate: web-motion-gotchas (or frontend-design)
**Type:** open-source
**Phase/Area:** Scroll reveals

**Issue:** Cards started at clip-path: inset(0 100% 0 0) and waited for IntersectionObserver to add the reveal class. They never became visible; changing the start to 94% (leaving a sliver) fixed it. Two more traps hit in the same build: a transform-based centering (translate: -50%) was overwritten by the reveal's own translate, and classList.toggle(name, undefined) toggles instead of removing. Separately, WordPress Playground CLI (npm) ran the theme in a real WordPress on a machine with no PHP, closing a verification gap that had been noted as open.

**Suggested improvement:** Never start an observed element fully clipped; observe a wrapper or leave a sliver. Check reveal transforms against existing transforms. Coerce the second argument of toggle(). For WordPress themes without local PHP, use wp-playground server with a mount and a blueprint before shipping.

**Principle:** An observer waiting on visibility must not be given an element that its own start state makes invisible.
