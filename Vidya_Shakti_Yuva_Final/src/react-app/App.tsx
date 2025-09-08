import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import { ThemeProvider } from "@/react-app/contexts/ThemeContext";
import { AuthProvider } from "@/react-app/contexts/AuthContext";
import Layout from "@/react-app/components/Layout";
import Dashboard from "@/react-app/pages/Dashboard";
import Mentees from "@/react-app/pages/Mentees";
import Projects from "@/react-app/pages/Projects";
import Tasks from "@/react-app/pages/Tasks";
import Announcements from "@/react-app/pages/Announcements";
import Messages from "@/react-app/pages/Messages";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="mentees" element={<Mentees />} />
              <Route path="mentors" element={<Mentees />} />
              <Route path="projects" element={<Projects />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="announcements" element={<Announcements />} />
              <Route path="messages" element={<Messages />} />
              <Route path="reviews" element={<Projects />} />
              <Route path="comments" element={<Messages />} />
              <Route path="certificates" element={<Dashboard />} />
              <Route path="users" element={<Mentees />} />
              <Route path="approvals" element={<Projects />} />
              <Route path="analytics" element={<Dashboard />} />
              <Route path="settings" element={<Dashboard />} />
              <Route path="config" element={<Dashboard />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
