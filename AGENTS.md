# SILK Homes website — agent instructions

## Scope

This repository is the SILK Homes static website. It contains public-facing presentation code and approved website assets. Read CLAUDE.md for the detailed site standards and README.md for the project overview.

## Privacy boundary

- Do not add homes.csv to this repository. It is private SharePoint inventory and is intentionally ignored locally.
- The private source-of-truth copy lives in SILKCorp/overview.
- Never commit street addresses, SharePoint URLs, connection details, raw photo metadata, CR2/HEIC originals, or unapproved assets here.
- Public site work should use only deliberately selected and approved derivatives.

## Working rules

- Preserve the existing static HTML/CSS/asset structure unless a change explicitly requires restructuring.
- Inspect related pages and shared styles before changing a component; keep navigation and repeated layout elements consistent.
- Maintain semantic HTML, accessibility, responsive behavior, descriptive image alt text, and the SEO requirements in CLAUDE.md.
- Test changed pages locally and check links, layout, and console errors before handoff.
- Keep changes focused and reviewable. Do not rewrite unrelated pages or delete existing assets without a clear reason.

## Photo workflow

Use the private overview repository to locate source material. The curation sequence is:

1. Reconcile duplicate collections by property.
2. Hand-select approved exterior, interior, room, detail, and lifestyle images.
3. Prepare appropriately sized public derivatives.
4. Add only those approved derivatives and their public-facing captions/alt text to this repository.

Do not use the website repository as a source archive.

## Agent handoff

When a change affects the site's content, navigation, image system, or public messaging, document the relevant decision in the private overview repository rather than copying private source-location details into public code.
