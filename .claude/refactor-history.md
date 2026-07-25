# Refactor history

Watermark log for the `refactor-code` skill. Each run appends one line (newest last). The commit id between the `==>` markers is the next run's scope boundary — `refactor-code` only touches files changed since it.

Format: `DD.MM.YYYY HH:MM ==> <shortCommitId> ==> refactored <short description>`

<!-- Example (ignored by the skill): 01.01.2026 09:00 ==> <shortCommitId> ==> refactored home widgets to FSD -->
25.07.2026 13:23 ==> 331ad16 ==> refactored new case hooks onto shared useMockQuery (DRY)
