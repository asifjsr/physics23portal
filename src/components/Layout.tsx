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
    <div className="min-h-screen w-full flex flex-col lg:flex-row relative bg-gray-950 font-sans">
      <div className="mesh-bg fixed inset-0 pointer-events-none" />
      
      {/* Sidebar for Desktop / Hidden on Mobile */}
      <aside className="hidden lg:flex flex-col w-64 h-[calc(100vh-2rem)] p-6 glass m-4 mr-0 sticky top-4 rounded-3xl border border-white/5">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl accent-gradient flex items-center justify-center shadow-lg shadow-purple-500/20">
            <BookOpen className="text-white" size={20} />
          </div>
          <div>
            <h2 className="font-black text-white tracking-tighter text-lg leading-tight uppercase">Physics<span className="text-purple-400">23</span></h2>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest leading-none">ClassVerse</p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1 overflow-y-auto scrollbar-hide py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 relative group min-w-0 ${
                  isActive 
                    ? 'bg-white/10 text-white shadow-xl shadow-black/20' 
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="nav-pill" 
                    className="absolute inset-0 bg-white/10 rounded-2xl -z-10" 
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon size={18} className={isActive ? 'text-purple-400' : 'text-current'} />
                <span className="text-sm font-bold tracking-tight truncate">{item.label}</span>
                {!isActive && <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-40 transition-opacity" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 flex flex-col gap-2">
          {isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${location.pathname === '/admin' ? 'bg-red-500/10 text-red-400' : 'text-red-400/50 hover:text-red-400 hover:bg-red-500/5'}`}
            >
              <Settings size={18} />
              <span className="text-sm font-bold tracking-tight">Admin Shell</span>
            </Link>
          )}
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-white/20 hover:text-red-400 hover:bg-red-500/5 transition-all w-full text-left"
          >
            <LogOut size={18} />
            <span className="text-sm font-bold tracking-tight">System Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Navbar */}
        <header className="lg:hidden flex items-center justify-between p-4 glass m-4 mb-2 rounded-2xl border border-white/5 sticky top-4 z-40 backdrop-blur-3xl">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2.5 rounded-xl bg-white/5 text-white/60 hover:text-white active:scale-95 transition-all">
            <Menu size={22} />
          </button>
          <div className="font-black text-sm tracking-widest text-white uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            ClassVerse
          </div>
          <img 
            src={profile?.photoURL || `https://ui-avatars.com/api/?name=${profile?.name}&background=8b5cf6&color=fff`} 
            className="w-10 h-10 rounded-xl object-cover border border-white/10" 
            alt="Avatar"
          />
        </header>

        {/* Desktop Header Content (Greeting) */}
        <header className="hidden lg:flex items-center justify-between px-10 py-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight leading-none">
              {profile?.name ? `Sup, ${profile.name.split(' ')[0]}?` : 'Welcome Back'}
            </h1>
            <p className="text-sm text-white/30 font-bold uppercase tracking-widest mt-2">
              {format(new Date(), 'EEEE, do MMMM')} <span className="mx-2 opacity-20">|</span> Terminal Active
            </p>
          </div>

          <div className="flex items-center gap-6">
             <div className="text-right">
                <div className="text-xs font-black text-white uppercase tracking-wider">{profile?.name}</div>
                <div className="text-[10px] text-purple-400 font-bold uppercase tracking-[0.2em]">{profile?.role || 'STUDENT'}</div>
             </div>
             <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 p-0.5 glass">
                <img 
                  src={profile?.photoURL || `https://ui-avatars.com/api/?name=${profile?.name}&background=8b5cf6&color=fff`} 
                  className="w-full h-full rounded-xl object-cover" 
                  alt="Avatar"
                />
             </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto px-4 lg:px-10 pb-20 lg:pb-10 scroll-smooth">
          <div className="max-w-6xl mx-auto py-4">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Drawer Navigation (Slide from left) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed inset-y-4 left-4 z-50 w-72 bg-gray-950/90 rounded-[2rem] border border-white/10 lg:hidden flex flex-col p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg accent-gradient flex items-center justify-center">
                    <BookOpen size={16} className="text-white" />
                  </div>
                  <span className="font-black text-white tracking-widest text-sm uppercase">Menu</span>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)} 
                  className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 scrollbar-hide">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-4 rounded-2xl transition-all ${
                      location.pathname === item.path 
                        ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20' 
                        : 'text-white/40 hover:bg-white/5'
                    }`}
                  >
                    <item.icon size={20} />
                    <span className="font-bold tracking-tight">{item.label}</span>
                  </Link>
                ))}
              </div>

              <div className="pt-6 mt-6 border-t border-white/5 space-y-2">
                {isAdmin && (
                  <Link to="/admin" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-4 py-4 rounded-2xl text-red-400/60 font-bold">
                    <Settings size={20} />
                    <span>Admin Controls</span>
                  </Link>
                )}
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-white/20 font-bold"
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>

  );
};
