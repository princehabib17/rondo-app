# Rondo Street Map Reference

This note translates the Strava design reference into Rondo's map surface. It is
a reference, not a replacement for `rondo-design-system.md`,
`rondo-design-first-playbook.md`, or `rondo-scale-spec.md`.

## Design read

The Rondo map should feel like street futsal at night: asphalt, court lights,
venue flyers, and quick pickup decisions. It borrows Strava's proof-of-activity
pattern, but it stays gold-on-black and Metro Manila-first.

## What to borrow from Strava

- The map proves real action is nearby.
- Pins are primary decision points, not decoration.
- The selected item card should combine location, time, price, and social proof
  in a scannable stat layout.
- Filters should support fast intent: near me, tonight, format, level, and price.
- Motion should confirm state changes only: pin select, sheet reveal, and search
  refresh feedback.

## What not to borrow

- Strava orange, light canvas, route-tracking identity, GPS polylines, elevation
  charts, or heatmaps.
- Map decoration that feels like crypto/neon. Rondo's glow is a court light, not
  an outer bloom.
- Shadows except the allowed floating action affordance. Map overlays use
  elevated fill, hairline borders, and backdrop.

## Rondo map contract

- Tile surface: dark, warm, street-level, and legible.
- Venue pins: gold court markers with a flatter active state and no hard neon.
- Selected game card: match-poster rhythm with venue/area first, then time,
  spots, format, and price.
- Filter chips: street tags such as `Tonight`, `Near me`, `5v5`, `Under PHP 300`,
  and `Indoor`.
- Copy: local and direct. Prefer `Show games here` or `Find courts here` over
  generic map-app phrasing.

