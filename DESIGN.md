# Design System Inspired by Intrepid Automation

## 1. Visual Theme & Atmosphere

The Intrepid Automation design system embodies a bold, minimalist aesthetic centered on a vibrant orange foundation that conveys energy, innovation, and forward momentum. The visual language is deliberately stark and purposeful—dominated by a high-contrast palette of pure blacks and whites against the dominant burnt-orange backdrop. This creates an industrial, tech-forward atmosphere with a sense of urgency and precision. The design prioritizes clarity and directness, eschewing decorative elements in favor of clean lines, generous whitespace, and a typography-first hierarchy. The overall mood is confident and progressive, reflecting a company focused on automation and operational excellence.

**Key Characteristics**
- Bold, high-contrast color strategy with burnt-orange as the defining hue
- Minimalist approach with zero border radius (hard edges throughout)
- Stark black-and-white typography against vibrant backgrounds
- Industrial precision combined with modern tech aesthetics
- Generous use of whitespace and breathing room
- No shadows or depth effects—purely flat design language
- Typography-driven visual hierarchy

## 2. Color Palette & Roles

### Primary
- **Intrepid Orange** (`#FF6633`): Primary brand color, dominant background for hero sections and major call-to-action areas
- **Pure Black** (`#000000`): Primary text and deep UI elements, conveys authority and contrast

### Neutral Scale
- **Off-White** (`#FFFFFF`): Clean backgrounds, surfaces, and text on dark overlays
- **Light Gray** (`#E5E7EB`): Subtle borders, dividers, and secondary surface backgrounds
- **Medium Gray** (`#A6A6A6`): Disabled states, tertiary text, and muted UI elements
- **Dark Charcoal** (`#3B3B3B`): Secondary text, fine typography, and medium-contrast elements

### Interactive
- **Orange on White** (`#FF6633` text on `#FFFFFF` background): Button text for secondary actions
- **White on Orange** (`#FFFFFF` text on `#FF6633` background): Primary CTAs and navigation on orange sections
- **Black on Gray** (`#000000` text on `#E5E7EB` background): Tertiary interactive states

### Surface & Borders
- **Border Neutral** (`#E5E7EB`): All borders, dividers, and edge definitions throughout the UI

## 3. Typography Rules

### Font Family
- **Primary Font**: `__onsite_2032f6` (system serif or display font) with fallback stack: `georgia, serif`
- **Secondary Font**: `__mdio_e79ec6` (system sans-serif or utility font) with fallback stack: `helvetica, arial, sans-serif`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|-----------------|-------|
| Display / H1 | `__onsite_2032f6` | 65px | 500 | 62px | 0px | Hero headlines, primary page titles |
| Heading 3 / H3 | `__onsite_2032f6` | 30px | 400 | 32px | 0px | Section headings, subsection titles |
| Heading 4 / H4 | `__onsite_2032f6` | 16px | 500 | 19px | 0px | Card titles, medium headings |
| Body / Paragraph | `__onsite_2032f6` | 16px | 400 | 24px | 0px | Standard body copy, link text |
| Label / Small Text | `__mdio_e79ec6` | 11px | 500 | 16.5px | 0px | Button labels, metadata, small UI text |
| Caption / Fine Print | `__mdio_e79ec6` | 10px | 400 | 15px | 0px | Captions, footnotes, tertiary information |

### Principles
- Maintain strict size discipline—use only defined sizes for consistency
- Primary font (`__onsite_2032f6`) dominates all hierarchy roles for a cohesive narrative voice
- Secondary font (`__mdio_e79ec6`) reserved for compact UI labels and utility text
- Always respect line-height values to ensure proper text breathing and accessibility
- Weight differentiation (400 vs 500) drives visual hierarchy without resorting to size changes
- Zero letter spacing throughout—letterforms should sit naturally without adjustment

## 4. Component Stylings

### Buttons

**Primary Button**
- Background: `#FF6633`
- Text Color: `#FFFFFF`
- Font: `__mdio_e79ec6`, 10px, weight 400
- Padding: `0px 20px`
- Height: 31px
- Width: 124px
- Border Radius: `0px`
- Border: `0px solid #E5E7EB`
- Box Shadow: `none`
- Line Height: 15px
- Hover State: Background `#E55A22`, text remains `#FFFFFF`
- Active State: Background `#D64D1A`, text remains `#FFFFFF`
- Disabled State: Background `#E5E7EB`, text `#A6A6A6`

