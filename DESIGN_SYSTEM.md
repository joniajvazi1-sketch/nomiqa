# Nomiqa Design System

## Hero Section Standards

### Layout Structure

All hero sections follow this consistent structure:

```tsx
<section className="pt-24 pb-12 md:pt-32 md:pb-16 bg-gradient-to-br from-deep-space via-midnight-blue to-deep-space relative overflow-hidden">
  {/* Background decorations */}
  <div className="absolute inset-0 opacity-20">
    <div className="absolute top-20 left-10 w-64 h-64 bg-neon-cyan rounded-full blur-3xl animate-pulse"></div>
    <div className="absolute bottom-20 right-10 w-80 h-80 bg-neon-violet rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
  </div>
  
  <div className="container px-4 relative z-10">
    <div className="max-w-5xl mx-auto text-center">
      {/* Content here */}
    </div>
  </div>
</section>
```

### Spacing Standards

#### Vertical Spacing (Padding)
- **Mobile (default)**: `pt-24 pb-12` (96px top, 48px bottom)
- **Desktop (md+)**: `md:pt-32 md:pb-16` (128px top, 64px bottom)
- **Purpose**: Provides breathing room below navbar and proper section separation

#### Content Spacing
- **Between sections**: `mb-8 md:mb-12` or `mb-12 md:mb-16`
- **Within hero content**: `space-y-4 md:space-y-6` for stacked elements
- **Inline spacing**: `gap-4 md:gap-6` for flex/grid layouts

#### Container Width
- **Default container**: `max-w-5xl mx-auto` (1024px max width, centered)
- **Narrow sections**: `max-w-3xl mx-auto` (768px max width)
- **Wide sections**: `max-w-6xl mx-auto` (1152px max width)

### Gradient Styles

