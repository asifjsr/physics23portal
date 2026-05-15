import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home,
  LayoutDashboard, 
  Users, 
  Image, 
  Wallet, 
  Calendar, 
  CheckSquare, 
  Calculator, 
  Bot, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { format } from 'date-fns';

const navItems = [
  { path: '/', label: 'Home Page', icon: Home },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/assessments', label: 'Assessments', icon: BookOpen },
  { path: '/people', label: 'People', icon: Users },
  { path: '/album', label: 'Album', icon: Image },
  { path: '/fund', label: 'Batch Fund', icon: Wallet },
  { path: '/routine', label: 'Routine', icon: Calendar },
  { path: '/tasks', label: 'Tasks & Notes', icon: CheckSquare },
  { path: '/backup', label: 'Backup Counter', icon: Calculator },
  { path: '/ai', label: 'AI Assistant', icon: Bot },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { profile, isAdmin } = useAuth();
  const location = useLocation();

  const handleLogout = () => signOut(auth);

  return (
    <div className="min-h-screen w-full flex relative">
      <div className="mesh-bg" />
      
      {/* Desktop Sidebar - Fixed position */}
      <aside className="hidden lg:flex flex-col w-[220px] h-[calc(100vh-2rem)] p-6 glass m-4 mr-0 sticky top-4">
        <div className="font-extrabold text-lg mb-8 gradient-text tracking-tight">
          Physics 23 Portal
        </div>

        <nav className="flex-1 flex flex-col gap-2 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-white/60'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 flex flex-col gap-2">
          {isAdmin && (
            <Link
              to="/admin"
              className={`nav-item ${location.pathname === '/admin' ? 'nav-item-active' : ''} text-red-400 hover:text-red-300`}
            >
              <Settings size={18} />
              <span>Admin Panel</span>
            </Link>
          )}
          
          <button 
            onClick={handleLogout}
            className="nav-item text-white/40 hover:text-red-400 mt-2"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between p-6 pb-0">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              Hello, {profile?.roll || 'Batchmate'}
            </h1>
            <p className="text-sm text-white/50 mt-1">
              {format(new Date(), 'EEEE, MMMM dd, yyyy')}
            </p>
          </div>

          <div className="glass px-4 py-2 flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-white">{profile?.name}</div>
              <div className="text-[10px] text-white/40 uppercase tracking-wider">{profile?.role}</div>
            </div>
            <img 
              src={profile?.photoURL || `https://ui-avatars.com/api/?name=${profile?.name}&background=8b5cf6&color=fff`} 
              className="w-10 h-10 rounded-full object-cover border border-white/10" 
              alt="Avatar"
            />
          </div>
        </header>

        {/* Content wrapper - No longer scrollable, global scroll handles it */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Menu Toggle (Simplified for Theme) */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full accent-gradient text-white shadow-2xl flex items-center justify-center"
      >
        <Menu size={24} />
      </button>

      {/* Mobile Sidebar (Glass Overlay) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-gray-950/90 backdrop-blur-2xl lg:hidden flex flex-col p-6"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="font-extrabold text-lg gradient-text">Physics 23</div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-white/40 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 flex flex-col gap-2 overflow-y-auto">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`nav-item ${location.pathname === item.path ? 'nav-item-active' : ''}`}
                  >
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>

              <div className="mt-auto pt-6 border-t border-white/5">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-medium text-sm"
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