**Secondary Button**
- Background: `rgba(0, 0, 0, 0)` (transparent)
- Text Color: `#FFFFFF`
- Font: `__mdio_e79ec6`, 10px, weight 400
- Padding: `0px 20px`
- Height: 31px
- Width: 124px
- Border Radius: `0px`
- Border: `1px solid #FFFFFF`
- Box Shadow: `none`
- Line Height: 15px
- Hover State: Background `#FFFFFF`, text `#FF6633`
- Active State: Background `#E5E7EB`, text `#FF6633`

### Navigation

**Primary Navigation**
- Background: `rgba(0, 0, 0, 0)` (transparent)
- Text Color: `#000000`
- Font: `__onsite_2032f6`, 16px, weight 400
- Padding: `0px 0px`
- Height: 20px
- Width: auto
- Border Radius: `0px`
- Border: `0px solid #E5E7EB`
- Box Shadow: `none`
- Line Height: 24px
- Hover State: Text Color `#FF6633`
- Active State: Text Color `#FF6633`, underline `2px solid #FF6633` (bottom border)

**Footer Navigation Link**
- Background: `rgba(0, 0, 0, 0)` (transparent)
- Text Color: `#FFFFFF`
- Font: `__onsite_2032f6`, 13px, weight 400
- Padding: `0px 0px`
- Height: 20px
- Border Radius: `0px`
- Border: `0px solid #E5E7EB`
- Box Shadow: `none`
- Line Height: 19.5px
- Hover State: Opacity `0.8`
- Active State: Text Color `#FFB399`

### Links

**Body Link (Dark Background)**
- Background: `rgba(0, 0, 0, 0)` (transparent)
- Text Color: `#000000`
- Font: `__onsite_2032f6`, 16px, weight 400
- Padding: `0px 0px`
- Height: auto
- Border Radius: `0px`
- Border: `0px solid transparent`
- Box Shadow: `none`
- Line Height: 24px
- Text Decoration: `underline` on hover
- Hover State: Text Color `#FF6633`, Underline `2px solid #FF6633`

**Light Link (Orange Background)**
- Background: `rgba(0, 0, 0, 0)` (transparent)
- Text Color: `#FFFFFF`
- Font: `__onsite_2032f6`, 13px, weight 400
- Padding: `0px 0px`
- Height: auto
- Border Radius: `0px`
- Border: `0px solid transparent`
- Box Shadow: `none`
- Line Height: 19.5px
- Text Decoration: `underline` on hover
- Hover State: Opacity `0.8`

### Cards & Containers

**Content Card**
- Background: `#FFFFFF`
- Border: `1px solid #E5E7EB`
- Padding: `40px 40px`
- Border Radius: `0px`
- Box Shadow: `none`
- Min Height: auto
- Max Width: 100%

**Section Container**
- Background: `#FF6633` or `#FFFFFF` (context dependent)
- Padding: `80px 40px`
- Border: `none`
- Border Radius: `0px`
- Box Shadow: `none`
- Margin: `0px 0px`

### Inputs & Forms

**Text Input**
- Background: `#FFFFFF`
- Border: `1px solid #E5E7EB`
- Border Radius: `0px`
- Padding: `12px 16px`
- Font: `__onsite_2032f6`, 16px, weight 400
- Color: `#000000`
- Height: 44px
- Line Height: 24px
- Focus State: Border Color `#FF6633`, Box Shadow `inset 0 0 0 2px rgba(255, 102, 51, 0.1)`
- Placeholder: Color `#A6A6A6`, Font Weight 400
- Disabled State: Background `#E5E7EB`, Border Color `#E5E7EB`, Color `#A6A6A6`

**Form Label**
- Font: `__mdio_e79ec6`, 11px, weight 500
- Color: `#000000`
- Line Height: 16.5px
- Margin Bottom: `8px`
- Display: `block`

## 5. Layout Principles

### Spacing System

