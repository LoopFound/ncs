# NCS Santhanam – Feature Todo List

> Extracted from: DESIGN, PRD, TECH STACK

---

## 🏗️ PROJECT SETUP

- [x] Initialize Next.js project with App Router
- [x] Configure TypeScript strict mode
- [x] Set up Tailwind CSS with custom theme
- [x] Install and configure Framer Motion
- [x] Set up ESLint + Prettier
- [ ] Configure GitHub repository


---

## 🗄️ DATABASE & BACKEND

### Database Setup
- [ ] Create Neon PostgreSQL database
- [ ] Install and configure Prisma ORM
- [ ] Design database schema for:
  - [ ] Products table
  - [ ] Categories table (multi-level)
  - [ ] Variants table
  - [ ] Cart table
  - [ ] Orders table
  - [ ] Inventory table
  - [ ] Coupons table
  - [ ] Shipping rules table
  - [ ] Users table
- [ ] Run initial migrations

### API Routes
- [ ] Set up Next.js API routes structure
- [ ] Implement authentication (JWT/Session)
- [ ] Create middleware for:
  - [ ] Auth protection
  - [ ] Rate limiting
  - [ ] Security headers
- [ ] Build API endpoints for:
  - [ ] Products CRUD
  - [ ] Categories CRUD
  - [ ] Cart operations
  - [ ] Order management
  - [ ] User management
  - [ ] Inventory sync

---

## 💳 PAYMENTS

- [ ] Integrate Razorpay SDK
  - [ ] UPI support
  - [ ] Card payments
  - [ ] Wallet payments
- [ ] Set up webhook handlers for payment verification
- [ ] Implement server-side payment validation
- [ ] (Optional) Stripe integration for future

---

## 📝 CMS INTEGRATION

- [ ] Set up Sanity CMS project
- [ ] Create schemas for:
  - [ ] Hero banners
  - [ ] Editorial content
  - [ ] Brand story sections
- [ ] Connect Sanity to Next.js frontend
- [ ] Build CMS preview functionality

---

## 🖼️ MEDIA STORAGE

- [ ] Set up Cloudinary account
- [ ] Configure image optimization settings
- [ ] Implement automatic image transforms
- [ ] Set up CDN delivery

---

## 🎨 DESIGN SYSTEM

### Color Palette
- [x] Define CSS variables for:
  - [x] Warm Ivory / Off-white (background)
  - [x] Soft Greige / Light Beige (secondary bg)
  - [x] Charcoal Black (text)
  - [x] Muted Gold / Bronze (accents)

### Typography
- [x] Import luxury serif font (Cormorant Garamond)
- [x] Import clean sans-serif font (Inter)
- [x] Create typography scale classes
- [x] Apply serif for headings/emotion
- [x] Apply sans-serif for body/clarity

### Animation System
- [x] Create Framer Motion variants for:
  - [x] Fade-in on scroll
  - [x] Slow slide transitions
  - [x] Image zoom (1-2%)
  - [x] Button hover glow
- [x] Implement ease-in-out timing
- [x] NO bounce or fast animations

---

## 🧭 HEADER & NAVIGATION

- [x] Build transparent/soft header component
- [x] Implement sticky header on scroll
- [x] Create minimal navigation with items:
  - [x] What's New
  - [x] Shop
  - [x] Collections
  - [x] Our Story
  - [x] Contact
- [ ] Build mega menu for quick category access
- [x] Add search bar with auto-suggest
- [ ] Implement breadcrumb navigation
- [x] Mobile hamburger menu

---

## 🏠 HOMEPAGE

### Hero Section
- [x] Full-width hero container
- [x] Single powerful lifestyle image (no sliders)
- [x] Large serif headline
- [x] Short supporting tagline
- [x] Two CTA buttons:
  - [x] Primary: Solid dark
  - [x] Secondary: Outline/ghost
- [x] Calm neutral background

### Collections Section
- [x] Grid layout (2-3 columns max)
- [x] Large image cards for:
  - [x] Wedding Silks
  - [x] Kanchipuram Classics
  - [x] Soft Silks
  - [x] Gift Collections
- [x] Minimal text overlay
- [x] Hover: slight zoom + fade text

### Brand Story Section
- [x] Heritage image (store/loom/silk texture)
- [x] Serif heading
- [x] Emotional paragraph about legacy
- [x] Trust-building tone

### Featured Products Section
- [x] Clean grid layout
- [x] Large product images (no borders)
- [x] Subtle price display
- [x] Hover: image zoom + "View Details" fade

### Testimonials Section
- [x] Customer review cards
- [x] Star ratings
- [x] Clean layout

### Trust & Newsletter Section
- [x] Newsletter signup form (Integrated into Footer)
- [x] Incentive for signup (discount)
- [x] Trust badges (secure payments, returns)

---

## 🛍️ PRODUCT CATALOG

