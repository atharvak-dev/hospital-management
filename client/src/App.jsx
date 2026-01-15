import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AppLayout from './layout/AppLayout'; // New Layout
import ProtectedRoute from './components/ProtectedRoute';

import Patients from './pages/Patients';
import PatientForm from './pages/PatientForm';
import Visits from './pages/Visits';
import VisitForm from './pages/VisitForm';
import Appointments from './pages/Appointments';
import Billing from './pages/Billing';

import PatientDetails from './pages/PatientDetails';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Prescriptions from './pages/Prescriptions';
import VisitPrint from './pages/VisitPrint';
import Templates from './pages/Templates';
import Medicines from './pages/Medicines';


import { SidebarProvider } from './context/SidebarContext';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <SidebarProvider>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout><Outlet /></AppLayout>}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/patients" element={<Patients />} />
                  <Route path="/patients/new" element={<PatientForm />} />
                  <Route path="/patients/:id" element={<PatientDetails />} />
                  <Route path="/visits" element={<Visits />} />
                  <Route path="/visits/new" element={<VisitForm />} />
                  <Route path="/visits/:id" element={<VisitForm />} />
                  <Route path="/appointments" element={<Appointments />} />
                  <Route path="/prescriptions" element={<Prescriptions />} />
                  <Route path="/billing" element={<Billing />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/templates" element={<Templates />} />
                  <Route path="/medicines" element={<Medicines />} />
                  <Route path="/users" element={<Users />} />
                </Route>
              </Route>

              <Route path="/print/visit/:id" element={<VisitPrint />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </SidebarProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
