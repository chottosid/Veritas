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
import { MyCases } from "./pages/MyCases";
import { CaseDetail } from "./pages/CaseDetail";
import { Profile } from "./pages/Profile";

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
            path="/lawyers" 
            element={
              <ProtectedRoute>
                <FindLawyer />
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
       
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
