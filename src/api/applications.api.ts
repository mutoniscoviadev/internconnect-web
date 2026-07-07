import { BASE_URL } from "./config";

function getToken(): string | null {
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  const data = await res.json();
  if (!res.ok) {
    const err: any = new Error(data.error ?? data.message ?? "Request failed");
    err.response = { data: { message: data.error ?? data.message ?? "Request failed" } };
    throw err;
  }
  return data as T;
}

// Student: apply for a listing (with optional cover letter file)
// Student: apply for a listing (with optional cover letter file + contact details)
export const applyForListing = async (
  listingId: string,
  coverLetter?: File,
  contact?: { name?: string; email?: string; phone?: string }
) => {
  const token = getToken();
  const form = new FormData();
  form.append("listingId", listingId);
  if (coverLetter) form.append("coverLetter", coverLetter);
  if (contact?.name) form.append("applicantName", contact.name);
  if (contact?.email) form.append("applicantEmail", contact.email);
  if (contact?.phone) form.append("applicantPhone", contact.phone);

  const res = await fetch(`${BASE_URL}/applications`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json();
  if (!res.ok) {
    const err: any = new Error(data.error ?? data.message ?? "Request failed");
    err.response = { data: { message: data.error ?? data.message ?? "Request failed" } };
    throw err;
  }
  return data;
};

// Student: get my applications
export const getMyApplications = async () => {
  return request("/applications/my");
};

// Employer: get all applications for a listing
export const getListingApplications = async (listingId: string) => {
  return request(`/applications/listing/${listingId}`);
};

// Employer: update application status
export const updateApplicationStatus = async (
  applicationId: string,
  status: string
) => {
  return request(`/applications/${applicationId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
};

// Student: withdraw application
export const withdrawApplication = async (applicationId: string) => {
  return request(`/applications/${applicationId}`, { method: "DELETE" });
};

// Employer: AI analyze applicant
export const analyzeApplicant = async (applicationId: string) => {
  return request(`/applications/${applicationId}/analyze`, { method: "POST" });
};