# Design System Specification: The Clinical Editorial

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Clinical Curator."** 

In healthcare education, information density is a requirement, but cognitive overload is the enemy. This system moves away from the "generic SaaS dashboard" look by embracing a high-end editorial aesthetic. We treat medical data with the same prestige as a luxury architectural journal. 

By leveraging **intentional asymmetry**, **tonal layering**, and **expansive white space**, we transform clinical data into a legible, authoritative experience. We break the "template" feel by shunning traditional borders in favor of background-driven hierarchy and sophisticated typography scales that guide the eye without the need for visual "clutter."

---

## 2. Colors & Surface Architecture
Our palette is rooted in "Trustworthy Blues" and "Clinical Whites," but the execution is purely modern.

### The "No-Line" Rule
**Borders are a legacy constraint.** In this system, 1px solid lines for sectioning are strictly prohibited. Boundaries between content areas must be defined exclusively through background color shifts or subtle tonal transitions. 
*   *Implementation:* Use `surface-container-low` for a sidebar sitting on a `background` main stage. Use `surface-container-highest` to draw focus to a specific interactive utility.

### Surface Hierarchy & Nesting
Think of the UI as a series of physical layers—like stacked sheets of fine medical vellum.
*   **Level 0 (Base):** `surface` (#f8f9fb)
*   **Level 1 (Sections):** `surface-container-low` (#f1f4f7)
*   **Level 2 (Cards/Modules):** `surface-container-lowest` (#ffffff)
*   **Level 3 (Popovers/Modals):** `surface-bright` (#f8f9fb) with Glassmorphism.

### The "Glass & Gradient" Rule
To prevent a "flat" or "cheap" feel, use **Glassmorphism** for floating elements (Header bars, floating action buttons). 
*   *Technical:* Use `surface` at 80% opacity with a `backdrop-blur` of 12px to 20px. 
*   *Signature Textures:* Primary CTAs should not be flat. Apply a subtle linear gradient from `primary` (#005db6) to `primary_dim` (#0051a1) at a 135-degree angle to provide a "lit" appearance.

---

## 3. Typography
We use a dual-typeface strategy to balance "Authority" with "Utility."

*   **Display & Headlines (Manrope):** A modern, geometric sans-serif used for high-level information. Its wide apertures and clean structure feel surgical and contemporary.
    *   *Headline-LG:* 2rem — Used for module titles and page headers.
*   **Body & UI (Inter):** A workhorse for legibility. Its tall x-height makes dense clinical data (like drug names or dosages) incredibly easy to scan.
    *   *Body-MD:* 0.875rem — The standard for data tables and form labels.
    *   *Label-SM:* 0.6875rem — Used for metadata and status badges, always in semi-bold for clarity.

---

## 4. Elevation & Depth
We convey importance through **Tonal Layering** rather than structural lines.

### The Layering Principle
Depth is achieved by "stacking" surface tiers. To make a card pop, place a `surface-container-lowest` (#ffffff) element on top of a `surface-container-low` (#f1f4f7) background. This creates a soft, natural lift that mimics high-quality paper.

### Ambient Shadows
Shadows must be invisible until noticed.
*   **Standard Lift:** `0px 10px 30px rgba(43, 52, 56, 0.05)` (A 5% tint of `on_surface`).
*   **Floating Elements:** `0px 20px 50px rgba(43, 52, 56, 0.08)`.
*   *Constraint:* Never use pure black (#000) for shadows. Always tint the shadow with the `on_surface` color to maintain a clinical, airy feel.

### The "Ghost Border" Fallback
If a border is required for accessibility (e.g., input fields), use a **Ghost Border**: `outline-variant` at 20% opacity. Forbid 100% opaque borders.

---

## 5. Components

### Data Tables (The Clinical Ledger)
*   **Layout:** Strictly forbid divider lines. Use `0.9rem` (spacing scale 4) of vertical padding between rows.
*   **Zebra Striping:** Use `surface-container-low` for alternating rows only if the data exceeds 15 columns.
*   **Header:** `label-md` uppercase, using `on_surface_variant` (#586065).

### Buttons & Inputs
*   **Primary Button:** Gradient-filled (`primary` to `primary_dim`), `rounded-md` (0.375rem). No shadow on rest; subtle lift on hover.
*   **Input Fields:** Background: `surface-container-highest` (#dbe4ea). On focus, transition to `surface-container-lowest` (#ffffff) with a 2px `primary` ghost-border.

### Status Badges (Clinical Indicators)
*   **Success:** `tertiary_container` background with `on_tertiary_container` text.
*   **Critical:** `error` background (#9f403d) with `on_error` text.
*   **Shape:** Use `rounded-full` (9999px) for status indicators to contrast against the `md` roundedness of the main UI.

### Clinical Dashboards
*   **The "Asymmetric Hero":** Instead of a 3-column grid, use a 60/40 split. Place the most critical diagnostic data in a large `surface-container-lowest` card on the left, with supplementary "Clinical Notes" in a `surface-transparent` column on the right.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use `spacing-10` (2.25rem) or `spacing-12` (2.75rem) to separate major sections. Air is the "border" of this system.
*   **Do** use "Type-First" hierarchy. Make the headline larger rather than the box bolder.
*   **Do** use `tertiary` (#00687b) for educational callouts (e.g., "Pro-Tip" or "Medical Insight") to distinguish them from standard clinical data.

### Don't:
*   **Don't** use 1px solid dividers to separate list items. Use white space (`spacing-3`).
*   **Don't** use "Alert Red" for anything other than critical medical errors. For non-critical alerts, use `secondary` (#4f607c) to maintain a calm atmosphere.
*   **Don't** use pure white backgrounds for the entire app. Use `surface` (#f8f9fb) as the base to reduce eye strain during long study sessions.