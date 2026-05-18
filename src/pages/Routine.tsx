import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, query, orderBy, doc, deleteDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Plus, Clock, MapPin, Trash2, Edit, AlertCircle, Info, ChevronRight, Edit2 } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { getPermissions } from '@/lib/permissions';
import { getLocalDateString, getWeekdayName } from '@/lib/date';
import { usePerformance } from '@/context/PerformanceContext';

interface Routine {
  id: string;
  title: string;
  subject: string;
  day: string;
  date: string;
  time: string;
  room: string;
  note: string;
  source: 'manual' | 'ai';
}

export default function RoutinePage() {
  const { user, profile } = useAuth();
  const { isApproved } = getPermissions(profile);
  const { lowDataMode, isSlowNetwork } = usePerformance();
  const shouldReduceMotion = lowDataMode || isSlowNetwork;
  
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Routine | null>(null);
  const [formData, setFormData] = useState<Partial<Routine>>({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Routine | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRoutines = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'users', user.uid, 'routines'), orderBy('time', 'asc'));
      const snapshot = await getDocs(q);
      setRoutines(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any);
    } catch (err) {
      console.error("Error fetching routine:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRoutines();
  }, [fetchRoutines]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleOpenModal = (item: Routine | null = null) => {
    setEditingItem(item);
    setFormData(item || { day: getWeekdayName(), date: getLocalDateString(), time: '09:00' });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const data = { ...formData, source: 'manual', updatedAt: new Date() };
      const collRef = collection(db, 'users', user.uid, 'routines');
      if (editingItem) {
        await updateDoc(doc(db, 'users', user.uid, 'routines', editingItem.id), data);
      } else {
        await setDoc(doc(collRef), { ...data, createdAt: new Date() });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      handleFirestoreError(err, editingItem ? OperationType.UPDATE : OperationType.CREATE, `users/${user.uid}/routines`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'routines', deleteTarget.id));
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/routines/${deleteTarget.id}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Personal <span className="gradient-text">Routine</span></h1>
          <p className="text-gray-400">Your custom class schedule and study routine.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2 h-14 px-8">
          <Plus size={20} /> Add Routine
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {days.map((day, idx) => {
          const dayRoutines = routines.filter(r => r.day.toLowerCase() === day.toLowerCase());
          return (
            <motion.div 
              key={day}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="space-y-4"
            >
              <h3 className={`text-xs font-black uppercase tracking-[0.2em] pb-2 border-b-2 ${getWeekdayName() === day ? 'text-purple-400 border-purple-500' : 'text-gray-600 border-white/5'}`}>
                {day.slice(0, 3)}
              </h3>
              
              <div className="space-y-3">
                {dayRoutines.map(r => (
                  <div key={r.id} className="glass-card p-4 group relative overflow-hidden transition-all hover:ring-2 hover:ring-purple-500/20">
                    <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 flex gap-1 z-10">
                      <button onClick={() => handleOpenModal(r)} className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-all"><Edit2 size={12} /></button>
                      <button 
                        onClick={() => {
                          setDeleteTarget(r);
                          setIsDeleteModalOpen(true);
                        }} 
                        className="p-1.5 rounded-md bg-red-500/10 text-red-500 group-hover:scale-110 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={12} className="text-purple-400" />
                      <span className="text-[10px] font-bold text-gray-400">{r.time}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white uppercase truncate mb-1">{r.subject}</h4>
                    <p className="text-[10px] text-gray-500 truncate flex items-center gap-1.5">
                       <MapPin size={10} /> {r.room || 'TBA'}
                    </p>
                    {r.source === 'ai' && (
                      <div className="mt-2 text-[8px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full inline-block uppercase tracking-widest">
                        AI Added
                      </div>
                    )}
                  </div>
                ))}
                {dayRoutines.length === 0 && (
                  <div className="h-20 rounded-xl border-2 border-dashed border-white/5 flex items-center justify-center opacity-30">
                    <span className="text-[10px] font-bold uppercase">Empty</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Edit Routine' : 'Add Routine'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Day</label>
              <select value={formData.day || ''} onChange={e => setFormData({...formData, day: e.target.value})} className="glass-input w-full">
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
             <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Time</label>
              <input type="time" required value={formData.time || ''} onChange={e => setFormData({...formData, time: e.target.value})} className="glass-input w-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Subject</label>
              <input required value={formData.subject || ''} onChange={e => setFormData({...formData, subject: e.target.value})} className="glass-input w-full" placeholder="e.g. Quantum" />
            </div>
             <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Room</label>
              <input value={formData.room || ''} onChange={e => setFormData({...formData, room: e.target.value})} className="glass-input w-full" placeholder="e.g. L-304" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Note</label>
            <textarea value={formData.note || ''} onChange={e => setFormData({...formData, note: e.target.value})} className="glass-input w-full h-24" placeholder="Optional notes..."></textarea>
          </div>
          <div className="pt-6 flex gap-3">
             <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
             <button type="submit" className="btn-primary flex-[2]">Save Routine</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Routine"
        itemType="Routine"
        itemName={deleteTarget?.subject}
        message={`This will remove this class from your ${deleteTarget?.day} schedule. This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </div>
  );
}
