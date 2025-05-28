import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, MessageSquare, Settings, FileText, Users, Menu, ChevronLeft } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardLayoutProps {
  children: ReactNode;
  showBackButton?: boolean;
  title?: string;
}

const DashboardLayout = ({ children, showBackButton, title }: DashboardLayoutProps) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: MessageSquare, label: 'Chat', path: '/chat' },
    { icon: Users, label: 'Contacts', path: '/contacts' },
    { icon: FileText, label: 'Logs', path: '/logs' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="h-16 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center justify-between px-4 md:px-6 z-20">
        <div className="flex items-center gap-2">
          {showBackButton ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="mr-2 md:hidden"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          ) : null}
          <img src="/logo.png" alt="Sailendra Logo" className="h-8 w-8 md:h-10 md:w-10" />
          <span className="font-semibold text-base md:text-lg dark:text-white hidden md:inline">
            {title || "Sailendra ChatBot"}
          </span>
          {/* Mobile Title */}
          <span className="font-semibold text-base dark:text-white md:hidden">
            {title || "Sailendra"}
          </span>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          {user && (
            <span className="text-sm font-medium hidden md:inline dark:text-white">
              {user.email}
            </span>
          )}
          <ThemeToggle />
          
          {/* Mobile Menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {menuItems.map((item) => (
                  <DropdownMenuItem key={item.path} asChild>
                    <Link 
                      to={item.path}
                      className="flex items-center gap-2 w-full"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={signOut} className="text-red-600 dark:text-red-400">
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Desktop Logout Button */}
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Logout" className="hidden md:flex">
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
                      <span className="ml-3 lg:block hidden">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
        
        {/* Content */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
      {/* Footer */}
      <footer className="h-12 bg-white dark:bg-gray-800 border-t dark:border-gray-700 flex items-center justify-center px-4 md:px-6">
        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 text-center">
          © 2025 Sailendra Organizer, Created by Abdul Muthalib
        </p>
      </footer>
    </div>
  );
};

export default DashboardLayout;
