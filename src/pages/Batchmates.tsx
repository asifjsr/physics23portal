import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, query, orderBy, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Search, User, Phone, Droplet, Hash, Mail, ChevronRight, UserCircle, Plus, Edit2, Trash2, X, MoreVertical, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { getPermissions } from '@/lib/permissions';

interface Batchmate {
  id: string;
  studentId: string;
  name: string;
  role: string;
  imageUrl: string;
  email: string;
  phone: string;
  bloodGroup: string;
}

export default function Batchmates() {
  const { profile } = useAuth();
  const { canManageShared: canManage } = getPermissions(profile);
  const [people, setPeople] = useState<Batchmate[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Batchmate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Batchmate>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'batchmates'), orderBy('studentId', 'asc')), 
      (s) => {
        setPeople(s.docs.map(d => ({ id: d.id, ...d.data() })) as Batchmate[]);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error("SNAPSHOT ERROR", {
          path: "batchmates",
          code: error.code,
          message: error.message,
          uid: profile?.uid,
          role: profile?.role,
          status: profile?.status
        });
        setError(`${error.code}: ${error.message}`);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [profile]);

  const filtered = people.filter(p => 
    p.name?.toLowerCase().includes(search.toLowerCase()) || 
    p.studentId?.includes(search)
  );

  const handleOpenModal = (item: Batchmate | null = null) => {
    setEditingItem(item);
    setFormData(item || {
      studentId: '',
      name: '',
      role: 'student',
      imageUrl: '',
      email: '',
      phone: '',
      bloodGroup: ''
    });
    setIsModalOpen(true);
  };

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

  const confirmDelete = (person: Batchmate) => {
    setEditingItem(person);
    setDeleteTarget(person.id);
    setIsDeleteModalOpen(true);
  };

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
        <div className="glass-card p-6 border-red-500/20 bg-red-500/5 text-red-400">
          <p className="font-bold uppercase tracking-widest text-xs mb-2">Sync Error</p>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="glass h-80 animate-pulse bg-white/5"></div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((person, idx) => (
            <motion.div
              key={person.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="glass p-6 flex flex-col items-center group relative overflow-hidden glass-hover border-white/5"
            >
              {canManage && (
                <div className="absolute top-4 right-4 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(person)} className="p-2 rounded-lg bg-white/5 text-blue-400 hover:bg-blue-400/20 transition-all">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => confirmDelete(person)} className="p-2 rounded-lg bg-white/5 text-red-400 hover:bg-red-400/20 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}

              {/* Card Decoration */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl transition-all group-hover:bg-purple-500/10"></div>
              
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-3xl overflow-hidden ring-4 ring-white/5 group-hover:ring-purple-500/20 transition-all shadow-xl flex items-center justify-center bg-white/5">
                  {person.imageUrl ? (
                    <img src={person.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={person.name} />
                  ) : (
                    <span className="text-3xl font-black text-white/10 group-hover:text-purple-400 transition-colors uppercase">
                      {getInitials(person.name)}
                    </span>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 px-3 py-1 accent-gradient text-white rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg">
                  {person.role || 'STUDENT'}
                </div>
              </div>

              <div className="text-center w-full min-w-0">
                <h3 className="text-base font-bold text-white truncate group-hover:text-purple-400 transition-colors uppercase tracking-tight">{person.name}</h3>
                <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em] mt-1 mb-6">Roll: {person.studentId}</p>

                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-[10px] text-white/40 group-hover:bg-white/[0.05] transition-colors">
                    <Droplet size={14} className="text-red-500 opacity-60" />
                    <span className="font-bold uppercase tracking-widest">Blood:</span>
                    <span className="text-white font-bold ml-auto">{person.bloodGroup || 'N/A'}</span>
                  </div>
                  {person.phone && (
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-[10px] text-white/40 group-hover:bg-white/[0.05] transition-colors">
                      <Phone size={14} className="text-green-500 opacity-60" />
                      <span className="truncate font-bold tracking-widest">{person.phone}</span>
                    </div>
                  )}
                  {person.email && (
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-[10px] text-white/40 group-hover:bg-white/[0.05] transition-colors">
                       <Mail size={14} className="text-blue-500 opacity-60" />
                       <span className="truncate font-bold tracking-widest">{person.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
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
    </div>
  );
}

