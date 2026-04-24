# @tacocrew/gigatacos-client — DEPRECATED

> This package is retained for historical reference only. No code in the
> monorepo imports it.

Giga Tacos migrated its ordering backend from the bespoke PHP stack at
`gt-lausanne.ch` to the third-party SaaS [commande.app](https://commande.app).
The two systems share nothing — transport (AJAX + CSRF vs. tRPC JSON),
payload shape (HTML + `FormData` vs. typed JSON envelopes), and domain
vocabulary (tacos-first vs. generic `product`/`optionGroup`/`variant`) all
changed.

Use [`@tacocrew/commande-client`](../commande-client/) instead.

Migration context: [`docs/plans/commande-client-migration.md`](../../docs/plans/commande-client-migration.md).

The captured HAR that was used to reverse-engineer commande.app lives at
`commande.app.har` in this folder — not shipped with the package, kept as a
reference artifact.
