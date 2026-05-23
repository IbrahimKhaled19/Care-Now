---
name: Care Now
description: Healthcare operations dashboard for clinic administrators
colors:
  deep-teal: "#35a29f"
  ocean-navy: "#071952"
  coastal-dark: "#0b686a"
  seafoam: "#3a929f"
  mint-mist: "#f5fffd"
  warm-gray: "#919191"
  success-green: "#27cb59"
  error-red: "#ff0000"
  surface-white: "#ffffff"
  border-light: "#e9e9e9"
typography:
  display:
    fontFamily: "Poppins, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.4
  headline:
    fontFamily: "Poppins, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.4
  title:
    fontFamily: "Poppins, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Poppins, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Poppins, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.05em"
    textTransform: uppercase
rounded:
  sm: "8px"
  md: "12px"
  lg: "20px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.deep-teal}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.coastal-dark}"
  card:
    backgroundColor: "{colors.surface-white}"
    rounded: "{rounded.md}"
    padding: "16px"
  input:
    backgroundColor: "{colors.surface-white}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  sidebar:
    backgroundColor: "{colors.mint-mist}"
    padding: "16px"
---

# Design System: Care Now

## 1. Overview

**Creative North Star: "The Clinical Workspace"**

Care Now's design system embodies clean precision with no noise. Every element earns its place. The interface feels like a well-organized clinical workspace: calm, efficient, and trustworthy. Information is presented with clarity; decorative elements are eliminated.

This system explicitly rejects the cluttered, outdated aesthetics of legacy EHR systems (Epic, Cerner). Where legacy healthcare software overwhelms with information density and visual noise, Care Now offers breathing room and purposeful hierarchy.

**Key Characteristics:**
- Precision over decoration: every pixel serves a function
- Calm confidence: the interface doesn't shout, it informs
- Tonal depth: color layering replaces shadows for hierarchy
- Generous spacing: breathing room reduces cognitive load
- Consistent rhythm: predictable patterns build user confidence

## 2. Colors: The Coastal Palette

A restrained palette anchored in deep teal, with ocean navy for authority and mint tones for calm. Nature-inspired names reflect the brand's connection to care and wellness.

