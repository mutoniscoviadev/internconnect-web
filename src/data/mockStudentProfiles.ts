import type { StudentProfile } from "../types/student.types";

const STORAGE_KEY = "internconnect_student_profiles";

// Seed profiles for demo applicants
const SEED_PROFILES: StudentProfile[] = [
  {
    userId: 1,
    university: "University of Rwanda",
    department: "Computer Science",
    phone: "+250 788 123 456",
    bio: "Passionate frontend developer with experience in React and TypeScript. Looking for opportunities to grow in a fast-paced tech environment.",
    skills: ["React", "TypeScript", "JavaScript", "HTML", "CSS", "Tailwind"],
    experience: "6 months internship at a local startup building e-commerce features",
    cvUrl: "https://example.com/cv-student1.pdf",
  },
  {
    userId: 2,
    university: "Kigali Independent University",
    department: "Software Engineering",
    phone: "+250 788 234 567",
    bio: "Full-stack developer with a passion for building scalable web applications. Experienced in Node.js and React.",
    skills: ["Java", "JavaScript", "Python", "PHP", "HTML", "Node.js", "React", "React Native", "Java Spring Boot Framework", "Linux", "Windows Server Operations", "Excel", "Network Installation and Setup", "Linux System Administration", "Windows Server Management", "Web and Mobile Application Development", "PostgreSQL", "Prisma ORM", "Express", "Cloudinary", "Git", "AI Integration", "REST API", "Prisma", "Cloudinary", "Render", "Vercel"],
    experience: "Built several open source projects. Contributed to 3 client projects.",
    cvUrl: "https://example.com/cv-student2.pdf",
  },
  {
    userId: 3,
    university: "Rwanda Polytechnic",
    department: "Data Science",
    phone: "+250 788 345 678",
    bio: "Currently pursuing or recently completed a degree in Data Science. Interested in machine learning and analytics.",
    skills: ["Python", "Excel", "SQL", "Statistics", "Computer Science", "Tableau"],
    experience: "Academic projects in data analysis and machine learning.",
    cvUrl: null,
  },
  {
    userId: 4,
    university: "African Leadership University",
    department: "Business & Technology",
    phone: "+250 788 456 789",
    bio: "Entrepreneurial mindset with strong technical skills. Experienced in both business analysis and software development.",
    skills: ["Python", "Excel", "SQL", "Business Analysis", "Project Management", "Node.js"],
    experience: "1 year working as a freelance data analyst for SMEs in Kigali.",
    cvUrl: "https://example.com/cv-student4.pdf",
  },
  {
    userId: 5,
    university: "University of Rwanda",
    department: "Marketing",
    phone: "+250 788 567 890",
    bio: "Creative marketing professional with digital skills. Passionate about brand storytelling and social media strategy.",
    skills: ["Social Media", "Content Creation", "Canva", "Google Analytics", "SEO"],
    experience: "Managed social media for a local NGO for 8 months.",
    cvUrl: null,
  },
  {
    userId: 6,
    university: "Kepler College",
    department: "Information Technology",
    phone: "+250 788 678 901",
    bio: "Detail-oriented developer focused on clean code and great user experiences. Strong background in UI/UX design.",
    skills: ["Figma", "React", "JavaScript", "CSS", "UI/UX Design", "Prototyping"],
    experience: "Designed and built 4 client websites as a freelancer.",
    cvUrl: "https://example.com/cv-student6.pdf",
  },
  {
    userId: 7,
    university: "Institut Polytechnique de Byumba",
    department: "Computer Engineering",
    phone: "+250 788 789 012",
    bio: "Hardware and software engineer with strong problem-solving skills. Interested in embedded systems and IoT.",
    skills: ["C++", "Python", "Arduino", "IoT", "Linux", "Networking"],
    experience: "Built IoT projects for smart agriculture as part of university thesis.",
    cvUrl: "https://example.com/cv-student7.pdf",
  },
];

// Mock names for display
export const MOCK_STUDENT_NAMES: Record<number, { name: string; email: string }> = {
  1: { name: "mutoni scovia",  email: "scoviaemutoni@gmail.com" },
  2: { name: "duhorane",       email: "duhodan1@gmail.com" },
  3: { name: "Alice Uwase",    email: "alice.uwase@student.ur.ac.rw" },
  4: { name: "Bruno Hakizimana", email: "bruno.haki@alu.rw" },
  5: { name: "Claire Mukamana", email: "claire.muka@student.ur.ac.rw" },
  6: { name: "David Niyonzima", email: "david.niyo@kepler.org" },
  7: { name: "Eva Uwineza",    email: "eva.uwi@ipb.ac.rw" },
};

function loadProfiles(): StudentProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const stored: StudentProfile[] = raw ? JSON.parse(raw) : [];
    // Merge seed profiles with stored ones (stored takes priority)
    const merged = [...SEED_PROFILES];
    stored.forEach((sp) => {
      const idx = merged.findIndex((p) => p.userId === sp.userId);
      if (idx >= 0) merged[idx] = sp;
      else merged.push(sp);
    });
    return merged;
  } catch {
    return SEED_PROFILES;
  }
}

function saveProfiles(profiles: StudentProfile[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch {}
}

export function getProfileByUserId(userId: number): StudentProfile | undefined {
  return loadProfiles().find((p) => p.userId === userId);
}

export function upsertProfile(profile: StudentProfile): StudentProfile {
  const profiles = loadProfiles();
  const idx = profiles.findIndex((p) => p.userId === profile.userId);
  if (idx >= 0) {
    profiles[idx] = profile;
  } else {
    profiles.push(profile);
  }
  saveProfiles(profiles);
  return profile;
}