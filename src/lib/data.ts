export type ModuleId =
  | "today"
  | "properties"
  | "tenants"
  | "actions"
  | "calendar"
  | "meetings"
  | "notes"
  | "security"
  | "communications"
  | "turnover"
  | "financials"
  | "leases"
  | "documents"
  | "ai"
  | "settings";
export const modules: {
  id: ModuleId;
  label: string;
  short: string;
  group: string;
  description: string;
}[] = [
  {
    id: "today",
    label: "Today / Daily Brief",
    short: "Today",
    group: "WORKSPACE",
    description: "Your day, brought into focus.",
  },
  {
    id: "actions",
    label: "Master Actions",
    short: "Actions",
    group: "WORKSPACE",
    description: "Every commitment. One clear next step.",
  },
  {
    id: "calendar",
    label: "My Calendar",
    short: "Calendar",
    group: "WORKSPACE",
    description: "Make room for the work that matters.",
  },
  {
    id: "meetings",
    label: "Meeting Intelligence",
    short: "Meetings",
    group: "WORKSPACE",
    description: "From conversations to clarity.",
  },
  {
    id: "communications",
    label: "Communications",
    short: "Communications",
    group: "WORKSPACE",
    description: "The conversations behind your portfolio.",
  },
  {
    id: "notes",
    label: "General Notes",
    short: "Notes",
    group: "WORKSPACE",
    description:
      "Capture observations, decisions and useful context by building.",
  },
  {
    id: "security",
    label: "Weekly Security Reports",
    short: "Security",
    group: "PORTFOLIO",
    description: "Keep dated site reports, incidents and follow-up together.",
  },
  {
    id: "properties",
    label: "My Properties",
    short: "Properties",
    group: "PORTFOLIO",
    description: "A considered view of your property world.",
  },
  {
    id: "tenants",
    label: "Tenants & Contacts",
    short: "Tenants & contacts",
    group: "PORTFOLIO",
    description: "People, businesses and the places they belong.",
  },
  {
    id: "financials",
    label: "Arrears & Financials",
    short: "Arrears & financials",
    group: "PORTFOLIO",
    description: "See your exposure. Focus your follow-ups.",
  },
  {
    id: "turnover",
    label: "Turnover Management",
    short: "Turnover",
    group: "PORTFOLIO",
    description: "Stay ahead of every monthly return.",
  },
  {
    id: "leases",
    label: "Leases & Vacancies",
    short: "Leases & vacancies",
    group: "PORTFOLIO",
    description: "A clear view of what is occupied, and what is next.",
  },
  {
    id: "documents",
    label: "Documents & Reports",
    short: "Documents & reports",
    group: "INTELLIGENCE",
    description: "The right information, always in reach.",
  },
  {
    id: "ai",
    label: "Notara AI",
    short: "Notara AI",
    group: "INTELLIGENCE",
    description: "Intelligence with context. Answers with sources.",
  },
  {
    id: "settings",
    label: "Settings & Integrations",
    short: "Settings & integrations",
    group: "SETTINGS",
    description: "Make Notara work your way.",
  },
];
