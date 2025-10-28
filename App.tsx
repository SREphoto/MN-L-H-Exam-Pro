
import React, { useState } from 'react';
import Header from './components/Header';
import KnowledgeBase from './components/KnowledgeBase';
import PracticeTest from './components/PracticeTest';
import AiTools from './components/AiTools';
import StudyPlan from './components/StudyPlan';
import { NavSection } from './types';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<NavSection>(NavSection.KnowledgeBase);

  const renderContent = () => {
    switch (activeSection) {
      case NavSection.KnowledgeBase:
        return <KnowledgeBase />;
      case NavSection.PracticeTest:
        return <PracticeTest />;
      case NavSection.AiTools:
        return <AiTools />;
      case NavSection.StudyPlan:
        return <StudyPlan />;
      default:
        return <KnowledgeBase />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Header activeSection={activeSection} setActiveSection={setActiveSection} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
