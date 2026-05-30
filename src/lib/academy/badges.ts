import { Camera, Lock, ClipboardCheck, ShieldAlert, MessageCircle, GraduationCap, type LucideIcon } from "lucide-react";

export type SkillBadge = {
  id: string;
  moduleId: string;
  label: string;
  description: string;
  Icon: LucideIcon;
  cls: string;
};

export const SKILL_BADGES: SkillBadge[] = [
  {
    id: "orientation",
    moduleId: "welcome",
    label: "Orientation Complete",
    description: "Completed REI Runner orientation.",
    Icon: GraduationCap,
    cls: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  {
    id: "photographer",
    moduleId: "photo-standards",
    label: "Certified Property Photographer",
    description: "Passed Property Photography Standards.",
    Icon: Camera,
    cls: "bg-amber-500/15 text-amber-200 border-amber-500/40",
  },
  {
    id: "videographer",
    moduleId: "video-standards",
    label: "Walkthrough Video Certified",
    description: "Passed Walkthrough Video Standards.",
    Icon: Camera,
    cls: "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-500/40",
  },
  {
    id: "occupancy",
    moduleId: "occupancy",
    label: "Occupancy Verification Certified",
    description: "Passed Occupancy Check Procedures.",
    Icon: ClipboardCheck,
    cls: "bg-emerald-500/15 text-emerald-200 border-emerald-500/40",
  },
  {
    id: "lockbox",
    moduleId: "lockbox",
    label: "Certified Lockbox Installer",
    description: "Passed Lockbox Installation Procedures.",
    Icon: Lock,
    cls: "bg-indigo-500/15 text-indigo-200 border-indigo-500/40",
  },
  {
    id: "safety",
    moduleId: "conduct",
    label: "Safety Certified",
    description: "Passed Professional Conduct and Safety.",
    Icon: ShieldAlert,
    cls: "bg-red-500/15 text-red-200 border-red-500/40",
  },
  {
    id: "inspection",
    moduleId: "condition-reporting",
    label: "Property Inspection Certified",
    description: "Passed Property Condition Reporting.",
    Icon: ClipboardCheck,
    cls: "bg-teal-500/15 text-teal-200 border-teal-500/40",
  },
  {
    id: "communication",
    moduleId: "client-communication",
    label: "Communication Certified",
    description: "Passed Client Communication.",
    Icon: MessageCircle,
    cls: "bg-violet-500/15 text-violet-200 border-violet-500/40",
  },
];

export function earnedSkillBadges(passedModuleIds: string[]): SkillBadge[] {
  const set = new Set(passedModuleIds);
  return SKILL_BADGES.filter((b) => set.has(b.moduleId));
}

export function getBadgeForModule(moduleId: string): SkillBadge | undefined {
  return SKILL_BADGES.find((b) => b.moduleId === moduleId);
}