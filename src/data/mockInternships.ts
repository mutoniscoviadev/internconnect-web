import type { Internship } from "../types/internship.types";

export const mockInternships: Internship[] = [
  {
    id: 1, companyId: 101,
    title: "Frontend Developer Intern",
    description: "Work alongside our product team building React interfaces used by thousands of students every day.",
    requirements: "HTML, CSS, JavaScript, React basics",
    location: "Kigali, Rwanda", duration: "3 months", deadline: "2026-07-15",
    positions: 2, category: "Software Development", isPaid: true, stipend: "150,000 RWF / month", isActive: true,
    company: { id: 101, userId: 1, companyName: "Nexora Labs", industry: "Technology", location: "Kigali, Rwanda", website: "https://nexoralabs.dev", description: "", logoUrl: null, isVerified: true },
  },
  {
    id: 2, companyId: 102,
    title: "Data Analyst Intern",
    description: "Support the analytics team with dashboards, reporting and data cleaning for our partner companies.",
    requirements: "Excel, SQL basics, attention to detail",
    location: "Remote", duration: "6 months", deadline: "2026-07-30",
    positions: 1, category: "Data & Analytics", isPaid: true, stipend: "120,000 RWF / month", isActive: true,
    company: { id: 102, userId: 2, companyName: "FinEdge Africa", industry: "Fintech", location: "Nairobi, Kenya", website: "https://finedge.africa", description: "", logoUrl: null, isVerified: true },
  },
  {
    id: 3, companyId: 103,
    title: "Marketing & Social Media Intern",
    description: "Plan and execute campaigns across social channels, and help grow our community of young professionals.",
    requirements: "Strong writing skills, creativity, Canva/CapCut a plus",
    location: "Kigali, Rwanda", duration: "4 months", deadline: "2026-08-01",
    positions: 3, category: "Marketing", isPaid: false, stipend: null, isActive: true,
    company: { id: 103, userId: 3, companyName: "Bloom Collective", industry: "Media & Marketing", location: "Kigali, Rwanda", website: null, description: "", logoUrl: null, isVerified: false },
  },
  {
    id: 4, companyId: 104,
    title: "UI/UX Design Intern",
    description: "Design clean, accessible interfaces for our mobile and web apps, working closely with engineers.",
    requirements: "Figma, basic design principles",
    location: "Remote", duration: "3 months", deadline: "2026-07-20",
    positions: 1, category: "Design", isPaid: true, stipend: "100,000 RWF / month", isActive: true,
    company: { id: 104, userId: 4, companyName: "Pathlight Studio", industry: "Design", location: "Kampala, Uganda", website: "https://pathlight.studio", description: "", logoUrl: null, isVerified: true },
  },
  {
    id: 5, companyId: 105,
    title: "Backend Developer Intern (Node.js)",
    description: "Build and maintain REST APIs, work with Postgres and Prisma alongside our backend team.",
    requirements: "JavaScript/TypeScript, basic understanding of databases",
    location: "Kigali, Rwanda", duration: "6 months", deadline: "2026-08-10",
    positions: 2, category: "Software Development", isPaid: true, stipend: "150,000 RWF / month", isActive: true,
    company: { id: 105, userId: 5, companyName: "Nexora Labs", industry: "Technology", location: "Kigali, Rwanda", website: "https://nexoralabs.dev", description: "", logoUrl: null, isVerified: true },
  },
  {
    id: 6, companyId: 106,
    title: "HR & People Operations Intern",
    description: "Assist with recruitment coordination, onboarding new hires, and maintaining employee records.",
    requirements: "Organized, good communication skills",
    location: "Kigali, Rwanda", duration: "3 months", deadline: "2026-07-25",
    positions: 1, category: "Human Resources", isPaid: false, stipend: null, isActive: true,
    company: { id: 106, userId: 6, companyName: "Verdant Holdings", industry: "Agribusiness", location: "Kigali, Rwanda", website: null, description: "", logoUrl: null, isVerified: false },
  },
];

export const categories = [
  "All Categories",
  "Software Development",
  "Data & Analytics",
  "Marketing",
  "Design",
  "Human Resources",
];