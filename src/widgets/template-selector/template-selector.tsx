import { Check } from "lucide-react";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import {
  groupedProceduralDocumentTemplates,
  type ProceduralDocumentTemplate,
} from "@/shared/constants/document-templates";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";
import { cn } from "@/shared/lib/utils";

export interface TemplateSelectorProps {
  selectedId: string | null;
  onSelect: (template: ProceduralDocumentTemplate) => void;
  className?: string;
}

/**
 * "Sud hujjatlari" template selector (mockup-06): 5 grouped card rows over
 * the 17 procedural document templates — one card per template (icon, title,
 * FPK article), highlighting the active selection.
 */
export function TemplateSelector({ selectedId, onSelect, className }: TemplateSelectorProps) {
  const { t } = useTranslation();
  const groups = groupedProceduralDocumentTemplates();

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <h2 className="text-sm font-semibold text-foreground">
        {t("documentsWorkspace.templateSelector.title")}
      </h2>
      {groups.map(({ group, templates }) => (
        <div key={group} className="flex flex-col gap-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t(`documentsWorkspace.templateSelector.groups.${group}` as MessageKey)}
          </h3>
          <div className="flex flex-col gap-2">
            {templates.map((tpl) => {
              const Icon = tpl.icon;
              const isSelected = tpl.id === selectedId;
              return (
                <Card
                  key={tpl.id}
                  className={cn(
                    "flex flex-row items-center gap-3 p-3 transition-colors",
                    isSelected && "border-gold bg-gold-soft"
                  )}
                >
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground",
                      isSelected && "bg-gold text-gold-foreground"
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium text-foreground">
                      {t(tpl.titleKey)}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {t("documentsWorkspace.templateSelector.article", { code: tpl.articleCode })}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant={isSelected ? "gold" : "outline"}
                    onClick={() => onSelect(tpl)}
                    aria-pressed={isSelected}
                  >
                    {isSelected ? <Check className="size-4" /> : null}
                    {t(
                      isSelected
                        ? "documentsWorkspace.templateSelector.selectedCta"
                        : "documentsWorkspace.templateSelector.selectCta"
                    )}
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default TemplateSelector;
