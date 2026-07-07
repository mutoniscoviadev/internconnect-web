import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/auth.context";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import Layout from "./components/Layout";

import HomePage from "./pages/HomePage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import InternshipsPage from "./pages/InternshipsPage";
import InternshipDetailPage from "./pages/InternshipDetailPage";

import ApplicationsPage from "./pages/student/ApplicationsPage";
import StudentProfilePage from "./pages/student/StudentProfilePage";
import StudentProfileEditPage from "./pages/student/StudentProfileEditPage";
import NotificationsPage from "./pages/NotificationsPage";

import CompanyDashboard from "./pages/company/CompanyDashboard";
import CompanyListingsPage from "./pages/company/CompanyListingsPage";
import CompanyApplicantsPage from "./pages/company/CompanyApplicantsPage";
import CompanyApplicantProfilePage from "./pages/company/CompanyApplicantProfilePage";
import CompanyProfilePage from "./pages/company/CompanyProfilePage";
import CompanyProfileEditPage from "./pages/company/CompanyProfileEditPage";

import AdminDashboard from "./pages/admin/AdminDashboard";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public landing page — has its own navbar/footer, not wrapped in Layout */}
        <Route path="/landing" element={<LandingPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route element={<Layout />}>
          {/* "/" -> logged-out redirects to /landing, logged-in shows dashboard inside Layout */}
          <Route path="/" element={<HomePage />} />
          <Route path="/internships" element={<InternshipsPage />} />
          <Route path="/internships/:id" element={<InternshipDetailPage />} />

          <Route element={<ProtectedRoute />}>

            {/* STUDENT routes */}
            <Route element={<RoleRoute allowedRoles={["STUDENT"]} />}>
              <Route path="/student/dashboard" element={<ApplicationsPage />} />
              <Route path="/student/profile" element={<StudentProfilePage />} />
              <Route path="/student/profile/edit" element={<StudentProfileEditPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Route>

            {/* COMPANY routes */}
            <Route element={<RoleRoute allowedRoles={["COMPANY"]} />}>
              <Route path="/company/dashboard" element={<CompanyDashboard />} />
              <Route path="/company/listings" element={<CompanyListingsPage />} />
              <Route path="/company/applicants" element={<CompanyApplicantsPage />} />
              <Route path="/company/applicants/:applicationId" element={<CompanyApplicantProfilePage />} />
              <Route path="/company/profile" element={<CompanyProfilePage />} />
              <Route path="/company/profile/edit" element={<CompanyProfileEditPage />} />
            </Route>

            {/* ADMIN routes */}
            <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Route>

          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}