# NCS Santhanam — Design System & Typography Style Guide

> **Brand Identity:** NCS Santhanam Silks (Est. 1975, Kanchipuram)  
> **Aesthetic Philosophy:** Timeless South Indian Heritage, Regal Silk Atelier, Reverence for Handloom Craftsmanship, Pure Mulberry Silk & Authentic Gold Zari.

---

## 1. Typography System

The website pairs a classical, high-contrast Serif typeface for editorial grandeur with a clean, highly legible Sans-Serif typeface for navigation, technical details, and transactional user interfaces.

### Font Families
- **Display & Headings (Serif):** `"Cormorant Garamond", Georgia, "Times New Roman", serif`
  - *Tailwind class:* `font-[var(--font-serif)]` or `font-serif`
  - *Mood:* Royal, ceremonial, literary, reminiscent of traditional South Indian temple inscriptions and heritage luxury.
- **Body & Interface (Sans):** `Inter, Arial, Helvetica, sans-serif`
  - *Tailwind class:* `font-[var(--font-sans)]` or `font-sans`
  - *Mood:* Clean, modern, accessible, high legibility for product specifications, pricing, and forms.

---

### Type Hierarchy Scale

| Level | Size (Desktop / Mobile) | Line Height | Letter Spacing | Font Family | Weight | Color Rule | Typical Usage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Display (H1)** | `clamp(3rem, 6vw, 5.5rem)` | `1.04` – `1.1` | `-0.02em` | Serif | Light / Normal (300/400) | Cream (`#FAF7F0`) or Navy (`#0B1B4D`) | Hero section grand headings, primary landing titles |
| **Page Title (H1)** | `3rem` (48px) / `2.25rem` (36px) | `1.15` | `-0.01em` | Serif | Light / Normal (300/400) | Navy (`var(--navy)`) | Category headers, collection titles, cart page |
| **Section Header (H2)**| `2.25rem` (36px) / `1.75rem` (28px)| `1.2` | `normal` | Serif | Normal / Medium | Navy (`var(--navy)`) or Ivory (`#FAF7F0`) | Section intros, feature showcases, policy heads |
| **Subsection (H3)** | `1.5rem` (24px) / `1.25rem` (20px) | `1.3` | `normal` | Serif | Medium / SemiBold | Navy (`var(--navy)`) | Product modal titles, card heads, FAQ questions |
| **Product Title** | `1.125rem` (18px) / `1rem` (16px) | `1.35` | `0.01em` | Serif | Medium (500) | Navy (`var(--navy)`), hover to Gold | Product listing cards |
| **Eyebrow / Overline** | `0.6875rem` (11px) – `0.75rem` (12px)| `1` | `0.25em` – `0.35em` | Sans | SemiBold / Bold (600/700) | Gold Text (`#82600F`) on light, Gold (`#D4AF37`) on dark | Category badges, "Est. 1975", breadcrumbs |
| **Body (Regular)** | `0.9375rem` (15px) / `0.875rem` (14px)| `1.65` – `1.75` | `normal` | Sans | Regular / Light (300/400)| Charcoal (`#333333`) on light, White 75% on dark | Product descriptions, story copy, policy text |
| **Price (Primary)** | `1.25rem` (20px) – `1.5rem` (24px) | `1` | `normal` | Sans | Medium / SemiBold (500/600)| Navy (`var(--navy)`) or Charcoal | Saree pricing, cart total |
| **Price (Strike-through)**| `0.875rem` (14px) | `1` | `normal` | Sans | Light (300) | Charcoal Muted 40% (`line-through`) | Original price / MRP before bridal discount |
| **Button / CTA** | `0.6875rem` (11px) – `0.75rem` (12px)| `1` | `0.2em` – `0.25em` | Sans | Bold (700) | Contrast with button fill | "Add to Bag", "Explore Collection", "Checkout" |
| **Legal / Captions** | `0.625rem` (10px) – `0.6875rem` (11px)| `1.4` | `0.1em` – `0.15em` | Sans | Normal / Medium | Muted Text (`#666666`) / White 50% | Copyright, Silk Mark disclaimer, courier subtext |

---

## 2. Color Palette & Semantic Tokens

### Primary Palette
| Token Name | HEX Code | CSS Variable | Semantic Usage |
| :--- | :--- | :--- | :--- |
| **Royal Navy** | `#0B1B4D` | `var(--navy)` | Dominant brand color. Headers, primary buttons, high-prestige sections. |
| **Atelier Navy** | `#071333` | N/A | Deep nocturnal blue for Hero and Footer ambient sections. |
| **Sacred Maroon** | `#8B1E2D` | `var(--maroon)` | Auspicious wedding silk crimson. Radiant glows, festive highlights. |
| **Temple Gold** | `#D4AF37` / `#C9A227` | `var(--gold)` | Metallic gold accents, borders, primary CTA fills, active indicators. |
| **Legible Gold Text**| `#82600F` | `var(--gold-text)` | High-contrast gold formulated for legibility on light/cream backgrounds. |
| **Warm Ivory** | `#FAF7F0` | `var(--ivory)` | Soft white tone for text on dark navy or warm card containers. |
| **Silk Cream** | `#F5F1E8` | `var(--cream)` | Global website body background. Provides warm, archival parchment tone. |
| **Greige** | `#E9E1D5` | `var(--greige)` | Image placeholder backdrops, secondary dividers, card borders. |

