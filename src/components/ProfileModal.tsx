import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Phone, Droplet, Facebook, Linkedin, FileText, Users as UsersIcon, Globe, ExternalLink, Calendar, User as UserIcon } from 'lucide-react';

import { usePerformance } from '@/context/PerformanceContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: any;
  backdropBlurClass: string;
}

export function ProfileModal({ isOpen, onClose, person, backdropBlurClass }: ProfileModalProps) {
  const { lowDataMode } = usePerformance();
  if (!person) return null;

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={`absolute inset-0 bg-black/80 ${backdropBlurClass}`}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg glass overflow-hidden border-white/10 shadow-2xl"
          >
            {/* Header / Banner */}
            <div className="h-32 accent-gradient relative">
               <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-xl bg-black/20 text-white hover:bg-black/40 transition-colors z-10"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 pb-8 -mt-12 relative">
              {/* Profile Image */}
              <div className="flex justify-between items-end mb-6">
                <div className="w-24 h-24 rounded-3xl overflow-hidden ring-4 ring-[#0a0a0a] shadow-2xl bg-[#1a1a1a] flex items-center justify-center">
                  {person.imageUrl ? (
                    <img 
                      src={person.imageUrl} 
                      className="w-full h-full object-cover optimized-image" 
                      alt={person.name} 
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-3xl font-black text-white/10 uppercase">
                      {getInitials(person.name)}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 mb-2">
                  {person.facebook && (
                    <a href={person.facebook} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-white/5 text-white/60 hover:text-blue-400 hover:bg-blue-400/10 transition-all">
                      <Facebook size={18} />
                    </a>
                  )}
                  {person.linkedin && (
                    <a href={person.linkedin} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-white/5 text-white/60 hover:text-blue-600 hover:bg-blue-600/10 transition-all">
                      <Linkedin size={18} />
                    </a>
                  )}
                </div>
              </div>

              {/* Title Info */}
              <div className="mb-8">
                <h2 className="text-2xl font-black text-white tracking-tight uppercase mb-1">{person.name}</h2>
                <div className="flex items-center gap-3">
                   <div className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-purple-500/20">
                    {person.role || 'STUDENT'}
                  </div>
                  <div className="text-[10px] text-white/20 font-black uppercase tracking-widest">
                    Roll: {person.studentId}
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                    <Droplet size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Blood Type</p>
                    <p className="text-sm font-bold text-white">{person.bloodGroup || 'N/A'}</p>
                  </div>
                </div>
                {person.phone && (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                      <Phone size={18} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Phone</p>
                      <p className="text-sm font-bold text-white">{person.phone}</p>
                    </div>
                  </div>
                )}
                {person.email && (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3 sm:col-span-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <Mail size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Email</p>
                      <p className="text-sm font-bold text-white truncate">{person.email}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Sections */}
              {(person.bio || person.clubs || person.cv) && (
                <div className="space-y-6">
                  {person.bio && (
                    <div>
                      <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                        <UserIcon size={12} className="text-purple-400" /> Biography
                      </h4>
                      <p className="text-sm text-gray-400 leading-relaxed italic">
                        "{person.bio}"
                      </p>
                    </div>
                  )}

                  {person.clubs && (
                    <div>
                      <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                        <UsersIcon size={12} className="text-blue-400" /> Clubs & Memberships
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {person.clubs.split(',').map((club: string, i: number) => (
                          <span key={i} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-gray-300">
                            {club.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {person.cv && (
                    <a 
                      href={person.cv} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 rounded-2xl bg-purple-600/10 border border-purple-500/20 group hover:bg-purple-600/20 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                          <FileText size={18} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Curriculum Vitae</p>
                          <p className="text-sm font-bold text-white">Full Resume / Portfolio</p>
                        </div>
                      </div>
                      <ExternalLink size={18} className="text-purple-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
