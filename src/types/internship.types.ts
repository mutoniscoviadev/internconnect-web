import type { CompanyProfile } from "./company.types";

export interface Internship {
  id: number;
  companyId: number;
  title: string;
  description: string;
  requirements: string;
  location: string;
  duration: string;
  deadline: string;
  positions: number;
  category: string;
  isPaid: boolean;
  stipend?: string | null;
  isActive: boolean;
  company?: CompanyProfile;
}

export type ApplicationStatus =
  | "APPLIED"
  | "UNDER_REVIEW"
  | "SHORTLISTED"
  | "INTERVIEW"
  | "ACCEPTED"
  | "REJECTED";

export interface Application {
  id: number;
  studentId: number;
  internshipId: number;
  status: ApplicationStatus;
  coverLetterUrl?: string | null;
  notes?: string | null;
  interviewDate?: string | null;
  appliedAt: string;
  internship?: Internship;
}
