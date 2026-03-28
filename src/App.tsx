import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/src/components/Layout";
import Dashboard from "@/src/pages/Dashboard";
import TaskManager from "@/src/pages/TaskManager";
import ProjectList from "@/src/pages/ProjectList";
import ReportList from "@/src/pages/ReportList";
import TeamManagement from "@/src/pages/TeamManagement";
import Equipment from "@/src/pages/Equipment";
import Materials from "@/src/pages/Materials";
import Financial from "@/src/pages/Financial";
import Issues from "@/src/pages/Issues";
import Settings from "@/src/pages/Settings";
import { AuthProvider } from "@/src/contexts/AuthContext";
import { ProjectProvider } from "@/src/contexts/ProjectContext";

export default function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tasks" element={<TaskManager />} />
              <Route path="/projects" element={<ProjectList />} />
              <Route path="/reports" element={<ReportList />} />
              <Route path="/team" element={<TeamManagement />} />
              <Route path="/equipment" element={<Equipment />} />
              <Route path="/materials" element={<Materials />} />
              <Route path="/financial" element={<Financial />} />
              <Route path="/issues" element={<Issues />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
        </Router>
      </ProjectProvider>
    </AuthProvider>
  );
}