### Text Neutral Palette
| Token Name | HEX Code | CSS Variable | Semantic Usage |
| :--- | :--- | :--- | :--- |
| **Main Text** | `#0B1B4D` | `var(--text-main)` | Primary headings and emphasized text on cream. |
| **Body Text** | `#333333` | `var(--text-body)` | Paragraph copy, editorial stories, policy explanations. |
| **Muted Text** | `#666666` | `var(--text-muted)` | Secondary labels, breadcrumbs, disclaimers. |
| **Light Text** | `#FAF7F0` | `var(--text-light)` | Text rendering on dark backgrounds (Hero, Footer, Banner). |

---

## 3. UI Component Specifications

### 1. Primary Buttons
```html
<button className="bg-[var(--navy)] text-white text-xs uppercase tracking-[0.2em] font-bold py-4 px-8 hover:bg-[var(--gold)] hover:text-[var(--navy)] transition-all duration-300 shadow-md">
  Explore Collection
</button>
```
- **Fill:** Royal Navy (`#0B1B4D`)
- **Text:** White (`#FFFFFF`), uppercase, letter spacing `0.2em`
- **Hover:** Temple Gold (`#D4AF37`), Text becomes Navy (`#0B1B4D`)
- **Radius:** `rounded-sm` (sharp, architectural luxury profile)

### 2. Secondary & Outline Buttons
```html
<button className="border border-[var(--navy)] text-[var(--navy)] text-xs uppercase tracking-[0.2em] font-semibold py-4 px-8 hover:bg-[var(--navy)] hover:text-white transition-all duration-300">
  Book Showroom Consultation
</button>
```

### 3. Gold Gradient CTA (Special Hero / Bridal Feature)
```html
<button className="bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-[#08153A] text-xs uppercase tracking-[0.22em] font-bold py-4 px-8 hover:from-[#E5C158] hover:to-[#FFF0B8] transition-all shadow-xl">
  Explore Wedding Silks →
</button>
```

### 4. Product Card Dimensions
- **Aspect Ratio:** `aspect-[3/4]` (Crucial for Indian saree photography to capture the pallu drape, border scale, and pleat posture).
- **Background Fill:** Warm Greige (`#E9E1D5`) before image lazy load.
- **Image Hover:** `group-hover:scale-105 transition-transform duration-700 ease-out`.

---

## 4. Copywriting & Tone of Voice

1. **Reverence for the Loom:** Never refer to sarees as mere "apparel" or "garments". Use terms like *heirloom*, *handloom weave*, *ceremonial drape*, *masterpiece*, *pure silk pattu*.
2. **Authenticity Anchors:** Frequently reinforce trust markers:
   - *Silk Mark Certified* (Central Silk Board of India)
   - *Double Warp Mulberry Silk*
   - *Authentic Silver & Gold Zari*
   - *Direct from Kanchipuram Weavers*
3. **South Indian Heritage Vocabulary:**
   - **Korvai:** Traditional interlocking border technique.
   - **Petni:** Contrast pallu joint.
   - **Mayil:** Auspicious peacock motif.
   - **Rudraksham:** Sacred seed motif border.
   - **Muhurtham:** Sacred wedding hour/ceremony.
   - **Aayiram Butta:** 1,000 distinct handwoven motifs.

---

## 5. Design Do's & Don'ts

### ✅ DO:
- Maintain generous white space (padding scale `py-20` to `py-32`) to give sarees the breathing room of an upscale private showroom.
- Use `text-[var(--gold-text)]` (`#82600F`) instead of bright yellow on light backgrounds to meet WCAG AA accessibility standards.
- Reserve Serif italic spans (`italic text-[#E5C158]`) for poetic punchlines in headings (e.g. *Timeless Heirlooms*).
- Always include full-bleed high resolution imagery of genuine handloom textures.

### ❌ DO NOT:
- **Never slap neon or bright yellow `#E8B931` with `font-extrabold` across body paragraphs or navigation links.** (This was the root cause of the previous footer disharmony).
- Do not use rounded bubble buttons (`rounded-full` or pill buttons) for editorial CTAs. Use subtle rectangular corners (`rounded-sm` or `rounded`) to match royal handloom poise.
- Do not let pages load without content or show raw "No products found in ths category" errors.
- Never use generic low-resolution stock fashion photos that don't match Kanchipuram tradition.