### Category Structure
- [x] Multi-level categories:
  - [x] Wedding Sarees
  - [x] Kanchipuram Silk
    - [x] Fancy Kanjivarams
    - [x] Kanchipuram Pattu Sarees
  - [x] Soft Silk
  - [x] Gift Sarees
  - [x] Pavadas
  - [x] Dupattas
  - [x] Men's Corner
  - [x] Materials

### Product Listing Page
- [x] Product grid with large images
- [x] Filter system by:
  - [x] Price range
  - [x] Product type
  - [x] Fabric
  - [x] Color
- [x] Quick view modal
- [x] Pagination/infinite scroll

### Product Detail Page
- [x] Image gallery (60-70% width)
  - [x] Multiple angles
  - [x] Zoom on hover
  - [x] Lifestyle images
- [x] Product info section:
  - [x] Name (serif font)
  - [x] Price (calm styling)
  - [x] Refined description
  - [x] Fabric details
  - [x] Occasion tags
  - [x] Care instructions
- [x] Action buttons:
  - [x] Add to Cart (dark solid)
  - [x] Buy Now (outline)
- [x] Social sharing buttons
- [x] Customer reviews section
- [x] NO blinking offers or aggressive badges

---

## 🛒 CART & CHECKOUT

### Cart
- [ ] Cart sidebar/page
- [ ] Product thumbnails
- [ ] Quantity controls
- [ ] Remove item option
- [ ] Cart total calculation
- [ ] Coupon code input

### Checkout Flow
- [ ] Guest checkout option
- [ ] Address form with auto-suggest
- [ ] Payment method selection:
  - [ ] UPI
  - [ ] Cards
  - [ ] Wallets
- [ ] Estimated delivery cost
- [ ] Shipping time display
- [ ] Order summary
- [ ] Order confirmation page

---

## 📱 MOBILE EXPERIENCE

- [ ] Fully responsive layouts
- [ ] Touch-friendly interactions
- [ ] Sticky bottom "Add to Cart" button
- [ ] Large tappable areas
- [ ] Scroll-focused navigation
- [ ] Mobile-first approach
- [ ] Luxury app-like feel

---

## 📄 STATIC PAGES

### About Us Page
- [x] Brand story content
- [x] Heritage imagery
- [x] Mission/values

### Contact Page
- [x] Address: 59, Viladadikoil Street, Kancheepuram, Tamil Nadu – 631501
- [x] Email contact form
- [x] Phone number
- [x] Map integration

### Policy Pages
- [ ] Shipping Policy
- [ ] Return Policy
- [ ] Privacy Policy

### Blog/Style Guides
- [ ] Blog listing page
- [ ] Individual blog post template
- [ ] Style guide articles

---

## 🔍 SEARCH & DISCOVERY

- [ ] Global search bar
- [ ] Auto-suggest results
- [ ] Search results page
- [ ] Recent searches (optional)
- [ ] Popular searches (optional)

---

## 📣 MARKETING FEATURES

- [ ] Pop-up offers for first-time visitors
- [ ] Newsletter subscription with incentive
- [ ] Social sharing on product pages
- [ ] Promotional banner support (via Sanity)

---

## 📊 ANALYTICS & SEO

- [ ] Google Analytics integration
- [ ] Google Search Console setup
- [ ] Meta Pixel integration
- [ ] Product schema markup
- [ ] Review schema markup
- [ ] Open Graph metadata
- [ ] Optimized meta descriptions
- [ ] Proper heading hierarchy (single H1)
- [ ] Semantic HTML throughout

---

## 🔒 SECURITY

- [ ] HTTPS/SSL configuration
- [ ] Secure API routes
- [ ] Environment variables management
- [ ] Database not publicly exposed
- [ ] Server-side payment validation
- [ ] Input sanitization

---

## ⚡ PERFORMANCE

- [ ] Page load speed < 3 seconds
- [ ] Mobile Lighthouse score ≥ 90
- [ ] WCAG AA accessibility compliance
- [ ] Image optimization via Cloudinary
- [ ] Code splitting
- [ ] Server Components usage

---

## 🚀 DEPLOYMENT

- [ ] Configure Vercel project
- [ ] Set up environment variables
- [ ] Connect custom domain
- [ ] Set up CI/CD (optional)
- [ ] Launch checklist verification

---

## 📈 SUCCESS METRICS (POST-LAUNCH)

- [ ] Monitor bounce rate (target: ↓20%)
- [ ] Track conversion rate (target: ↑15%)
- [ ] Measure AOV (target: ↑10%)
- [ ] Analyze mobile engagement (target: ↑25%)
- [ ] Track newsletter signups (target: ≥1000/month)

---

## 📅 TIMELINE REFERENCE

| Phase | Duration |
|-------|----------|
| Discovery & Wireframes | 1–2 weeks |
| UI Design | 2 weeks |
| Development | 4–6 weeks |
| QA & Testing | 1–2 weeks |
| Launch | 1 week |
