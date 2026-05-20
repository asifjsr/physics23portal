import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, query, orderBy, doc, setDoc, deleteDoc, updateDoc, limit, startAfter, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Search, User, Phone, Droplet, Hash, Mail, ChevronRight, UserCircle, Plus, Edit2, Trash2, X, MoreVertical, AlertTriangle, Facebook, Linkedin, FileText, Users as UsersIcon, Globe, Loader2, MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePerformance } from '@/context/PerformanceContext';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ProfileModal } from '@/components/ProfileModal';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { getPermissions } from '@/lib/permissions';
import { Skeleton } from '@/components/ui/Skeleton';

interface Batchmate {
  id: string;
  studentId: string;
  name: string;
  role: string;
  position?: string;
  discipline?: string;
  imageUrl: string;
  email: string;
  phone: string;
  bloodGroup: string;
  district?: string;
  facebook?: string;
  linkedin?: string;
  cv?: string;
  clubs?: string;
  bio?: string;
}

const BatchmateCard = React.memo(({ person, idx, canManage, onEdit, onDelete, onClick, shouldReduceMotion, backdropBlurClass, lowDataMode }: any) => {
  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';
  };

  return (
    <motion.div
      key={person.id}
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: shouldReduceMotion ? 0 : idx * 0.05 }}
      onClick={() => onClick(person)}
      className={`glass p-6 flex flex-col items-center group relative overflow-hidden glass-hover border-white/5 cursor-pointer ${backdropBlurClass}`}
    >
      {canManage && (
        <div className="absolute top-4 right-4 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(person); }} 
            className="p-2 rounded-lg bg-white/5 text-blue-400 hover:bg-blue-400/20 transition-all"
          >
            <Edit2 size={14} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(person); }} 
            className="p-2 rounded-lg bg-white/5 text-red-400 hover:bg-red-400/20 transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {/* Card Decoration */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl transition-all group-hover:bg-purple-500/10"></div>
      
    <div className="relative mb-6">
      <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-white/5 group-hover:ring-purple-500/20 transition-all shadow-xl flex items-center justify-center bg-white/5 relative">
        {person.imageUrl ? (
          <>
            <img 
              src={person.imageUrl} 
              className="w-full h-full object-cover object-center optimized-image group-hover:scale-110 transition-transform duration-500" 
              style={{ imageRendering: 'auto' }}
              alt={person.name} 
              referrerPolicy="no-referrer"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <span className="text-3xl font-black text-white/20 group-hover:text-purple-400 transition-colors uppercase hidden">
              {getInitials(person.name)}
            </span>
          </>
        ) : (
          <span className="text-3xl font-black text-white/20 group-hover:text-purple-400 transition-colors uppercase">
            {getInitials(person.name)}
          </span>
        )}
      </div>
        <div className="absolute -bottom-2 -right-4 px-3 py-1 accent-gradient text-white rounded-lg text-[8px] font-bold uppercase tracking-widest shadow-lg whitespace-nowrap">
          {person.position || person.role || 'STUDENT'}
        </div>
      </div>

      <div className="flex flex-col items-center w-full min-w-0">
        <h3 className="text-lg font-bold text-white truncate group-hover:text-purple-400 transition-colors uppercase tracking-wide w-full text-center">{person.name}</h3>
        <div className="mt-2 mb-6">
          <div className="px-3 py-1 bg-[#ffffff10] border border-[#ffffff15] rounded-full flex items-center justify-center gap-1.5 shadow-sm group-hover:bg-[#ffffff15] transition-colors">
            <span className="text-[9px] text-[#94a3b8] uppercase tracking-[0.18em] font-bold">ID</span>
            <span className="text-[11px] font-bold text-white tracking-wide">{person.studentId}</span>
          </div>
        </div>

        <div className="space-y-2 w-full">
          {person.district && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 group-hover:bg-white/10 transition-colors">
              <MapPin size={14} className="text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">From:</span>
              <span className="text-xs text-slate-100 font-semibold ml-auto tracking-wide truncate">{person.district}</span>
            </div>
          )}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 group-hover:bg-white/10 transition-colors">
            <Droplet size={14} className="text-red-500 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Blood:</span>
            <span className="text-xs text-slate-100 font-semibold ml-auto tracking-wide">{person.bloodGroup || 'N/A'}</span>
          </div>
          {person.phone && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 group-hover:bg-white/10 transition-colors">
              <Phone size={14} className="text-green-500 group-hover:scale-110 transition-transform" />
              <span className="text-xs text-slate-100 font-semibold tracking-wide truncate ml-auto">{person.phone}</span>
            </div>
          )}
          {person.email && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 group-hover:bg-white/10 transition-colors">
               <Mail size={14} className="text-blue-400 group-hover:scale-110 transition-transform" />
               <span className="text-xs text-slate-100 font-semibold tracking-wide truncate ml-auto">{person.email}</span>
            </div>
          )}
          <div className="pt-3">
            <button className="text-[10px] font-bold uppercase tracking-widest text-purple-400/80 group-hover:text-purple-400 transition-colors flex items-center justify-center gap-1.5 mx-auto">
              View Profile <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

