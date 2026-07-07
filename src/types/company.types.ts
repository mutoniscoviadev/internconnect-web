export interface CompanyProfile {
  id: number;
  userId: number;
  companyName: string;
  industry: string;
  location: string;
  website?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  isVerified: boolean;
}
