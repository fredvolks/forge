# Folding demo — first functional increment

Local demo remains the explicitly authorized persistence mode. No data is sent
to Supabase. Existing catalogue items and legacy sketches remain untouched.

Implemented: real dimension input separate from uncalibrated legacy sketch pixels,
inch/mm conversion, fractions, relative segment rotations, fixed/employee lengths,
min/max/step validation, derived 2D preview, explicit publication on catalogue save,
immutable local version history, generated employee measurement fields, frozen
version + configured geometry at basket insertion, persisted order snapshot and
historical drawing in order details. Duplicate items start with no published
history. Five domain tests pass including V1 order after V2 publication. Build
passes. No browser acceptance test performed for this increment.

Still incomplete against the complete specification: unified drawing/parametric
editor (legacy sketch remains separate and is not a manufacturing source),
interactive 3D, radii/double-fold controls and rendering, undo/redo for numeric
edits, templates, PDF, live employee preview, local concurrent edit detection,
full role enforcement, server activation and full responsive acceptance testing.
Do not call the full folding module finished or production-ready.
