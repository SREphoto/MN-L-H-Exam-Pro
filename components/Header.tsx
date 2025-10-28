import React, { useState } from 'react';
import { NavSection } from '../types';
import { BrainCircuitIcon, BookOpenIcon, CheckSquareIcon, CalendarDaysIcon, BotIcon, MenuIcon, XIcon } from './icons';

interface HeaderProps {
  activeSection: NavSection;
  setActiveSection: (section: NavSection) => void;
}

const NavItem: React.FC<{
  section: NavSection;
  activeSection: NavSection;
  onClick: (section: NavSection) => void;
  Icon: React.ElementType;
  children: React.ReactNode;
  isMobile?: boolean;
}> = ({ section, activeSection, onClick, Icon, children, isMobile }) => {
  const isActive = activeSection === section;
  const baseClasses = "flex items-center space-x-2 font-medium transition-colors duration-200";
  const mobileClasses = isMobile ? "px-3 py-3 w-full text-base rounded-md" : "px-3 py-2 text-sm rounded-md";
  const activeClasses = isActive 
    ? (isMobile ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white') 
    : (isMobile ? 'text-slate-300 hover:bg-slate-700 hover:text-white' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900');

  return (
    <button
      onClick={() => onClick(section)}
      className={`${baseClasses} ${mobileClasses} ${activeClasses}`}
    >
      <Icon className="w-5 h-5" />
      <span>{children}</span>
    </button>
  );
};


const Header: React.FC<HeaderProps> = ({ activeSection, setActiveSection }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleNavClick = (section: NavSection) => {
        setActiveSection(section);
        setIsMenuOpen(false); // Close menu on selection
    };

    const navItems = (isMobile: boolean) => (
        <>
            <NavItem section={NavSection.KnowledgeBase} activeSection={activeSection} onClick={handleNavClick} Icon={BookOpenIcon} isMobile={isMobile}>
                {NavSection.KnowledgeBase}
            </NavItem>
            <NavItem section={NavSection.PracticeTest} activeSection={activeSection} onClick={handleNavClick} Icon={CheckSquareIcon} isMobile={isMobile}>
                {NavSection.PracticeTest}
            </NavItem>
            <NavItem section={NavSection.AiTools} activeSection={activeSection} onClick={handleNavClick} Icon={BotIcon} isMobile={isMobile}>
                {NavSection.AiTools}
            </NavItem>
            <NavItem section={NavSection.StudyPlan} activeSection={activeSection} onClick={handleNavClick} Icon={CalendarDaysIcon} isMobile={isMobile}>
                {NavSection.StudyPlan}
            </NavItem>
        </>
    );

    return (
        <header className="bg-white shadow-md sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <BrainCircuitIcon className="w-8 h-8 text-blue-600" />
                        <h1 className="text-xl font-bold ml-2 text-slate-800">MN L&H Exam Pro</h1>
                    </div>
                    
                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex md:space-x-4">
                        {navItems(false)}
                    </nav>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                            aria-expanded={isMenuOpen}
                        >
                            <span className="sr-only">Open main menu</span>
                            {isMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 w-full bg-slate-800 shadow-lg" id="mobile-menu">
                    <nav className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navItems(true)}
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Header;