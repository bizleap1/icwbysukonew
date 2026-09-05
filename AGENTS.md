# SUKO Atelier Development Guidelines

All developers and AI assistants working on this codebase must strictly observe these design and architecture principles:

1. **Brand Identity & Luxury Theme**:
   - Brand: **SUKO Atelier | The Indian Corporate Wear** (`indiancorporatewear.com`).
   - Theme: Bespoke quiet luxury, warm ivory canvas (`#FAF8F5`), obsidian charcoal (`#111113`), champagne gold accents (`#C2922E`), and delicate hairlines (`#EAE6DF`).
   - No generic blue or cold dark modes. Every customer-facing surface (Storefront, Account, Checkout, Invoices, Emails) must match this luxury theme.

2. **Email & Invoice Communications**:
   - Powered by Resend via verified domain sender: `SUKO Atelier <noreply@indiancorporatewear.com>` with `reply_to: 'support@indiancorporatewear.com'`.
   - All email communications (OTP, invoices, order confirmations, billing) must provide dual multipart bodies (`text` + `html`) matching the SUKO luxury palette.

3. **Mandatory Git Workflow**:
   - At the conclusion of every response or feature work, provide the exact 3 git commands:
     ```bash
     git add .
     git commit -m "..."
     git push origin main
     ```
