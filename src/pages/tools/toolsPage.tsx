import { motion } from "motion/react";
import {
  Palette,
  Type,
  Square,
  Circle,
  Zap,
  Eye,
  Copy,
  Check,
  Home,
  User,
  Settings,
  Bell,
  PenTool,
  Globe,
  Tag,
  ListChecks,
  ShieldCheck,
  AudioLines,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import NoData from "@/shared/components/ui/noData";
import Tabs from "@/shared/components/ui/tabs";
import LangSwitcher from "@/shared/custom/lang-switcher";
import { ThemeToggle } from "@/shared/custom/theme-toggle";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import { StatusBadge } from "@/shared/custom/status-badge";
import { Money } from "@/shared/custom/money";
import { DateText } from "@/shared/custom/date-text";
import { DetailGrid } from "@/shared/custom/detail-grid";
import { LoadingState } from "@/shared/custom/loading-state";
import { EmptyState } from "@/shared/custom/empty-state";
import { ErrorState } from "@/shared/custom/error-state";
import { PermissionDenied } from "@/shared/custom/permission-denied";
import { Can } from "@/shared/custom/can";
import { usePermission } from "@/features/auth/use-permission";
import { useAuth } from "@/features/auth/use-auth";
import { Timestamp } from "@/shared/custom/record/timestamp";
import { SpeakerChip } from "@/shared/custom/record/speaker-chip";
import { ConfidenceBar } from "@/shared/custom/record/confidence-bar";
import { RecordStateBadge } from "@/shared/custom/record/record-state-badge";
import { CriticalFieldMark } from "@/shared/custom/record/critical-field-mark";
import { RecordSpine } from "@/shared/custom/record/record-spine";

export default function ToolsPage() {
  const { locale, t, formatMoney, formatDate } = useTranslation();
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const { user } = useAuth();
  const { can } = usePermission();

  const colors = [
    { name: "Background", value: "#f5f7fb", class: "bg-background" },
    { name: "Foreground", value: "#172033", class: "bg-foreground" },
    { name: "Card", value: "#ffffff", class: "bg-card" },
    { name: "Card Foreground", value: "#172033", class: "bg-card-foreground" },
    { name: "Primary", value: "#2457d6", class: "bg-primary" },
    { name: "Primary Foreground", value: "#ffffff", class: "bg-primary-foreground" },
    { name: "Primary Soft", value: "#eaf0ff", class: "bg-primary-soft" },
    { name: "Secondary", value: "#f8fafc", class: "bg-secondary" },
    { name: "Muted", value: "#f8fafc", class: "bg-muted" },
    { name: "Muted Foreground", value: "#667085", class: "bg-muted-foreground" },
    { name: "Accent", value: "#eaf0ff", class: "bg-accent" },
    { name: "Accent Foreground", value: "#2457d6", class: "bg-accent-foreground" },
    { name: "Border", value: "#e5eaf2", class: "bg-border" },
    { name: "Input", value: "#e5eaf2", class: "bg-input" },
    { name: "Ring", value: "#2457d6", class: "bg-ring" },
  ];

  const statusColors = [
    { name: "Destructive", value: "#b42318", class: "bg-destructive" },
    { name: "Destructive Soft", value: "#fff0ef", class: "bg-destructive-soft" },
    { name: "Success", value: "#14804a", class: "bg-success" },
    { name: "Success Soft", value: "#e9f8f0", class: "bg-success-soft" },
    { name: "Warning", value: "#a15c00", class: "bg-warning" },
    { name: "Warning Soft", value: "#fff4df", class: "bg-warning-soft" },
  ];

  const riskColors = [
    { name: "Risk Low", value: "#2e9f68", class: "bg-risk-low" },
    { name: "Risk Medium", value: "#e59b24", class: "bg-risk-medium" },
    { name: "Risk High", value: "#df5a4c", class: "bg-risk-high" },
    { name: "Risk Critical", value: "#7e3ab8", class: "bg-risk-critical" },
  ];

  const chartColors = [
    { name: "Chart 1", value: "#2457d6", class: "bg-chart-1" },
    { name: "Chart 2", value: "#14804a", class: "bg-chart-2" },
    { name: "Chart 3", value: "#a15c00", class: "bg-chart-3" },
    { name: "Chart 4", value: "#b42318", class: "bg-chart-4" },
    { name: "Chart 5", value: "#7047c8", class: "bg-chart-5" },
  ];

  const sidebarColors = [
    { name: "Sidebar", value: "#101828", class: "bg-sidebar" },
    { name: "Sidebar Foreground", value: "#ffffff", class: "bg-sidebar-foreground" },
    { name: "Sidebar Primary", value: "#2457d6", class: "bg-sidebar-primary" },
    {
      name: "Sidebar Primary Foreground",
      value: "#ffffff",
      class: "bg-sidebar-primary-foreground",
    },
    { name: "Sidebar Accent", value: "#1d2939", class: "bg-sidebar-accent" },
    {
      name: "Sidebar Accent Foreground",
      value: "#ffffff",
      class: "bg-sidebar-accent-foreground",
    },
    { name: "Sidebar Border", value: "#1d2939", class: "bg-sidebar-border" },
    { name: "Sidebar Ring", value: "#4f7cff", class: "bg-sidebar-ring" },
  ];

  const courtThemeColors = [
    { name: "Gold", value: "#b7862a", class: "bg-gold" },
    { name: "Gold Foreground", value: "#ffffff", class: "bg-gold-foreground" },
    { name: "Gold Soft", value: "#fdf3e0", class: "bg-gold-soft" },
    { name: "Stage 1", value: "#2457d6", class: "bg-stage-1" },
    { name: "Stage 2", value: "#7047c8", class: "bg-stage-2" },
    { name: "Stage 3", value: "#0891b2", class: "bg-stage-3" },
    { name: "Stage 4", value: "#a15c00", class: "bg-stage-4" },
    { name: "Stage 5", value: "#14804a", class: "bg-stage-5" },
    { name: "Stage 6", value: "#667085", class: "bg-stage-6" },
    { name: "Speaker 1", value: "#d6336c", class: "bg-speaker-1" },
    { name: "Speaker 2", value: "#2457d6", class: "bg-speaker-2" },
    { name: "Speaker 3", value: "#14804a", class: "bg-speaker-3" },
    { name: "Speaker 4", value: "#a15c00", class: "bg-speaker-4" },
    { name: "Status OK", value: "#14804a", class: "bg-status-ok" },
    { name: "Status Warning", value: "#a15c00", class: "bg-status-warning" },
    { name: "Status Error", value: "#b42318", class: "bg-status-error" },
  ];

  const tabs = [
    {
      id: "home",
      label: "Home",
      icon: <Home size={18} />,
      content: (
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-xl font-bold text-foreground mb-2">Home Content</h3>
          <p className="text-muted-foreground">
            This is the home tab content. You can put any React component here.
          </p>
        </div>
      ),
    },
    {
      id: "profile",
      label: "Profile",
      icon: <User size={18} />,
      content: (
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-xl font-bold text-foreground mb-2">Profile Content</h3>
          <p className="text-muted-foreground">User profile information and settings go here.</p>
        </div>
      ),
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: <Bell size={18} />,
      content: (
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-xl font-bold text-foreground mb-2">Notifications</h3>
          <p className="text-muted-foreground">Your recent notifications will appear here.</p>
        </div>
      ),
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings size={18} />,
      content: (
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-xl font-bold text-foreground mb-2">Settings</h3>
          <p className="text-muted-foreground">Configure your application settings here.</p>
        </div>
      ),
    },
  ];

  const copyToClipboard = (color: string, name: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(name);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-black text-primary mb-4">Design System</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore our comprehensive design system including colors, buttons, and components
          </p>
        </motion.div>

        {/* Main Colors Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-8">
            <Palette className="text-primary" size={32} />
            <h2 className="text-3xl font-bold text-primary">Main Color Palette</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {colors.map((color, index) => (
              <motion.div
                key={color.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-card rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border border-border"
              >
                <div className={`h-32 ${color.class}`}></div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-foreground">{color.name}</h3>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => copyToClipboard(color.value, color.name)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      {copiedColor === color.name ? (
                        <Check size={20} className="text-success" />
                      ) : (
                        <Copy size={20} className="text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono break-all">{color.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Chart Colors Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-8">
            <Circle className="text-primary" size={32} />
            <h2 className="text-3xl font-bold text-primary">Chart Colors</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {chartColors.map((color, index) => (
              <motion.div
                key={color.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-card rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border border-border"
              >
                <div className={`h-32 ${color.class}`}></div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-foreground">{color.name}</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(color.value, color.name)}
                    >
                      {copiedColor === color.name ? (
                        <Check size={20} className="text-success" />
                      ) : (
                        <Copy size={20} className="text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono break-all">{color.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Status & Risk Colors Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-8">
            <Circle className="text-primary" size={32} />
            <h2 className="text-3xl font-bold text-primary">Status & Risk Colors</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...statusColors, ...riskColors].map((color) => (
              <div
                key={color.name}
                className="bg-card rounded-2xl shadow-lg overflow-hidden border border-border"
              >
                <div className={`h-24 ${color.class}`}></div>
                <div className="p-5 flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-foreground">{color.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{color.value}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(color.value, color.name)}
                  >
                    {copiedColor === color.name ? (
                      <Check size={20} className="text-success" />
                    ) : (
                      <Copy size={20} className="text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Sidebar Colors Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-8">
            <Square className="text-primary" size={32} />
            <h2 className="text-3xl font-bold text-primary">Sidebar Colors</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sidebarColors.map((color, index) => (
              <motion.div
                key={color.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-card rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border border-border"
              >
                <div className={`h-32 ${color.class}`}></div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-foreground">{color.name}</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(color.value, color.name)}
                    >
                      {copiedColor === color.name ? (
                        <Check size={20} className="text-success" />
                      ) : (
                        <Copy size={20} className="text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono break-all">{color.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Court Theme Colors Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-8">
            <Circle className="text-gold" size={32} />
            <h2 className="text-3xl font-bold text-primary">Court Theme Colors</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courtThemeColors.map((color, index) => (
              <motion.div
                key={color.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-card rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border border-border"
              >
                <div className={`h-24 ${color.class}`}></div>
                <div className="p-5 flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-foreground">{color.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{color.value}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(color.value, color.name)}
                  >
                    {copiedColor === color.name ? (
                      <Check size={20} className="text-success" />
                    ) : (
                      <Copy size={20} className="text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Buttons Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-8">
            <Zap className="text-primary" size={32} />
            <h2 className="text-3xl font-bold text-primary">Button Variants</h2>
          </div>
          <div className="bg-card rounded-2xl shadow-lg p-8 border border-border">
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-4">Default Buttons</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button variant="default">
                    <Zap size={20} />
                    Default Button
                  </Button>
                  <Button variant="secondary">
                    <Eye size={20} />
                    Secondary Button
                  </Button>
                  <Button variant="outline">
                    <Circle size={20} />
                    Outline Button
                  </Button>
                  <Button variant="ghost">
                    <Type size={20} />
                    Ghost Button
                  </Button>
                  <Button variant="destructive">
                    <Zap size={20} />
                    Destructive Button
                  </Button>
                  <Button variant="icon" size="icon">
                    <Eye size={20} />
                  </Button>
                  <Button variant="gold">
                    <Zap size={20} />
                    Gold Button
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground mb-4">Button Sizes</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button>Default Button</Button>
                  <Button size="sm">Small Button</Button>
                  <Button size="lg">Large Button</Button>
                  <Button size="icon">
                    <PenTool />
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground mb-4">Disabled State</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button variant="default" disabled>
                    Disabled Default
                  </Button>
                  <Button variant="outline" disabled>
                    Disabled Outline
                  </Button>
                  <Button variant="destructive" disabled>
                    Disabled Destructive
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Typography Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-8">
            <Type className="text-primary" size={32} />
            <h2 className="text-3xl font-bold text-primary">Typography</h2>
          </div>
          <div className="bg-card rounded-2xl shadow-lg p-8 border border-border">
            <div className="space-y-6">
              <div>
                <h1 className="text-5xl font-black text-foreground mb-2">Heading 1</h1>
                <p className="text-sm text-muted-foreground font-mono">text-5xl font-black</p>
              </div>
              <div>
                <h2 className="text-4xl font-bold text-foreground mb-2">Heading 2</h2>
                <p className="text-sm text-muted-foreground font-mono">text-4xl font-bold</p>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-foreground mb-2">Heading 3</h3>
                <p className="text-sm text-muted-foreground font-mono">text-3xl font-bold</p>
              </div>
              <div>
                <p className="text-lg text-foreground mb-2">
                  Body Large - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </p>
                <p className="text-sm text-muted-foreground font-mono">text-lg</p>
              </div>
              <div>
                <p className="text-base text-foreground mb-2">
                  Body Regular - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </p>
                <p className="text-sm text-muted-foreground font-mono">text-base</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Body Small - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </p>
                <p className="text-sm text-muted-foreground font-mono">
                  text-sm text-muted-foreground
                </p>
              </div>
              <div>
                <p className="font-serif text-lg text-foreground mb-2">
                  Font Serif — Court identity fallback stack for formal document copy.
                </p>
                <p className="text-sm text-muted-foreground font-mono">font-serif</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* other components */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-8">
            <Square className="text-primary" size={32} />
            <h2 className="text-3xl font-bold text-primary">Tabs examples</h2>
          </div>
          <div className="bg-card rounded-2xl shadow-lg p-8 border border-border">
            <div className="space-y-12">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Underline Tabs</h2>
                <Tabs tabs={tabs} variant="underline" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Pills Tabs</h2>
                <Tabs tabs={tabs} variant="pills" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Bordered Tabs</h2>
                <Tabs tabs={tabs} variant="bordered" defaultTab="profile" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Solid Tabs</h2>
                <Tabs tabs={tabs} variant="solid" />
              </div>
            </div>
          </div>
        </motion.section>

        {/* Internationalization */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-8">
            <Globe className="text-primary" size={32} />
            <h2 className="text-3xl font-bold text-primary">Language switcher</h2>
          </div>
          <div className="bg-card rounded-2xl shadow-lg p-8 border border-border">
            <div className="flex flex-wrap items-center gap-6">
              <LangSwitcher />
              <p className="text-sm text-muted-foreground">
                {t("nav.dashboard")} · {formatMoney(1250000)} · {formatDate(new Date())} ·{" "}
                <span className="font-mono">{locale}</span>
              </p>
            </div>
          </div>
        </motion.section>

        {/* Theme toggle */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.75 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-8">
            <Eye className="text-primary" size={32} />
            <h2 className="text-3xl font-bold text-primary">Theme toggle</h2>
          </div>
          <div className="bg-card rounded-2xl shadow-lg p-8 border border-border">
            <div className="flex flex-wrap items-center gap-4">
              <ThemeToggle />
              <p className="text-sm text-muted-foreground">
                Flips light/dark via `next-themes`, persisted across reloads.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Empty / error state */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-8">
            <Square className="text-primary" size={32} />
            <h2 className="text-3xl font-bold text-primary">Empty / error state</h2>
          </div>
          <div className="bg-card rounded-2xl shadow-lg p-8 border border-border">
            <NoData />
            <NoData
              title={t("errors.forbiddenTitle")}
              description={t("errors.forbiddenDescription")}
            />
          </div>
        </motion.section>

        {/* Status badges */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.85 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-8">
            <Tag className="text-primary" size={32} />
            <h2 className="text-3xl font-bold text-primary">Status badges</h2>
          </div>
          <div className="bg-card rounded-2xl shadow-lg p-8 border border-border space-y-8">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-3">Tones</h3>
              <div className="flex flex-wrap gap-3">
                <StatusBadge label="Neutral" tone="neutral" />
                <StatusBadge label="Primary" tone="primary" />
                <StatusBadge label="Success" tone="success" />
                <StatusBadge label="Warning" tone="warning" />
                <StatusBadge label="Destructive" tone="destructive" />
                <StatusBadge label="Info" tone="info" />
              </div>
            </div>
          </div>
        </motion.section>

        {/* Record primitives (LexKotib) */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.87 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-8">
            <AudioLines className="text-primary" size={32} />
            <h2 className="text-3xl font-bold text-primary">Record primitives (LexKotib)</h2>
          </div>
          <div className="bg-card rounded-2xl shadow-lg p-8 border border-border space-y-8">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-3">Timestamp</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Timestamp ms={70_000} />
                <Timestamp ms={5_062_000} />
                <Timestamp ms={862_000} onSeek={() => undefined} />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-foreground mb-3">Speaker chip</h3>
              <div className="flex flex-wrap items-center gap-3">
                <SpeakerChip label="SPEAKER_02" />
                <SpeakerChip label="SPEAKER_01" roleLabel={t("enums.participantRole.Judge")} />
                <SpeakerChip
                  label="SPEAKER_03"
                  roleLabel={t("enums.participantRole.ClaimantRepresentative")}
                  conflicting
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-foreground mb-3">Confidence bar</h3>
              <div className="max-w-sm space-y-3">
                <ConfidenceBar value={0.94} />
                <ConfidenceBar value={0.62} />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-foreground mb-3">Record state badge</h3>
              <div className="flex flex-wrap gap-3">
                <RecordStateBadge kind="hearing" status="RECORDING" />
                <RecordStateBadge kind="segment" status="VERIFIED" />
                <RecordStateBadge kind="document" status="AI_GENERATED" />
                <RecordStateBadge kind="document" status="APPROVED" />
                <RecordStateBadge kind="job" status="FAILED" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-foreground mb-3">Critical field mark</h3>
              <p className="text-sm text-foreground">
                <CriticalFieldMark>250 000 000 so‘m</CriticalFieldMark> ·{" "}
                <CriticalFieldMark reviewed>4-2101-2604/13</CriticalFieldMark>
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-foreground mb-3">Record spine</h3>
              <div className="flex h-64 gap-4 overflow-hidden rounded-lg border border-border">
                <RecordSpine
                  durationMs={2_040_000}
                  playheadMs={862_000}
                  visibleRange={{ startMs: 700_000, endMs: 1_100_000 }}
                  events={[
                    { id: "e1", atMs: 60_000, type: "HearingOpened", verified: true },
                    { id: "e2", atMs: 300_000, type: "RightsExplained", verified: true },
                    { id: "e3", atMs: 862_000, type: "MotionSubmitted", verified: false },
                    { id: "e4", atMs: 1_500_000, type: "ObjectionRaised", verified: false },
                    { id: "e5", atMs: 1_980_000, type: "HearingClosed", verified: true },
                  ]}
                  onSeek={() => undefined}
                />
                <p className="flex-1 p-4 text-sm text-muted-foreground">
                  56px vertical rail — ticks (hollow = unverified, filled = verified), a red
                  playhead line and a shaded visible-range band. Click the rail or a tick to seek.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Value display + detail grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-8">
            <ListChecks className="text-primary" size={32} />
            <h2 className="text-3xl font-bold text-primary">Value display &amp; detail grid</h2>
          </div>
          <div className="bg-card rounded-2xl shadow-lg p-8 border border-border">
            <DetailGrid
              items={[
                { key: "amount", label: "Amount", value: <Money value={12500000} /> },
                { key: "date", label: "Date", value: <DateText value="2026-08-15" /> },
                {
                  key: "status",
                  label: "Status",
                  value: <StatusBadge label="Active" tone="success" />,
                },
              ]}
            />
          </div>
        </motion.section>

        {/* Data-state blocks */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.95 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-8">
            <Square className="text-primary" size={32} />
            <h2 className="text-3xl font-bold text-primary">Data-state blocks</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl shadow-lg p-8 border border-border">
              <h3 className="text-lg font-bold text-foreground mb-3">Loading</h3>
              <LoadingState rows={3} />
            </div>
            <div className="bg-card rounded-2xl shadow-lg p-8 border border-border">
              <h3 className="text-lg font-bold text-foreground mb-3">Empty</h3>
              <EmptyState />
            </div>
            <div className="bg-card rounded-2xl shadow-lg p-8 border border-border">
              <h3 className="text-lg font-bold text-foreground mb-3">Error</h3>
              <ErrorState onRetry={() => undefined} />
            </div>
            <div className="bg-card rounded-2xl shadow-lg p-8 border border-border">
              <h3 className="text-lg font-bold text-foreground mb-3">Permission denied</h3>
              <PermissionDenied />
            </div>
          </div>
        </motion.section>

        {/* Permission gating */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-8">
            <ShieldCheck className="text-primary" size={32} />
            <h2 className="text-3xl font-bold text-primary">Permission gating</h2>
          </div>
          <div className="bg-card rounded-2xl shadow-lg p-8 border border-border space-y-3">
            <p className="text-sm text-muted-foreground">
              Current role: <span className="font-mono text-foreground">{user.role}</span> ·
              record.delete: {can("record.delete") ? "allowed" : "denied"}
            </p>
            <Can action="record.delete" fallback={<PermissionDenied />}>
              <Button variant="destructive">Delete record</Button>
            </Can>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