The design system uses an 8px base unit with a modular scale:
- **4px**: Micro adjustments, input label spacing
- **8px**: Tight grouping, nested list items, icon-text gaps
- **12px**: Form label to input gaps, small card padding
- **16px**: Component-level gaps, section dividers
- **20px**: Button horizontal padding, list item spacing
- **24px**: Cards and container padding (horizontal)
- **36px**: Section spacing (vertical)
- **40px**: Container padding, major section padding
- **44px**: Large spacing between major UI blocks
- **52px**: Significant section separation
- **80px**: Full-width section vertical padding
- **92px**: Hero section padding, maximum breathing room

### Grid & Container

- **Max Width**: 100% (full-bleed sections with edge padding)
- **Container Padding**: 40px on left/right for desktop, 24px for tablet, 16px for mobile
- **Column Strategy**: Single column for mobile (320px-640px), two columns for tablet (641px-1024px), full-width flexible columns for desktop (1025px+)
- **Section Pattern**: Full-width background color sections with inner content containers respecting max padding

### Whitespace Philosophy

Whitespace is treated as a first-class design element. Sections breathe generously with `80px` vertical padding between major blocks. Content cards and containers use consistent `40px` padding to ensure breathing room around text. Gap spacing between UI elements follows the 8px modular scale. This creates a sense of clarity and allows each section to command attention without visual clutter.

### Border Radius Scale

- **0px**: All components (buttons, inputs, cards, containers) use hard edges exclusively
- **0px radius**: Maintains the industrial, precision-focused aesthetic throughout the interface
- **No curved corners**: Reinforces the minimalist, tech-forward visual language

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (0) | No box-shadow, flat background | Default state for all buttons, cards, and containers |
| Interaction (1) | Box-shadow: `inset 0 0 0 2px rgba(255, 102, 51, 0.1)` | Focus states on form inputs |
| Overlay | No shadow, opacity-based layering | Modal overlays, dropdown menus (future states) |

**Shadow Philosophy**

The design system employs a completely flat aesthetic—no elevation shadows are used. Depth and hierarchy are achieved through color contrast, typography weight differentiation, and layout spacing rather than shadow effects. When interaction feedback is needed, subtle inset shadows or opacity changes replace traditional drop shadows. This maintains the industrial, digital-first appearance and ensures the bold orange and black color strategy remains the visual focus.

## 7. Do's and Don'ts

### Do
- Use `#FF6633` (Intrepid Orange) as the primary accent on hero sections, CTAs, and brand moments
- Maintain maximum contrast by pairing pure black (`#000000`) text on white backgrounds and white text on orange backgrounds
- Apply consistent `40px` padding to all containers and cards for visual uniformity
- Use `__onsite_2032f6` for all hierarchical typography (headings, body, links)
- Reserve `__mdio_e79ec6` exclusively for compact UI labels and button text
- Employ hard edges (`0px` border radius) on every interactive and container component
- Space major sections with `80px` vertical padding to create visual breathing room
- Respect the exact line-height values—they are calibrated for optimal legibility and spacing
- Use the 8px spacing scale rigorously: 4px, 8px, 12px, 16px, 20px, 24px, 36px, 40px, 44px, 52px, 80px, 92px
- Implement hover states by shifting the orange (`#FF6633` → `#E55A22`) or adjusting opacity

### Don't
- Do not introduce rounded corners or border-radius values—all components must have `0px` radius
- Do not mix serif and sans-serif fonts within the same text element; stick to the designated font for each role
- Do not use drop shadows or elevation effects—depth comes from color and spacing
- Do not deviate from the defined color palette; do not introduce gradients or color blends
- Do not use orange on orange or black on black combinations—always maintain high contrast
- Do not apply font sizes outside the defined hierarchy (65px, 30px, 16px, 13px, 11px, 10px)
- Do not add letter-spacing adjustments—use `0px` letter spacing throughout
- Do not apply padding values outside the modular scale
- Do not place interactive elements without clear focus and hover states
- Do not reduce whitespace below `8px` gaps unless in exceptional micro-interaction scenarios

## 8. Responsive Behavior

### Breakpoints

