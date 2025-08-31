import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { MyComplaints } from "./pages/MyComplaints";
import { FileComplaint } from "./pages/FileComplaint";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { ComplaintDetail } from "./pages/ComplaintDetail";
import { FindLawyer } from "./pages/FindLawyer";
import { MyLawyerRequests } from "./pages/MyLawyerRequests";
import { MyCases } from "./pages/MyCases";
import { CaseDetail } from "./pages/CaseDetail";
import { Profile } from "./pages/Profile";
import { Notifications } from "./pages/Notifications";
import { PoliceDashboard } from "./pages/PoliceDashboard";
import { PoliceComplaints } from "./pages/PoliceComplaints";
import { PoliceCases } from "./pages/PoliceCases";
import { PoliceComplaintDetail } from "./pages/PoliceComplaintDetail";
import { PoliceCaseDetail } from "./pages/PoliceCaseDetail";
import { PoliceJudges } from "./pages/PoliceJudges";
import { OCComplaints } from "./pages/OCComplaints";
import { OCOfficers } from "./pages/OCOfficers";
import { JudgeDashboard } from "./pages/JudgeDashboard";
import { JudgeFIRs } from "./pages/JudgeFIRs";
import { JudgeCases } from "./pages/JudgeCases";
import LawyerDashboard from "./pages/LawyerDashboard";
import LawyerRequests from "./pages/LawyerRequests";
import LawyerCases from "./pages/LawyerCases";
import BlockchainTransparency from "./pages/BlockchainTransparency";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/complaints" 
            element={
              <ProtectedRoute>
                <MyComplaints />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/complaints/:complaintId" 
            element={
              <ProtectedRoute>
                <ComplaintDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/file-complaint" 
            element={
              <ProtectedRoute>
                <FileComplaint />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/find-lawyer" 
            element={
              <ProtectedRoute>
                <FindLawyer />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/lawyers" 
            element={
              <ProtectedRoute>
                <FindLawyer />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/lawyer-requests" 
            element={
              <ProtectedRoute>
                <MyLawyerRequests />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/cases" 
            element={
              <ProtectedRoute>
                <MyCases />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/cases/:caseId" 
            element={
              <ProtectedRoute>
                <CaseDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/notifications" 
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            } 
          />

          {/* Blockchain Transparency Route */}
          <Route 
            path="/blockchain" 
            element={<BlockchainTransparency />} 
          />

          {/* Police Routes */}
          <Route 
            path="/police/dashboard" 
            element={
              <ProtectedRoute requiredRole="POLICE">
                <PoliceDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/police/complaints" 
            element={
              <ProtectedRoute requiredRole="POLICE">
                <PoliceComplaints />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/police/cases" 
            element={
              <ProtectedRoute requiredRole="POLICE">
                <PoliceCases />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/police/judges" 
            element={
              <ProtectedRoute requiredRole="POLICE">
                <PoliceJudges />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/police/complaints/:complaintId" 
            element={
              <ProtectedRoute requiredRole="POLICE">
                <PoliceComplaintDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/police/cases/:caseId" 
            element={
              <ProtectedRoute requiredRole="POLICE">
                <PoliceCaseDetail />
              </ProtectedRoute>
            } 
          />

          {/* OC (Officer in Charge) Routes */}
          <Route 
            path="/police/oc/complaints" 
            element={
              <ProtectedRoute requiredRole="POLICE">
                <OCComplaints />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/police/oc/officers" 
            element={
              <ProtectedRoute requiredRole="POLICE">
                <OCOfficers />
              </ProtectedRoute>
            } 
          />

          {/* Judge Routes */}
          <Route 
            path="/judge/dashboard" 
            element={
              <ProtectedRoute requiredRole="JUDGE">
                <JudgeDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/judge/firs" 
            element={
              <ProtectedRoute requiredRole="JUDGE">
                <JudgeFIRs />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/judge/cases" 
            element={
              <ProtectedRoute requiredRole="JUDGE">
                <JudgeCases />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/case/:caseId" 
            element={
              <ProtectedRoute>
                <CaseDetail />
              </ProtectedRoute>
            } 
          />

          {/* Lawyer Routes */}
          <Route 
            path="/lawyer/dashboard" 
            element={
              <ProtectedRoute requiredRole="LAWYER">
                <LawyerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/lawyer/requests" 
            element={
              <ProtectedRoute requiredRole="LAWYER">
                <LawyerRequests />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/lawyer/cases" 
            element={
              <ProtectedRoute requiredRole="LAWYER">
                <LawyerCases />
              </ProtectedRoute>
            } 
          />
       
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
