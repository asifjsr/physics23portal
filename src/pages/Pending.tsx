import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Clock, ShieldCheck, LogOut, MessageSquare } from 'lucide-react';

export default function Pending() {
  const { profile } = useAuth();

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl w-full glass-card p-12 text-center border-white/5 relative z-10 shadow-2xl"
      >
        <div className="w-20 h-20 rounded-3xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-8 animate-pulse">
          <Clock className="text-yellow-500" size={40} />
        </div>

        <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">Approval Pending</h1>
        <p className="text-gray-400 text-lg mb-10 leading-relaxed">
          Hello <span className="text-white font-semibold">{profile?.name}</span>!<br /> 
          Your account is waiting for approval from our admins or CRs. 
          Please check back in a while.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-left">
            <ShieldCheck className="text-purple-400 mb-2" size={20} />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Status</p>
            <p className="text-sm text-white font-medium">Pending Review</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-left">
            <MessageSquare className="text-blue-400 mb-2" size={20} />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Action</p>
            <p className="text-sm text-white font-medium">Contact Admin</p>
          </div>
        </div>

        <button
          onClick={() => signOut(auth)}
          className="btn-secondary w-full flex items-center justify-center gap-2 h-14 text-lg"
        >
          <LogOut size={20} /> Sign Out
        </button>
      </motion.div>
    </div>
  );
}