const BATCH_SIZE = 24;

export default function Batchmates() {
  const { profile } = useAuth();
  const { canManageShared: canManage } = getPermissions(profile);
  const { lowDataMode, isSlowNetwork } = usePerformance();
  const shouldReduceMotion = lowDataMode || isSlowNetwork;
  const backdropBlurClass = lowDataMode ? 'low-performance-blur' : 'backdrop-blur-md';
  
  const [people, setPeople] = useState<Batchmate[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Batchmate | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Batchmate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Batchmate>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reorderBatchmates = useCallback((list: Batchmate[]) => {
    const specialIds = ["221703", "221730", "221740"];
    const normal = list.filter(p => !specialIds.includes(p.studentId));
    const special = list.filter(p => specialIds.includes(p.studentId))
                       .sort((a, b) => a.studentId.localeCompare(b.studentId));
    return [...normal, ...special];
  }, []);

  const fetchPeople = useCallback(async (isNextPage = false, currentLastDoc = lastDoc) => {
    if (isNextPage) setLoadingMore(true);
    else setLoading(true);

    try {
      const q = isNextPage && currentLastDoc
        ? query(collection(db, 'batchmates'), orderBy('studentId', 'asc'), startAfter(currentLastDoc), limit(BATCH_SIZE))
        : query(collection(db, 'batchmates'), orderBy('studentId', 'asc'), limit(BATCH_SIZE));

      // Timeout for slow networks
      let timeoutId: any;
      const timeoutPromise = new Promise<any>((resolve) => {
        timeoutId = setTimeout(() => resolve({ empty: true, timedOut: true }), 8000);
      });
      
      const snapshot = await Promise.race([getDocs(q), timeoutPromise]);
      clearTimeout(timeoutId);
      
      if (snapshot.timedOut) {
         throw new Error("Connection timed out. Showing cached or local data.");
      }

      const newPeople = snapshot.docs.map((d: any) => {
        const data = d.data();
        return {
          id: d.id,
          studentId: data.studentId || data.id || 'N/A',
          name: data.name || data.fullName || 'Unknown',
          role: data.role || data.position || 'STUDENT',
          position: data.position || '',
          discipline: data.discipline || '',
          imageUrl: data.imageUrl || data.photoURL || data.avatarUrl || '',
          email: data.email || '',
          phone: data.phone || '',
          bloodGroup: data.bloodGroup || '',
          district: data.district || '',
          facebook: data.facebook || '',
          linkedin: data.linkedin || '',
          cv: data.cv || '',
          clubs: data.clubs || '',
          bio: data.bio || ''
        } as Batchmate;
      });
      
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === BATCH_SIZE);

      if (isNextPage) {
        setPeople(prev => reorderBatchmates([...prev, ...newPeople]));
      } else {
        setPeople(reorderBatchmates(newPeople));
        console.log("Batchmates loaded:", newPeople.length, newPeople);
      }
    } catch (err: any) {
      console.error("Error fetching batchmates:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [reorderBatchmates]);

  useEffect(() => {
    fetchPeople();
  }, []);

  const filtered = useMemo(() => people.filter(p => 
    p.name?.toLowerCase().includes(search.toLowerCase()) || 
    p.studentId?.includes(search)
  ), [people, search]);

  const handleOpenModal = useCallback((item: Batchmate | null = null) => {
    setEditingItem(item);
    setFormData(item || {
      studentId: '',
      name: '',
      role: 'student',
      imageUrl: '',
      email: '',
      phone: '',
      bloodGroup: '',
      district: '',
      facebook: '',
      linkedin: '',
      cv: '',
      clubs: '',
      bio: ''
    });
    setIsModalOpen(true);
  }, []);

  const handleOpenProfile = useCallback((person: Batchmate) => {
    setSelectedPerson(person);
    setIsProfileModalOpen(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.name) return;

    setIsSubmitting(true);
    try {
      const data = {
        ...formData,
        updatedAt: new Date(),
        updatedBy: profile?.name || 'Admin',
      };

      if (editingItem) {
        await updateDoc(doc(db, 'batchmates', editingItem.id), data);
      } else {
        await setDoc(doc(db, 'batchmates', formData.studentId as string), {
          ...data,
          createdAt: new Date(),
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      handleFirestoreError(err, editingItem ? OperationType.UPDATE : OperationType.CREATE, 'batchmates');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = useCallback((person: Batchmate) => {
    setEditingItem(person);
    setDeleteTarget(person.id);
    setIsDeleteModalOpen(true);
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, 'batchmates', deleteTarget));
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `batchmates/${deleteTarget}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Batch<span className="gradient-text">mates</span></h1>
          <p className="text-gray-400">Physics 23 Batch Directory ({people.length} active students)</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-64 md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-purple-400 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search name or ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input w-full pl-12 h-12"
            />
          </div>
          {canManage && (
            <button 
              onClick={() => handleOpenModal()} 
              className="btn-primary flex items-center gap-2 h-12 px-6 w-full sm:w-auto text-xs uppercase tracking-widest"
            >
              <Plus size={18} /> Add Student
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="glass-card p-6 border-red-500/20 bg-red-500/5 text-red-400 flex items-center justify-between">
          <div>
            <p className="font-bold uppercase tracking-widest text-xs mb-2">Sync Error</p>
            <p className="text-sm opacity-80">{error}</p>
          </div>
          <button 
            onClick={() => fetchPeople()} 
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
          >
            Retry
          </button>
        </div>
      )}

      {loading && filtered.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(i => (
            <Skeleton key={i} className="h-80 w-full" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((person, idx) => (
            <BatchmateCard 
              key={person.id} 
              person={person} 
              idx={idx} 
              canManage={canManage} 
              onEdit={handleOpenModal} 
              onDelete={confirmDelete}
              onClick={handleOpenProfile}
              shouldReduceMotion={shouldReduceMotion}
              backdropBlurClass={backdropBlurClass}
              lowDataMode={lowDataMode}
            />
          ))}
        </div>
      ) : (
        <div className="glass p-20 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 text-white/10">
             <Search size={32} />
          </div>
          <p className="text-white/20 font-bold uppercase tracking-widest text-sm">No batchmates found matching your search</p>
          <button onClick={() => setSearch('')} className="text-purple-400 text-xs font-bold mt-4 hover:underline uppercase tracking-widest">Clear Search</button>
        </div>
      )}

      {hasMore && !search && (
        <div className="flex justify-center pt-8">
          <button 
            onClick={() => fetchPeople(true, lastDoc)}
            disabled={loadingMore}
            className="btn-secondary h-12 px-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest"
          >
            {loadingMore ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {loadingMore ? 'Loading More...' : 'Load More Batchmates'}
          </button>
        </div>
      )}

      {/* Management Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingItem ? 'Edit Batchmate' : 'Add New Batchmate'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Student ID</label>
              <input 
                required 
                disabled={!!editingItem}
                value={formData.studentId || ''} 
                onChange={e => setFormData({...formData, studentId: e.target.value})} 
                className="glass-input w-full" 
                placeholder="231719" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Full Name</label>
              <input 
                required 
                value={formData.name || ''} 
                onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} 
                className="glass-input w-full" 
                placeholder="MD. ASIF KHAN" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Role</label>
              <select 
                value={formData.role || 'student'} 
                onChange={e => setFormData({...formData, role: e.target.value})} 
                className="glass-input w-full"
              >
                <option value="student">Student</option>
                <option value="class representative">CR</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Blood Group</label>
              <input 
                value={formData.bloodGroup || ''} 
                onChange={e => setFormData({...formData, bloodGroup: e.target.value.toUpperCase()})} 
                className="glass-input w-full" 
                placeholder="B+" 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">District</label>
            <input 
              value={formData.district || ''} 
              onChange={e => setFormData({...formData, district: e.target.value})} 
              className="glass-input w-full" 
              placeholder="e.g. Dhaka, Khulna" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Phone Number</label>
            <input 
              value={formData.phone || ''} 
              onChange={e => setFormData({...formData, phone: e.target.value})} 
              className="glass-input w-full" 
              placeholder="+8801..." 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Email Address</label>
            <input 
              type="email"
              value={formData.email || ''} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              className="glass-input w-full" 
              placeholder="example@mail.com" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Image URL</label>
            <input 
              value={formData.imageUrl || ''} 
              onChange={e => setFormData({...formData, imageUrl: e.target.value})} 
              className="glass-input w-full" 
              placeholder="https://imgur.com/..." 
            />
            <p className="text-[10px] text-yellow-500/80 ml-1 mt-1 font-medium">Re-upload high quality image to improve photo quality.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Facebook Profile</label>
              <input 
                value={formData.facebook || ''} 
                onChange={e => setFormData({...formData, facebook: e.target.value})} 
                className="glass-input w-full text-xs" 
                placeholder="https://facebook.com/..." 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">LinkedIn Profile</label>
              <input 
                value={formData.linkedin || ''} 
                onChange={e => setFormData({...formData, linkedin: e.target.value})} 
                className="glass-input w-full text-xs" 
                placeholder="https://linkedin.com/in/..." 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">CV Link</label>
            <input 
              value={formData.cv || ''} 
              onChange={e => setFormData({...formData, cv: e.target.value})} 
              className="glass-input w-full text-xs" 
              placeholder="Drive / Dropbox link" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Clubs & Memberships</label>
            <input 
              value={formData.clubs || ''} 
              onChange={e => setFormData({...formData, clubs: e.target.value})} 
              className="glass-input w-full text-xs" 
              placeholder="Physics Club, Robotics..." 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Bio / Mini Details</label>
            <textarea 
              value={formData.bio || ''} 
              onChange={e => setFormData({...formData, bio: e.target.value})} 
              className="glass-input w-full text-xs min-h-[80px] p-4" 
              placeholder="Tell something about yourself..." 
            />
          </div>

          <div className="flex gap-3 pt-6">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)} 
              className="btn-secondary flex-1 h-12 uppercase text-xs tracking-widest font-bold"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="btn-primary flex-[2] h-12 uppercase text-xs tracking-widest font-bold"
            >
              {isSubmitting ? 'Processing...' : (editingItem ? 'Update Profile' : 'Add to Batch')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Remove Batchmate"
        itemType="Student"
        itemName={editingItem?.name}
        message="This will permanently remove the student from the Physics 23 directory. This action cannot be undone."
        isLoading={isSubmitting}
      />

      {/* Profile Detail Modal */}
      <ProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        person={selectedPerson}
        backdropBlurClass={backdropBlurClass}
      />
    </div>
  );
}

