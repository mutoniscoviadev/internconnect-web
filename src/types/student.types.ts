export interface StudentProfile {
  id: number;
  userId: number;
  university: string;
  department: string;
  yearOfStudy: number;
  skills: string[];
  bio?: string | null;
  phone?: string | null;
  cvUrl?: string | null;
  coverLetterUrl?: string | null;
  experience?: string | null;
  languages?: string[];
  certifications?: string[];
}