#### Primary Hero Gradient (Standard)
```css
bg-gradient-to-br from-deep-space via-midnight-blue to-deep-space
```
- **Use case**: All hero sections, standard backgrounds
- **Colors**: Deep space (#0a0e27) → Midnight blue (#1a1f3a) → Deep space
- **Direction**: Bottom-right diagonal

#### Text Gradients

**Neon Gradient (Multi-color)**
```css
bg-gradient-neon bg-clip-text text-transparent
```
- **Colors**: Cyan → Violet → Purple gradient
- **Use case**: Main headlines, important CTAs
- **Defined in**: `index.css` as `@apply` utility

**Warm Gradient**
```css
bg-gradient-to-r from-warm-sand to-neon-coral bg-clip-text text-transparent
```
- **Use case**: Subheadings, alternative headlines
- **Colors**: Warm sand (#e8d5c4) → Neon coral (#ff6b6b)

### Background Decorations

#### Standard Blur Orbs
```tsx
<div className="absolute inset-0 opacity-20">
  <div className="absolute top-20 left-10 w-64 h-64 bg-neon-cyan rounded-full blur-3xl animate-pulse"></div>
  <div className="absolute bottom-20 right-10 w-80 h-80 bg-neon-violet rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
</div>
```

**Specifications:**
- **Opacity**: `opacity-20` (20% visible)
- **Primary orb**: Top-left, cyan, 256px diameter
- **Secondary orb**: Bottom-right, violet, 320px diameter
- **Animation**: `animate-pulse` with 1s delay on secondary
- **Blur**: `blur-3xl` (48px blur radius)

### Typography Scales

#### Hero Headlines

**Large Hero (Affiliate, Main Pages)**
```css
text-4xl md:text-6xl lg:text-7xl font-black font-display leading-tight tracking-tight
```
- Mobile: 36px (2.25rem)
- Tablet: 60px (3.75rem)
- Desktop: 72px (4.5rem)

**Medium Hero (Contact, Help Pages)**
```css
text-3xl md:text-4xl lg:text-5xl font-bold
```
- Mobile: 30px (1.875rem)
- Tablet: 36px (2.25rem)
- Desktop: 48px (3rem)

**Small Hero (FAQ Titles)**
```css
text-3xl md:text-4xl lg:text-5xl font-bold
```
- Mobile: 30px (1.875rem)
- Tablet: 36px (2.25rem)
- Desktop: 48px (3rem)

#### Body Text in Hero

**Primary Description**
```css
text-base md:text-lg text-foreground/70
```
- Mobile: 16px
- Desktop: 18px
- Opacity: 70%

**Subtext/Supporting Copy**
```css
text-sm md:text-base lg:text-lg text-foreground/80
```
- Mobile: 14px
- Tablet: 16px
- Desktop: 18px
- Opacity: 80%

### Color System

#### Core Colors (HSL Format)

```css
/* Primary Brand Colors */
--deep-space: 229 48% 10%;          /* #0a0e27 - Main background */
--midnight-blue: 229 36% 17%;       /* #1a1f3a - Secondary background */

/* Accent Colors */
--neon-cyan: 180 100% 50%;          /* #00ffff - Primary accent */
--neon-violet: 270 100% 70%;        /* #b366ff - Secondary accent */
--neon-coral: 0 100% 70%;           /* #ff6b6b - CTA/highlight */
--neon-purple: 280 100% 65%;        /* #cc66ff - Tertiary accent */

/* Text Colors */
--foreground: 0 0% 98%;             /* #fafafa - Primary text */
--warm-sand: 30 48% 84%;            /* #e8d5c4 - Warm text variant */
```

#### Usage Guidelines

**Backgrounds:**
- Primary: `bg-deep-space` or `bg-gradient-to-br from-deep-space via-midnight-blue to-deep-space`
- Cards: `bg-card/30` with `backdrop-blur-xl`
- Overlays: `bg-background/50` or `bg-card/50`

**Text:**
- Primary: `text-foreground`
- Secondary: `text-foreground/70` or `text-foreground/80`
- Accents: `text-neon-cyan`, `text-neon-violet`, `text-neon-coral`
- Gradients: Use gradient utilities for headlines

**Borders:**
- Standard: `border-neon-cyan/20`
- Hover: `hover:border-neon-cyan/40`
- Focus: `focus:border-neon-violet/50`

### Animations

#### Entrance Animations
```css
animate-fade-in
```
- **Duration**: 0.3s
- **Easing**: ease-out
- **Effect**: Fade in + slight upward movement (10px)

#### Pulse Animations
```css
animate-pulse
```
- **Use**: Background decorations, loading states
- **Duration**: 2s infinite
- **Delay variation**: Use `style={{ animationDelay: '1s' }}` for staggered effects

#### Hover Effects

**Shadow Glow**
```css
hover:shadow-glow-cyan
```
- Defined in `tailwind.config.ts`
- Creates cyan/violet glow on hover

**Scale**
```css
hover:scale-105 transition-transform
```
- Standard 5% scale increase
- Smooth transition

### Component Patterns

#### Card Pattern
```tsx
<div className="bg-card/30 backdrop-blur-xl border border-neon-cyan/20 rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-glow-cyan transition-all">
  {/* Content */}
</div>
```

**Specifications:**
- Background: Semi-transparent card with blur
- Border: Cyan with 20% opacity
- Radius: `rounded-2xl` (16px)
- Padding: 24px mobile, 32px desktop
- Shadow: Standard + glow on hover

#### Badge Pattern
```tsx
<Badge variant="secondary" className="text-xs w-fit">
  {/* Text */}
</Badge>
```

#### Button Patterns

**Primary CTA**
```tsx
<Button variant="default" size="lg" className="w-full sm:w-auto">
  {/* Text */}
</Button>
```

**Secondary Action**
```tsx
<Button variant="outline" size="lg" className="border-neon-cyan/40 text-foreground hover:bg-neon-cyan/10">
  {/* Text */}
</Button>
```

### Responsive Breakpoints

```css
/* Mobile First */
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

#### Common Responsive Patterns

**Text Sizing:**
```css
text-sm md:text-base lg:text-lg
```

**Spacing:**
```css
gap-3 md:gap-4 lg:gap-6
p-4 md:p-6 lg:p-8
```

**Layout:**
```css
flex-col md:flex-row
grid-cols-1 md:grid-cols-2 lg:grid-cols-3
```

### Accessibility Standards

#### Color Contrast
- Minimum 4.5:1 for normal text
- Minimum 3:1 for large text (18px+)
- Use `text-foreground` on dark backgrounds for compliance

#### Focus States
```css
focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:ring-offset-2
```

#### Motion
- Respect `prefers-reduced-motion`
- Provide non-animated alternatives for critical content

### Implementation Checklist

When creating a new hero section:

- [ ] Use standard spacing: `pt-24 pb-12 md:pt-32 md:pb-16`
- [ ] Apply gradient background: `bg-gradient-to-br from-deep-space via-midnight-blue to-deep-space`
- [ ] Add blur orbs with 20% opacity
- [ ] Center content with `max-w-5xl mx-auto`
- [ ] Use appropriate text gradients for headlines
- [ ] Apply `animate-fade-in` to main content wrapper
- [ ] Ensure mobile-first responsive design
- [ ] Test contrast ratios for accessibility
- [ ] Add proper semantic HTML (h1, section, etc.)
- [ ] Implement hover states on interactive elements

### File References

**Core Style Files:**
- `src/index.css` - Global styles, gradients, custom utilities
- `tailwind.config.ts` - Theme configuration, colors, animations
- `src/components/ui/` - Reusable UI components

**Example Implementations:**
- `src/pages/Affiliate.tsx` - Hero section with badge + gradient text
- `src/pages/Help.tsx` - Contact hero with card pattern
- `src/pages/Index.tsx` - Main hero with video/animation
- `src/components/FAQ.tsx` - Section header pattern

---

## Version History

- **v1.0** (2025-01-20): Initial design system documentation
  - Standardized hero section patterns
  - Defined gradient styles
  - Established spacing standards
  - Documented color system
  - Component patterns defined
