import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, MessageSquare, Settings, FileText } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: MessageSquare, label: 'Chat', path: '/chat' },
    { icon: FileText, label: 'Logs', path: '/logs' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="h-16 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Sailendra Logo" className="h-10 w-10" />
          <span className="font-semibold text-lg dark:text-white hidden md:inline">Sailendra ChatBot</span>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <span className="text-sm font-medium hidden md:inline dark:text-white">
              {user.email}
            </span>
          )}
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Logout">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="hidden md:flex w-16 lg:w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex-col">
          <nav className="flex-1 pt-4">
            <ul>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path} className="mb-1 px-2">
                    <Link 
                      to={item.path}
                      className={`flex items-center p-3 rounded-md transition-colors ${
                        isActive 
                          ? 'bg-sailendra-50 text-sailendra-600 dark:bg-gray-700 dark:text-sailendra-400' 
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className={`ml-3 ${!isActive ? 'lg:block hidden' : 'lg:block hidden'}`}>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
        
        {/* Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      {/* Footer */}
      <footer className="h-12 bg-white dark:bg-gray-800 border-t dark:border-gray-700 flex items-center justify-center px-6">
        <p className="text-sm text-gray-600 dark:text-gray-300">© 2025 Sailendra Organizer, Created by Bedul Tampan</p>
      </footer>
    </div>
  );
};

export default DashboardLayout;
