import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';

interface ProjectContextType {
  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(() => {
    return localStorage.getItem('currentProjectId');
  });

  useEffect(() => {
    if (currentProjectId) {
      localStorage.setItem('currentProjectId', currentProjectId);
    } else {
      localStorage.removeItem('currentProjectId');
    }
  }, [currentProjectId]);

  return (
    <ProjectContext.Provider value={{ currentProjectId, setCurrentProjectId }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
