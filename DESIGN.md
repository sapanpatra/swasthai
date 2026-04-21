# Design System Documentation: The Grounded Luminary

## 1. Overview & Creative North Star
This design system is built upon the Creative North Star of **"The Grounded Luminary."** In a rural health context, digital interfaces often feel alien or overly clinical. Our mission is to bridge the gap between advanced medical reliability and the approachable warmth of a community health worker. 

We reject the "utility-only" aesthetic. Instead, we embrace **High-End Editorial Clarity**. This means moving away from claustrophobic grids and 1px borders toward a layout that breathes. We use intentional asymmetry, generous white space, and high-contrast typography to guide the eye effortlessly. The goal is a "premium-essential" experience: a UI that feels expensive and trustworthy, yet remains instinctively usable for someone navigating a smartphone in a rural setting.

---

## 2. Colors & Tonal Depth
We utilize a palette of "Trustworthy Blues" and "Empathetic Greens" to establish a calm, authoritative environment. 

### The "No-Line" Rule
Standard UI relies on thin grey lines to separate content. This system **prohibits 1px solid borders** for sectioning. Boundaries must be defined solely through background color shifts. For example, a card (using `surface_container_low`) should sit on the main `background` without a stroke. This creates a softer, more modern interface that feels unified rather than fragmented.

### Surface Hierarchy & Nesting
The UI is a series of physical layers. Use the following hierarchy to define importance:
- **Level 0 (Base):** `surface` (#faf9fa) for the main canvas.
- **Level 1 (Sections):** `surface_container_low` (#f4f3f4) to group related content.
- **Level 2 (Interactive Cards):** `surface_container_lowest` (#ffffff) to make actionable items "pop" against the background.

### The Glass & Gradient Rule
To prevent the app from looking "flat" or "budget," use subtle gradients on primary actions. A linear gradient from `primary` (#0040a1) to `primary_container` (#0056d2) adds a tactile "soul" to buttons. For overlays or floating navigation, use **Glassmorphism**: semi-transparent `surface` colors with a 20px backdrop blur to maintain context of the layer beneath.

---

## 3. Typography
We utilize **Public Sans** (and Noto Sans for Hindi support) to ensure every character is legible under varying light conditions (e.g., bright outdoor sun).

- **Display Scale (`display-lg` to `display-sm`):** Reserved for high-impact health statuses or critical numbers. Use these sparingly to create an editorial feel.
- **Headline & Title Scale:** Used for section headers. We use `headline-md` (1.75rem) to provide a clear entry point for every page.
- **Body Scale:** The workhorse. `body-lg` (1rem) is our default for descriptions to ensure accessibility for older users or those with visual impairments.
- **Intentional Hierarchy:** Contrast is our primary tool. A `display-md` headline next to a `body-md` caption creates a sophisticated, high-end editorial rhythm that standard "medium-sized" UI lacks.

---

## 4. Elevation & Depth
Depth is achieved through **Tonal Layering** rather than traditional drop shadows.

- **The Layering Principle:** Stack `surface_container` tiers to create lift. A `surface_container_highest` element on a `surface` background creates a natural focal point without visual clutter.
- **Ambient Shadows:** Shadows should be almost invisible. Use a 15% opacity of the `on_surface` color with a 32px blur and 8px offset. This mimics natural light rather than a digital effect.
- **The "Ghost Border" Fallback:** If accessibility testing requires a boundary, use a "Ghost Border": the `outline_variant` token at **15% opacity**. Never use 100% opaque outlines.

---

## 5. Components

### Buttons & Navigation
- **Primary Action:** Large, rounded-xl (1.5rem) containers using the `primary` to `primary_container` gradient. Labels use `title-md` for maximum legibility.
- **Secondary Action:** `secondary_container` (#aeeecb) with `on_secondary_container` text. These are calming and used for "Save" or "Next" actions.
- **Tertiary/Ghost:** No background, just `primary` text. Use these for "Cancel" or "Back."

### Cards & Lists
- **The Divider Ban:** Do not use lines between list items. Use 16px of vertical spacing and subtle background shifts.
- **Health Metric Cards:** Use `surface_container_lowest` (#ffffff) with a 4px left-accent bar of `primary` or `secondary` to denote category.

### Input Fields
- **Simplified Forms:** Inputs should use `surface_container_high` backgrounds with a `title-sm` label placed *above* the field, never inside as placeholder text. This ensures the user never loses context.
- **Error States:** Use `error_container` (#ffdad6) for the field background with `on_error_container` text. High contrast is vital here for urgency.

### Context-Specific Components
- **Severity Badges:** High-contrast pills using `tertiary_container` for warnings.
- **Instructional Hero:** A large, `surface_container_low` area at the top of forms containing a simple icon and `body-lg` text to "guide" the user through the process.

---

## 6. Do’s and Don’ts

### Do:
- **Use "Breathing Room":** If a screen feels crowded, increase the spacing between sections using the `xl` (1.5rem) scale.
- **Prioritize Hindi Legibility:** Ensure line heights for Noto Sans are 1.4x–1.6x the font size to prevent clipping of vowel marks.
- **Layer Surfaces:** Use `surface_dim` for background areas you want the user to ignore, and `surface_bright` for areas you want them to focus on.

### Don't:
- **Don't use 1px lines:** Ever. Use color blocks or space to separate ideas.
- **Don't use "Pure Black":** Use `on_surface` (#1a1c1d) for text to maintain a premium, softer look.
- **Don't use small targets:** All interactive elements (buttons, chips, checkboxes) must have a minimum touch target of 48x48dp, even if the visual element is smaller.
- **Don't use generic shadows:** Avoid the "dirty" look of grey shadows; always tint them with the surface color.