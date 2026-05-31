export const SPECIALTY_OPTIONS = [
  "Lockbox Installation",
  "Occupancy Verification",
  "Property Photography",
  "Video Walkthroughs",
  "Vacant Property Checks",
  "Sign Placement",
  "Contractor Meetups",
  "Document Delivery",
  "Utility Checks",
  "Showing Assistance",
  "Property Preservation",
  "General Property Inspections",
] as const;

export const PRICING_SERVICES: Array<{ key: string; label: string }> = [
  { key: "rate_lockbox_install", label: "Lockbox Installation" },
  { key: "rate_occupancy_check", label: "Occupancy Check" },
  { key: "rate_property_photos", label: "Property Photos" },
  { key: "rate_video_walkthrough", label: "Video Walkthrough" },
  { key: "rate_sign_placement", label: "Sign Placement" },
];

export const EXPERIENCE_FIELDS: Array<{ key: string; yearsKey: string; label: string }> = [
  { key: "real_estate_experience", yearsKey: "real_estate_years", label: "Real estate" },
  { key: "contractor_experience", yearsKey: "contractor_years", label: "Contractor" },
  { key: "property_management_experience", yearsKey: "property_management_years", label: "Property management" },
  { key: "realtor_experience", yearsKey: "realtor_years", label: "Licensed realtor" },
];

export function relativeTimeFromNow(iso: string | null | undefined): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  if (diff < 0) return "just now";
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

export function isOnline(lastActiveAt: string | null | undefined): boolean {
  if (!lastActiveAt) return false;
  return Date.now() - new Date(lastActiveAt).getTime() < 5 * 60 * 1000;
}

export function trustScore(p: {
  email_verified?: boolean | null;
  phone_verified?: boolean | null;
  identity_verified?: boolean | null;
  background_check_verified?: boolean | null;
  insurance_verified?: boolean | null;
  verified_status?: boolean | null;
}): number {
  let s = 0;
  if (p.email_verified) s += 15;
  if (p.phone_verified) s += 15;
  if (p.identity_verified) s += 20;
  if (p.background_check_verified) s += 25;
  if (p.insurance_verified) s += 15;
  if (p.verified_status) s += 10;
  return Math.min(100, s);
}