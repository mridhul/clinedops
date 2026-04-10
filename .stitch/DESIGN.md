# ClinedOps Design System

## 1. Creative North Star: "The Clinical Curator"
A high-end editorial aesthetic for healthcare education. Moves away from generic SaaS dashboards in favor of:
- **Intentional Asymmetry**: Breaking the standard grid for authoritative layouts.
- **Tonal Layering**: Depth through background shifts rather than borders.
- **Expansive White Space**: Surgical clarity.
- **Glassmorphism**: Backdrop blur on floating headers and components.

## 2. Color Palette (Tailwind Tokens)
| Token | Value | Base Color | Purpose |
| :--- | :--- | :--- | :--- |
| `background` | `#f8f9fb` | Slate 50 | Base app background |
| `on-background`| `#2b3438` | slate 900 | Main body text |
| `primary` | `#005db6` | Blue 700 | Primary actions |
| `primary-dim` | `#0051a1` | Blue 800 | Hover states / Gradients |
| `secondary` | `#4f607c` | Slate 600 | Secondary actions |
| `tertiary` | `#00687b` | Teal 700 | Educational callouts |
| `surface-low` | `#f1f4f7` | Slate 100/200 | Section backgrounds |
| `surface-lowest`| `#ffffff` | White | Card backgrounds |
| `surface-highest`| `#dbe4ea` | Slate 300 | Input backgrounds |
| `outline` | `#737c81` | Slate 400 | Subtle accents |
| `error` | `#9f403d` | Red 700 | Critical medical errors |

| `on-surface-variant`| `#5c6367` | Slate 500 | Label / Placeholder text |

## 3. Typography
- **Headlines**: `Manrope` Sans-serif (Geometric, wide apertures).
- **Body & UI**: `Inter` (Tall x-height, legible for clinical data).

## 4. Components Rules
- **Clinical Gradient**: `linear-gradient(135deg, #005db6 0%, #0051a1 100%)`.
- **Inputs**: `rounded-xl`, `border-none`, `bg-surface-highest` (or `surface-container-highest` in design).
- **Buttons**: `rounded-xl`, `clinical-gradient` for primary, `border-outline` for secondary.
- **Navigation**:
- **Cards**: `rounded-xl` (v3.0 standard), no borders, soft ambient shadow (4% opacity).
- **Status Badges**: `rounded-full` (capsule style), colors mapped to success (`tertiary`), error (`red`), pending (`slate`).

## 5. Responsive Strategy
- **Breakpoints**: Standard Tailwind (sm, md, lg, xl).
- **Navigation**:
    - **Desktop**: Fixed Sidebar (`64`) + Glass Header.
    - **Mobile**: Bottom Tab Bar or Burger Menu with Glass Overlay.
- **Layouts**: 3-column desktop becomes vertically stacked on mobile.

## 6. Design System Notes for Stitch (Baton Import)
> Maintain the "Clinical Curator" editorial look. Avoid 1px borders. Use tonal layering (`f1f4f7` on `f8f9fb`). Use `Manrope` for all h1-h3. Use backdrop-blur for headers. Use `#005db6` for primary CTAs.
