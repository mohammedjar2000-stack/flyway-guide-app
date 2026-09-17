# Hero Section UI Lockdown — Permanent Governance

## FROZEN: Hero Search Widget (src/pages/HomePage.tsx)

The Hero Section search card is **permanently locked**. The following must never be removed, repositioned, restyled, or restructured in any future update:

### 1. Search Card Container
- `bg-white rounded-3xl p-6 shadow-2xl` — solid white, no glassmorphism on the card itself
- Max width `max-w-5xl`, centered

### 2. Three Core Inputs (RTL order, horizontal grid `md:grid-cols-12`)
1. **الدولة (Country)** — `md:col-span-3` — global autocomplete input
2. **المدينة (City)** — `md:col-span-3` — global autocomplete input (scoped to selected country)
3. **المنطقة / الحي / الشارع** — `md:col-span-4` — text input with placeholder "أين أنت؟ مثال: تقسيم، وسط دبي، شارع الرشيد..."

### 3. Search Button
- **بحث** — `md:col-span-2` — `bg-brand-600` solid button, leftmost in the row

### 4. GPS Location Button
- **موقعي الحالي** — centered below the row, `bg-brand-50` pill with `Crosshair` icon
- Activates browser geolocation and immediately navigates the map

### 5. Background Carousel
- 4K high-definition narrative slides (medical guidance, transit, everyday proximity, safe arrival)
- True natural colors — NO heavy blue washes or color overlays
- Only subtle top/bottom vignettes (`from-black/70` and `from-black/80` gradients) for text readability
- Ken Burns animation, 5-second auto-play, navigation arrows, dot indicators

## FORBIDDEN Actions
- Do NOT add tabs, filters, or extra options to the search card
- Do NOT remove, merge, or reorder the 3 inputs
- Do NOT change the search button position or styling
- Do NOT alter the GPS button behavior or placement
- Do NOT apply heavy color washes to the background images
- Do NOT replace the solid white card with glassmorphism

## ALLOWED Future Work
- Backend logic, data accuracy, API integration
- Leaflet GIS routing performance optimization
- Dynamic rendering of nearby services list BELOW the hero section (not inside it)
- Geocoding and search result accuracy improvements
- Accessibility and i18n improvements that do not alter visual layout
