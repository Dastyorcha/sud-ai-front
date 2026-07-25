import { motion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  /** Controlled active tab id — when set, `onTabChange` drives selection (e.g. URL state). */
  activeTab?: string;
  onTabChange?: (id: string) => void;
  variant?: "underline" | "pills" | "bordered" | "solid";
  className?: string;
}

export default function Tabs({
  tabs,
  defaultTab,
  activeTab: controlledTab,
  onTabChange,
  variant = "underline",
  className = "",
}: TabsProps) {
  const [internalTab, setInternalTab] = useState(defaultTab || tabs[0]?.id);
  const [isOpen, setIsOpen] = useState(false);
  const activeTab = controlledTab ?? internalTab;

  function setActiveTab(id: string) {
    onTabChange?.(id);
    if (controlledTab === undefined) setInternalTab(id);
  }

  const activeContent = tabs.find((tab) => tab.id === activeTab)?.content;
  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  const variantStyles: Record<
    NonNullable<TabsProps["variant"]>,
    {
      container: string;
      button: string;
      active: string;
      inactive: string;
      indicator: string;
    }
  > = {
    underline: {
      container: "w-fit gap-1 border-b border-border",
      button: "px-6 py-3 font-medium transition-colors relative",
      active: "text-primary",
      inactive: "text-muted-foreground hover:text-foreground",
      indicator: "absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full",
    },
    pills: {
      container: "w-fit gap-2 flex-wrap",
      button: "px-6 py-2.5 font-medium transition-all rounded-full relative",
      active: "text-primary",
      inactive: "text-muted-foreground hover:text-foreground hover:bg-muted",
      indicator: "absolute inset-0 bg-primary rounded-full -z-10",
    },
    bordered: {
      container: "w-fit gap-2 flex-wrap",
      button: "px-6 py-2.5 font-medium transition-all rounded-lg border relative",
      active: "text-primary border-primary bg-primary/5",
      inactive: "text-muted-foreground border-border hover:border-primary/50 hover:text-foreground",
      indicator: "",
    },
    solid: {
      container: "w-fit gap-1 bg-muted p-1 rounded-lg",
      button: "px-6 py-2.5 font-medium transition-all rounded-md relative",
      active: "text-primary",
      inactive: "text-muted-foreground hover:text-foreground",
      indicator: "absolute inset-0 bg-primary rounded-md -z-10 shadow-sm",
    },
  };

  const styles = variantStyles[variant] || variantStyles.underline;

  return (
    <div className={cn("min-w-0", className)}>
      {/* Desktop View */}
      <div className={`hidden max-w-full overflow-x-auto md:flex ${styles.container}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`${styles.button} shrink-0 whitespace-nowrap ${activeTab === tab.id ? styles.active : styles.inactive}`}
          >
            <span className="flex items-center gap-2 relative z-10">
              {tab.icon}
              {tab.label}
            </span>
            {activeTab === tab.id && styles.indicator && (
              <motion.div
                layoutId={`tab-indicator-${variant}`}
                className={styles.indicator}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-card border border-border rounded-lg font-medium text-foreground hover:bg-muted transition-colors"
          >
            <span className="flex items-center gap-2">
              {activeTabData?.icon}
              {activeTabData?.label}
            </span>
            <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={20} />
            </motion.div>
          </button>

          {isOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden"
              >
                {tabs.map((tab, index) => (
                  <motion.button
                    key={tab.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-3 font-medium transition-colors text-left ${
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </motion.button>
                ))}
              </motion.div>
            </>
          )}
        </div>
        {variant === "underline" && <div className="h-px bg-border mt-4"></div>}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-6"
      >
        {activeContent}
      </motion.div>
    </div>
  );
}