| Breakpoint Name | Width | Key Changes |
|-----------------|-------|-------------|
| Mobile | 320px – 640px | Single column layout, 16px side padding, button width 100%, H1 48px, spacing reduced to 40px sections |
| Tablet | 641px – 1024px | Two-column layout, 24px side padding, H1 56px, spacing 60px sections |
| Desktop | 1025px+ | Full flexible columns, 40px side padding, H1 65px, spacing 80px sections, full typography hierarchy |
| Large Desktop | 1440px+ | Max-width container 1400px centered, 40px side padding maintained |

### Touch Targets

- **Minimum Button Height**: 44px (meets WCAG AA accessibility standards)
- **Minimum Button Width**: 88px for primary actions
- **Minimum Tap Area**: 44px × 44px for all interactive elements (links, buttons, form controls)
- **Spacing Between Touch Targets**: Minimum 8px on mobile, 16px on desktop
- **Link Underline Width**: 2px for hover indication
- **Focus Ring**: Minimum 2px inset offset on inputs

### Collapsing Strategy

- **Hero Sections**: Reduce padding from 92px to 60px on tablet, 40px on mobile; reduce H1 size progressively
- **Navigation**: Stack horizontally on desktop, collapse to hamburger menu below 640px
- **Multi-Column Layouts**: Reflow from 3 columns → 2 columns at tablet → 1 column at mobile
- **Card Grids**: From 3-column grid on desktop → 2-column on tablet → 1-column on mobile
- **Padding Compression**: Reduce all section padding by 25% on tablet, 50% on mobile while maintaining 8px scale multiples
- **Typography Scaling**: Reduce display font by 20% on tablet, 25% on mobile; maintain line-height relationships
- **Button Width**: Expand from fixed width to full-width minus padding on mobile (max-width: calc(100% - 32px))
- **Form Inputs**: Stack vertically on all breakpoints with 16px gap between fields on mobile, 20px on tablet+

## 9. Agent Prompt Guide

### Quick Color Reference

- **Primary CTA Background**: Intrepid Orange (`#FF6633`)
- **Primary CTA Text**: Pure White (`#FFFFFF`)
- **Body Text & Headlines**: Pure Black (`#000000`)
- **Secondary Text**: Dark Charcoal (`#3B3B3B`)
- **Tertiary Text / Disabled**: Medium Gray (`#A6A6A6`)
- **Borders & Dividers**: Light Gray (`#E5E7EB`)
- **Background Surface**: Pure White (`#FFFFFF`)
- **Accent on Hover**: Dark Orange (`#E55A22`)
- **Disabled State Background**: Light Gray (`#E5E7EB`)

### Iteration Guide

1. **Always use `0px` border-radius** across all components—hard edges define the industrial aesthetic; there are no exceptions.
2. **Apply font family strictly**: `__onsite_2032f6` for all hierarchy (H1 65px, H3 30px, H4 16px, body 16px), `__mdio_e79ec6` for UI labels (11px, 10px).
3. **Maintain contrast ruthlessly**: Black text on white, white text on orange, orange text on white—no compromises on legibility.
4. **Space generously**: Use `80px` vertical padding between sections on desktop, reduce progressively on smaller screens; never go below modular scale multiples (8px increments).
5. **Flat design only**: No shadows, no gradients, no depth effects—hierarchy comes from color, typography weight, and spacing.
6. **Buttons are compact**: 31px height, `0px` padding-top/bottom, 20px padding left/right, always full-width or fixed 124px—no intermediate sizes.
7. **Interactive states matter**: Define hover (color shift), active (darker variant), disabled (gray out), and focus (inset border) for every interactive element.
8. **Whitespace is sacred**: At least 8px between UI elements, 16px between logical groups, 40px+ around major containers; whitespace is not "empty space."
9. **Respect breakpoints precisely**: 320px–640px mobile uses single-column + 16px padding, 641px–1024px tablet uses 24px padding + flexible columns, 1025px+ desktop uses 40px padding + full hierarchy.
10. **Typography is truth**: Font sizes are fixed (65px, 30px, 16px, 13px, 11px, 10px); line-heights are fixed (62px, 32px, 24px, 19.5px, 16.5px, 15px); weight differentiation (400, 500) drives emphasis—no tweaks.