### Primary
- **Deep Teal** (#35a29f): The signature color. Used for primary actions, active states, and key interactive elements. Appears on buttons, links, and focus indicators.

### Secondary
- **Ocean Navy** (#071952): Authority and trust. Used for headings, sidebar branding, and high-emphasis text. Reserved for moments that need gravitas.

### Tertiary
- **Seafoam** (#3a929f): Softer accent for secondary actions, hover states, and subtle highlights. Bridges the gap between teal and navy.
- **Coastal Dark** (#0b686a): Deep teal variant for hover states on primary elements. Adds depth without introducing new hues.

### Neutral
- **Warm Gray** (#919191): Body text, secondary labels, and placeholder content. Tinted toward teal for warmth.
- **Border Light** (#e9e9e9): Dividers, card borders, and subtle structural elements.
- **Surface White** (#ffffff): Card backgrounds, input fields, and content surfaces.
- **Mint Mist** (#f5fffd): Page background, sidebar, and subtle container fills. A barely-there tint that softens the white.

### Semantic
- **Success Green** (#27cb59): Positive trends, completed states, and confirmation indicators.
- **Error Red** (#ff0000): Validation errors, destructive actions, and critical alerts.

### Named Rules

**The Teal Anchor Rule.** Deep Teal appears on every screen. Its presence is the visual thread that ties the interface together. Never remove it entirely from a view.

**The Tonal Layering Rule.** Depth is conveyed through color intensity, not shadows. Lighter surfaces recede; saturated surfaces advance. Use Mint Mist for backgrounds, Surface White for cards, and Deep Teal for interactive foreground.

## 3. Typography

**Display Font:** Poppins (with system sans-serif fallback)
**Body Font:** Poppins (with system sans-serif fallback)

**Character:** A single-family system that prioritizes clarity and consistency. Poppins is geometric yet warm, matching the brand's professional-but-human personality. Weight contrast (400/500/600/700) creates hierarchy without introducing another typeface.

### Hierarchy
- **Display** (700, 2.25rem, 1.4 line-height): Page titles, hero headings. Maximum one per screen.
- **Headline** (700, 1.5rem, 1.4 line-height): Section headings, card titles.
- **Title** (600, 1.25rem, 1.4 line-height): Subsection headings, table headers.
- **Body** (400, 0.875rem, 1.6 line-height): Paragraph text, descriptions. Max line length: 65-75ch.
- **Label** (500, 0.75rem, 1.4 line-height, 0.05em tracking, uppercase): Form labels, status badges, metadata.

### Named Rules

**The Weight Contrast Rule.** Hierarchy comes from weight jumps (400 to 600 to 700), not size alone. A 1rem bold heading over 0.875rem regular body is clearer than two similar weights at different sizes.

**The Single Voice Rule.** One font family throughout. No exceptions. The system's calm consistency depends on typographic unity.

## 4. Elevation

Flat by default. This system rejects shadow-based depth in favor of tonal layering. Surfaces are differentiated by background color intensity, not by casting shadows on each other.

The philosophy: a flat interface feels clean and modern, the opposite of legacy EHR systems with their heavy drop shadows and beveled edges. When interaction requires feedback, use color shifts (hover states, active backgrounds) rather than elevation changes.

### Named Rules

**The Flat-By-Default Rule.** Surfaces sit flat on the canvas. No ambient shadows, no card lifts, no floating elements. Depth is communicated through the tonal palette: Mint Mist backgrounds, Surface White cards, Deep Teal interactive elements.

**The State-Shift Rule.** Interactive feedback uses color transitions, not motion or elevation. A button darkens on hover; a nav item fills with color when active. These shifts are instantaneous or use very short durations (75-100ms).

## 5. Components

### Buttons

Confident and direct. Buttons are the primary action affordance; they should feel solid and intentional.

- **Shape:** Gently curved edges (8px radius)
- **Primary:** Deep Teal background (#35a29f), white text, 12px 24px padding. The default for main actions.
- **Hover:** Coastal Dark background (#0b686a). 100ms transition.
- **Secondary:** Transparent background, 1px Border Light border, gray text. For secondary actions.
- **Ghost (if used):** No border, text-only. For tertiary or inline actions.

### Cards / Containers

Minimal containers. Cards exist to group related content, not to decorate.

- **Corner Style:** Softly rounded (12px radius)
- **Background:** Surface White (#ffffff)
- **Border:** 1px Border Light (#e9e9e9) when structural separation is needed
- **Internal Padding:** 16px standard, 24px for larger content blocks
- **Shadow Strategy:** None. Flat surfaces per the elevation philosophy.

### Inputs / Fields

Clean and functional. Inputs should feel like part of the workspace, not decorative elements.

- **Style:** 2px Border Light border, white background, 8px radius
- **Focus:** Deep Teal border or ring. Clear, immediate feedback.
- **Padding:** 8px 16px
- **Error:** Error Red border with descriptive error text below

### Navigation

**Sidebar (Dashboard):**
- Mint Mist background, full-height
- Nav items are bold text (Poppins 700), with Deep Teal fill on active state
- Hover: light teal tint background

**Top Navigation (Landing):**
- Mint Mist background, subtle bottom border
- Nav items are medium weight, Deep Teal on active
- Mobile: hamburger menu with animated dropdown

### Statistics Cards (Dashboard)

Data-forward components. Display key metrics with trend indicators.

- **Layout:** Flex row, equal distribution
- **Content:** Title (label style), value (title/heading weight), trend indicator
- **Trend:** Success Green for positive, Error Red for negative, Warm Gray for neutral
- **Highlight:** First card gets Success Green tint background for emphasis

## 6. Do's and Don'ts

### Do:
- **Do** use Deep Teal (#35a29f) as the primary action color on every screen.
- **Do** maintain flat surfaces. Depth comes from the tonal palette, not shadows.
- **Do** use Poppins at weights 400, 500, 600, 700. No other weights or families.
- **Do** keep spacing generous. Use the 8px/16px/24px/32px scale consistently.
- **Do** use Mint Mist (#f5fffd) for page backgrounds and sidebar.
- **Do** use nature-inspired color names when discussing the palette: Deep Teal, Ocean Navy, Mint Mist.
- **Do** ensure WCAG 2.1 AAA contrast ratios. Test all text against its background.

### Don't:
- **Don't** use drop shadows, box-shadows, or elevation effects. This system is flat by default.
- **Don't** use gradient text or glassmorphism effects. These are decorative, not meaningful.
- **Don't** use border-left or border-right as colored accents on cards or list items.
- **Don't** introduce more than one font family. Poppins is the only voice.
- **Don't** use #000 pure black or #fff pure white. Always use the tinted neutrals.
- **Don't** clutter the interface with unnecessary decoration. Every element must earn its place.
- **Don't** mimic legacy EHR aesthetics (Epic, Cerner): cluttered layouts, outdated styling, information overload.
- **Don't** use identical card grids with icon + heading + text repeated endlessly. Vary layouts for visual interest.
