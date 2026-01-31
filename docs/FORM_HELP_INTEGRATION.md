# Form Help Integration Guide

This guide explains how to add inline information/help text to form fields using the `FieldHelp` component and the existing i18n translation files.

## 1) Component

File: `frontend/src/components/FieldHelp.tsx`

Usage:

```tsx
import FieldHelp from '@/components/FieldHelp';
import { useTranslations } from 'next-intl';

function MyField() {
  const t = useTranslations();
  return (
    <label className="block">
      <span className="text-sm font-medium">{t('auth.email')}</span>
      <input type="email" name="email" className="mt-1 block w-full" />
      <FieldHelp text={t('auth.help.email')} />
    </label>
  );
}
```

- `text`: The explanatory text. Prefer short sentences explaining what the field is, why it's needed, and how to fill it.
- `title` (optional): Short heading for the help text.

## 2) i18n

Help strings are stored in the locale files under a `help` key. Examples in `frontend/src/locales/en.json`:

- `auth.help.email`
- `auth.help.password`
- `product.help.price`
- `whiteLabel.help.branding`

Add translations for new languages under the same key path.

## 3) Where to add

Start by adding `FieldHelp` to the most important forms:

- Registration / Login forms (`auth` screens)
- Product create / edit forms (`product` screens)
- White-label / Store settings form (`whiteLabel` screens)
- Checkout address fields (address, phone)

## 4) Best practices

- Keep help text concise (1-2 lines).
- Use actionable guidance: "What", "Why", "How".
  - What: "Your company name"
  - Why: "Shown on invoices and receipts"
  - How: "Use official registered name"
- Use `i18n` keys to make help translatable.
- Avoid repeating UI labels inside the help text.

## 5) Example: Product Form

```tsx
<label className="block">
  <span className="text-sm font-medium">{t('product.price')}</span>
  <input name="price" type="number" className="mt-1 block w-full" />
  <FieldHelp text={t('product.help.price')} />
</label>
```

## 6) Accessibility

- Keep help text visible to all users (don't hide behind hover-only tooltips).
- Use semantic HTML and readable font size.
- If you implement collapsible / tooltip variants, ensure keyboard focus and ARIA attributes are present.

## 7) Next steps

- Integrate `FieldHelp` into the registration, product, and white-label forms.
- Add missing translations for all supported languages.
- Review content with product and legal teams for compliance (especially payment/help text).


---

Created: January 2026
