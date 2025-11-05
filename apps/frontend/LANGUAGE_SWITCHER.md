# Language Switcher Component 🌍

## Overview

A beautiful, modern language switcher component with smooth animations, gradients, and two variants for different use cases.

## Features

✨ **Two Variants**: Default (with labels) and Compact (icon-only)
🎨 **Smooth Animations**: Scale, fade, and glow effects on hover/active states
🌈 **Gradient Backgrounds**: Subtle animated gradients for visual appeal
💫 **Active Indicators**: Pulsing dots and glowing borders show current language
🎯 **Accessible**: Full ARIA support and keyboard navigation
📱 **Responsive**: Works beautifully on all screen sizes
🎭 **Visual Feedback**: Hover states, scale transforms, and shadow effects

## Variants

### Default Variant
The full-featured switcher with flag emojis and language labels (EN/FR).

**Features:**
- Flag emoji + text label
- Animated background glow on hover
- Pulsing indicator dot on active language
- Gradient overlay effect
- Scale animation on hover and active states

**Best for:**
- Main navigation/header
- Settings pages
- Areas with more space

**Usage:**
```tsx
<LanguageSwitcher />
// or explicitly:
<LanguageSwitcher variant="default" />
```

### Compact Variant
A space-efficient switcher showing only flag emojis.

**Features:**
- Flag emojis only
- Animated ring indicator on active language
- Glowing border on hover
- Scale animation
- Smaller footprint

**Best for:**
- Top corners (like login page)
- Mobile navigation
- Tight spaces
- Minimalist designs

**Usage:**
```tsx
<LanguageSwitcher variant="compact" />
```

## Current Implementation

### Login Page
Uses **compact variant** in the top-right corner:
```tsx
<div className="absolute right-6 top-6">
  <LanguageSwitcher variant="compact" />
</div>
```

### Main App Layout (Root)
Uses **default variant** in the header next to user profile:
```tsx
<div className="flex items-center gap-3">
  <LanguageSwitcher />
  <div className="flex items-center gap-4 rounded-full border border-white/10 bg-slate-900/80 px-4 py-2 shadow-inner">
    {/* User profile... */}
  </div>
</div>
```

## Visual Design Details

### Colors & Effects

**Default Variant:**
- Container: Gradient background from slate-900 with transparency
- Hover: White border glow + shadow enhancement
- Active: Brand gradient (brand-500) with glow shadow
- Inactive: Slate-400 text, hover to slate-200

**Compact Variant:**
- Container: Slate-900 with backdrop blur
- Hover: Brand-400 border with glow effect
- Active: Brand-500 background + animated ring
- Flag size: Larger (text-lg) for better visibility

### Animations

1. **Container Hover**
   - Border color transition (300ms)
   - Shadow enhancement
   - Gradient overlay fade-in (500ms)

2. **Button Click/Active**
   - Scale up to 105%-110%
   - Smooth transition (300ms ease-out)
   - Glow shadow effect

3. **Flag Emoji**
   - Scale up when active (110%)
   - Smooth transform animation

4. **Active Indicators**
   - Pulsing dot (default variant)
   - Pulsing ring (compact variant)
   - Continuous animation

## Accessibility

✅ **ARIA Labels**: Each button has descriptive aria-label
✅ **Current State**: Active language marked with aria-current
✅ **Tooltips**: Native title attribute shows full language name
✅ **Keyboard Navigation**: Full keyboard support (Tab, Enter, Space)
✅ **Screen Readers**: Semantic button elements with proper roles
✅ **Focus States**: Clear visual focus indicators

## Customization

### Adding New Languages

Edit `language-switcher.tsx`:

```tsx
const languages = [
  { code: 'en', label: 'English', shortLabel: 'EN', flag: '🇬🇧', name: 'English' },
  { code: 'fr', label: 'Français', shortLabel: 'FR', flag: '🇫🇷', name: 'French' },
  { code: 'es', label: 'Español', shortLabel: 'ES', flag: '🇪🇸', name: 'Spanish' },
  { code: 'de', label: 'Deutsch', shortLabel: 'DE', flag: '🇩🇪', name: 'German' },
] as const;
```

### Styling Modifications

The component uses Tailwind CSS classes. Key style points:

**Container:**
- `rounded-full` - Pill shape
- `border border-white/10` - Subtle border
- `bg-gradient-to-br` - Gradient background
- `backdrop-blur-sm` - Glass morphism effect

**Buttons:**
- `rounded-full` - Match container shape
- `transition-all duration-300` - Smooth transitions
- `scale-105` / `scale-110` - Active/hover scaling
- `shadow-[custom]` - Custom glow effects

## Performance

- **No Re-renders**: Only re-renders when language actually changes
- **CSS Transitions**: Hardware-accelerated transforms and opacity
- **Lightweight**: Minimal JavaScript, CSS-driven animations
- **Optimized**: Memoized by React automatically

## Browser Support

✅ Modern browsers (Chrome, Firefox, Safari, Edge)
✅ Mobile browsers (iOS Safari, Chrome Mobile)
✅ Flag emojis (Unicode 8.0+, widely supported)

## Tips

1. **Choose the right variant:**
   - Use `default` for primary navigation
   - Use `compact` for corners or mobile

2. **Placement:**
   - Default works well horizontally in nav bars
   - Compact works great in corners or floating

3. **Context:**
   - Both variants look good on dark backgrounds
   - Light backgrounds may need color adjustments

## Future Enhancements

Possible improvements:
- [ ] Dropdown variant for 3+ languages
- [ ] Text-only variant (no flags)
- [ ] Light/dark mode support
- [ ] Custom color themes
- [ ] Sound effects on switch
- [ ] Animated transitions between languages
