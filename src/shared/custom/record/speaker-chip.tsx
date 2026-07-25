import { cn } from "@/shared/lib/utils";

export interface SpeakerChipProps {
  /** Provider speaker label, e.g. `SPEAKER_02` (spec §9.6). */
  label: string;
  /** Localized procedural role once the label is mapped to a participant. */
  roleLabel?: string;
  /** True when this label's mapping is contradicted elsewhere (spec UC-03). */
  conflicting?: boolean;
  className?: string;
}

/**
 * A speaker attribution chip (spec §16.2/§16.3). Three states: unmapped shows
 * the provider label in mono with a dashed border (reads as provisional);
 * mapped shows the procedural role; conflicting is flagged in the record-seal
 * (destructive) colour.
 */
export function SpeakerChip({ label, roleLabel, conflicting, className }: SpeakerChipProps) {
  const mapped = Boolean(roleLabel);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs whitespace-nowrap",
        mapped
          ? "border-border text-foreground"
          : "border-dashed border-border font-mono text-muted-foreground",
        conflicting && "border-destructive text-destructive",
        className
      )}
    >
      {mapped ? roleLabel : label}
    </span>
  );
}
