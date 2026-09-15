interface Props {
  family: "protocol" | "judgment";
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const OPTIONS = {
  protocol: [
    ["44036", "44036 — kassatsiya bayonnomasi"],
    ["97545", "97545 — kassatsiya bayonnomasi"],
    ["116736", "116736 — apellyatsiya bayonnomasi"],
  ],
  judgment: [
    ["3069268", "3069268 — hukm (Cambria)"],
    ["2537330", "2537330 — hukm (Cambria, ish raqami bilan)"],
    ["2594389", "2594389 — hukm (Cambria)"],
    ["2598145", "2598145 — hukm (Times New Roman)"],
    ["2780480", "2780480 — hukm (Times New Roman)"],
  ],
};

export function ReferenceLayoutSelect({ family, value, onChange, disabled }: Props) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      Namuna formati — lotin yozuvida
      <select
        className="h-10 rounded-md border border-input bg-background px-3 text-foreground"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        {OPTIONS[family].map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select>
    </label>
  );
}
