import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import TaskManager from "./pages/TaskManager";
import ProjectList from "./pages/ProjectList";
import ReportList from "./pages/ReportList";
import TeamManagement from "./pages/TeamManagement";
import Equipment from "./pages/Equipment";
import Materials from "./pages/Materials";
import Financial from "./pages/Financial";
import Issues from "./pages/Issues";
import Settings from "./pages/Settings";
import { AuthProvider } from "./contexts/AuthContext";
import { ProjectProvider } from "./contexts/ProjectContext";

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
