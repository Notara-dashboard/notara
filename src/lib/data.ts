export type ModuleId =
  | "today"
  | "properties"
  | "tenants"
  | "actions"
  | "calendar"
  | "meetings"
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
export type Action = {
  id: string;
  title: string;
  property: string;
  tenant: string;
  due: string;
  priority: "High" | "Medium" | "Low";
  done: boolean;
  archived: boolean;
  notes: string;
};
export const sampleActions: Action[] = [
  {
    id: "act-1",
    title: "Follow up on overdue rental payment",
    property: "The Houghton",
    tenant: "Artisan Coffee Co.",
    due: "2026-10-16",
    priority: "High",
    done: false,
    archived: false,
    notes:
      "Sample: confirm a payment arrangement for Unit G04. Gross debit balance is R 32,500.",
  },
  {
    id: "act-2",
    title: "Review lease renewal proposal",
    property: "Rosebank Quarter",
    tenant: "Studio Collective",
    due: "2026-10-17",
    priority: "High",
    done: false,
    archived: false,
    notes:
      "Sample: review the terms ahead of the lease expiry on 12 November 2026.",
  },
  {
    id: "act-3",
    title: "Request September turnover returns",
    property: "Parkhurst Place",
    tenant: "The Local Kitchen",
    due: "2026-10-17",
    priority: "Medium",
    done: false,
    archived: false,
    notes:
      "Sample: request the outstanding September return and supporting document.",
  },
  {
    id: "act-4",
    title: "Approve common-area maintenance quote",
    property: "The Houghton",
    tenant: "",
    due: "2026-10-19",
    priority: "Low",
    done: false,
    archived: false,
    notes: "Sample: compare quotations before approving any expenditure.",
  },
];
export const properties = [
  {
    id: "prop-1",
    name: "The Houghton",
    address: "Houghton Estate, Johannesburg",
    type: "Mixed use",
    units: 24,
    occupied: 22,
    status: "Active",
    arrears: 32500,
    image: "/properties/houghton.svg",
    color: "blue",
  },
  {
    id: "prop-2",
    name: "Rosebank Quarter",
    address: "Rosebank, Johannesburg",
    type: "Commercial",
    units: 18,
    occupied: 17,
    status: "Active",
    arrears: 18750,
    image: "/properties/rosebank.svg",
    color: "purple",
  },
  {
    id: "prop-3",
    name: "Parkhurst Place",
    address: "Parkhurst, Johannesburg",
    type: "Retail",
    units: 12,
    occupied: 11,
    status: "Active",
    arrears: 15000,
    image: "/properties/parkhurst.svg",
    color: "teal",
  },
  {
    id: "prop-4",
    name: "Sandton Exchange",
    address: "Sandton, Johannesburg",
    type: "Office",
    units: 16,
    occupied: 14,
    status: "Oversight only",
    arrears: 9000,
    image: "/properties/rosebank.svg",
    color: "purple",
  },
];
export const tenants = [
  {
    id: "tenant-1",
    name: "Artisan Coffee Co.",
    contact: "Sarah Mitchell",
    email: "sarah@example.com",
    property: "The Houghton",
    unit: "G04",
    balance: 32500,
    age: "31–60 days",
    lease: "2027-06-30",
    initials: "AC",
    color: "amber",
  },
  {
    id: "tenant-2",
    name: "Studio Collective",
    contact: "James Mokoena",
    email: "james@example.com",
    property: "Rosebank Quarter",
    unit: "201",
    balance: 18750,
    age: "1–30 days",
    lease: "2026-11-12",
    initials: "SC",
    color: "purple",
  },
  {
    id: "tenant-3",
    name: "The Local Kitchen",
    contact: "Priya Naidoo",
    email: "priya@example.com",
    property: "Parkhurst Place",
    unit: "R03",
    balance: 15000,
    age: "1–30 days",
    lease: "2027-03-31",
    initials: "LK",
    color: "teal",
  },
  {
    id: "tenant-4",
    name: "Form & Function",
    contact: "David Williams",
    email: "david@example.com",
    property: "The Houghton",
    unit: "102",
    balance: -4500,
    age: "Credit",
    lease: "2026-12-08",
    initials: "FF",
    color: "blue",
  },
  {
    id: "tenant-5",
    name: "Bloom Wellness",
    contact: "Emma Botha",
    email: "emma@example.com",
    property: "Rosebank Quarter",
    unit: "G02",
    balance: 0,
    age: "Current",
    lease: "2026-12-15",
    initials: "BW",
    color: "pink",
  },
];
export const meetings = [
  {
    id: "meeting-1",
    title: "Portfolio catch-up",
    time: "09:00",
    end: "09:30",
    type: "Weekly check-in",
    property: "All active properties",
    attendees: ["JM", "SN"],
    color: "purple",
  },
  {
    id: "meeting-2",
    title: "Rosebank lease renewal",
    time: "11:00",
    end: "11:45",
    type: "Tenant meeting",
    property: "Rosebank Quarter",
    attendees: ["JM", "SC", "DK"],
    color: "blue",
  },
  {
    id: "meeting-3",
    title: "Site walk · The Houghton",
    time: "14:30",
    end: "15:30",
    type: "On-site inspection",
    property: "The Houghton",
    attendees: ["JM", "TN"],
    color: "teal",
  },
];
export const messages = [
  {
    id: "msg-1",
    from: "Sarah Mitchell",
    initials: "SM",
    title: "Re: Rental payment arrangement",
    text: "Thank you for your patience. Could we discuss a payment arrangement for the outstanding balance?",
    property: "The Houghton",
    tenant: "Artisan Coffee Co.",
    time: "08:42",
    color: "purple",
  },
  {
    id: "msg-2",
    from: "James Mokoena",
    initials: "JM",
    title: "Lease renewal · proposed terms",
    text: "Please find the proposed renewal terms for Studio Collective. We would like to discuss the escalation at our next meeting.",
    property: "Rosebank Quarter",
    tenant: "Studio Collective",
    time: "08:15",
    color: "blue",
  },
  {
    id: "msg-3",
    from: "Priya Naidoo",
    initials: "PN",
    title: "September turnover submission",
    text: "Our accountant is finalising the September turnover figures. We will share the supporting schedule shortly.",
    property: "Parkhurst Place",
    tenant: "The Local Kitchen",
    time: "Yesterday",
    color: "teal",
  },
];
export const exposure = [
  { month: "May", debit: 92 },
  { month: "Jun", debit: 85 },
  { month: "Jul", debit: 98 },
  { month: "Aug", debit: 81 },
  { month: "Sep", debit: 74.5 },
  { month: "Oct", debit: 66.25 },
];
export const money = (value: number) =>
  `R ${new Intl.NumberFormat("en-ZA", { maximumFractionDigits: 0 }).format(value).replace(/,/g, " ")}`;
export const activeProperties = properties.filter((p) => p.status === "Active");
export const portfolio = {
  properties: activeProperties.length,
  units: activeProperties.reduce((sum, p) => sum + p.units, 0),
  occupied: activeProperties.reduce((sum, p) => sum + p.occupied, 0),
  debit: activeProperties.reduce((sum, p) => sum + Math.max(0, p.arrears), 0),
};
export const previewDate = "2026-10-17";
