export type Institution = {
  id: string;
  name: string;
  type: "bank" | "ewallet" | "credit" | "other";
  color: string;
  gradient: string;
  logoText: string;
  logo?: string;
};

export const SUPPORTED_INSTITUTIONS: Institution[] = [
  {
    id: "unionbank",
    name: "UnionBank",
    type: "bank",
    color: "#FF8200",
    gradient: "from-[#FF8200] to-[#E55A00]",
    logoText: "UB",
    logo: "/assets/logo/svg-logo-banks/Unionbank_2018_logo.svg",
  },
  {
    id: "metrobank",
    name: "MetroBank",
    type: "bank",
    color: "#0033A0",
    gradient: "from-[#0033A0] to-[#001D66]",
    logoText: "MB",
    logo: "/assets/logo/svg-logo-banks/Metropolitan_Bank_and_Trust_Company.svg",
  },
  {
    id: "gcash",
    name: "GCash",
    type: "ewallet",
    color: "#0073F2",
    gradient: "from-[#0073F2] to-[#0052FF]",
    logoText: "GC",
    logo: "/assets/logo/svg-logo-banks/GCash_logo.svg",
  },
  {
    id: "maribank",
    name: "MariBank",
    type: "bank",
    color: "#FF6B00",
    gradient: "from-[#FF6B00] to-[#CC4A00]",
    logoText: "MR",
    logo: "/assets/logo/svg-logo-banks/MariBank_Philippines_logo.svg",
  },
  {
    id: "atome",
    name: "Atome",
    type: "credit",
    color: "#FFDD00",
    gradient: "from-[#FFDD00] to-[#E5C700]",
    logoText: "AT",
    logo: "/assets/logo/svg-logo-banks/Atome_logo.svg",
  },
  {
    id: "other",
    name: "Other Institution",
    type: "other",
    color: "#4B5563",
    gradient: "from-gray-600 to-gray-800",
    logoText: "??",
  },
];
