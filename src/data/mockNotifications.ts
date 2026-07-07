export type NotificationType =
  | "APPLICATION_APPROVED"
  | "APPLICATION_DECLINED"
  | "APPLICATION_REVIEWED"
  | "APPLICATION_SHORTLISTED"
  | "NEW_INTERNSHIP"
  | "DEADLINE_REMINDER"
  | "PROFILE_TIP";

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  company?: string;
  internshipTitle?: string;
  internshipId?: number;
  read: boolean;
  createdAt: string; // ISO string
}

export const mockNotifications: Notification[] = [
  {
    id: 1,
    type: "APPLICATION_APPROVED",
    title: "Application Approved! 🎉",
    message: "Congratulations! Your application for Frontend Developer Intern has been approved by Nexora Labs. They will contact you soon.",
    company: "Nexora Labs",
    internshipTitle: "Frontend Developer Intern",
    internshipId: 1,
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
  },
  {
    id: 2,
    type: "APPLICATION_SHORTLISTED",
    title: "You've been shortlisted",
    message: "Great news! Kigali Tech Hub has shortlisted your application for the Data Analyst Intern position.",
    company: "Kigali Tech Hub",
    internshipTitle: "Data Analyst Intern",
    internshipId: 2,
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: 3,
    type: "NEW_INTERNSHIP",
    title: "New internship match",
    message: "A new internship matching your profile was posted: UI/UX Design Intern at RwandAir. Apply before July 10.",
    company: "RwandAir",
    internshipTitle: "UI/UX Design Intern",
    internshipId: 3,
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
  },
  {
    id: 4,
    type: "APPLICATION_REVIEWED",
    title: "Application under review",
    message: "Bank of Kigali is currently reviewing your application for the Finance Intern role. Stay tuned!",
    company: "Bank of Kigali",
    internshipTitle: "Finance Intern",
    internshipId: 4,
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
  {
    id: 5,
    type: "APPLICATION_DECLINED",
    title: "Application update",
    message: "After careful review, MTN Rwanda has decided not to move forward with your application for Marketing Intern at this time. Keep applying!",
    company: "MTN Rwanda",
    internshipTitle: "Marketing Intern",
    internshipId: 5,
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
  },
  {
    id: 6,
    type: "DEADLINE_REMINDER",
    title: "Deadline approaching",
    message: "The deadline for Software Engineering Intern at Andela Rwanda is in 2 days (June 28). Don't miss it!",
    company: "Andela Rwanda",
    internshipTitle: "Software Engineering Intern",
    internshipId: 6,
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
  },
  {
    id: 7,
    type: "NEW_INTERNSHIP",
    title: "New internship match",
    message: "Equity Bank Rwanda is looking for a Backend Developer Intern. This matches your skills — apply now!",
    company: "Equity Bank Rwanda",
    internshipTitle: "Backend Developer Intern",
    internshipId: 7,
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), // 4 days ago
  },
  {
    id: 8,
    type: "PROFILE_TIP",
    title: "Complete your profile",
    message: "Students with complete profiles get 3x more views from companies. Add your CV and bio to stand out.",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
  },
];