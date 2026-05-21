import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { getPermissions } from '@/lib/permissions';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { ConfirmModal } from '@/components/ConfirmModal';
import { 
  CheckSquare, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  FileText, 
  Search,
  MoreVertical,
  X,
  Edit2,
  ChevronRight,
  Star
} from 'lucide-react';
import { Modal } from '@/components/Modal';
import { getLocalDateString } from '@/lib/date';

interface Task {
  id: string;
  title: string;
  dueDate: string;
  status: 'pending' | 'done';
  note: string;
  isPriority?: boolean;
}

interface Note {
  id: string;
  title: string;
  content: string;
  subject: string;
  createdAt: any;
}

export default function TasksPage() {
  const { user, profile } = useAuth();
  const { isApproved } = getPermissions(profile);
  const [activeTab, setActiveTab] = useState<'tasks' | 'notes'>('tasks');
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'done' | 'priority'>('all');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ coll: 'tasks' | 'notes', id: string, title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubTasks = onSnapshot(
      query(collection(db, 'users', user.uid, 'tasks'), orderBy('dueDate', 'asc')), 
      (s) => {
        setTasks(s.docs.map(d => ({ id: d.id, ...d.data() })) as any);
        setLoading(false);
      },
      (error) => {
        console.error("SNAPSHOT ERROR", {
          path: `users/${user.uid}/tasks`,
          code: error.code,
          message: error.message,
          uid: user.uid,
          role: profile?.role,
          status: profile?.status
        });
        setLoading(false);
      }
    );
    const unsubNotes = onSnapshot(
      query(collection(db, 'users', user.uid, 'notes'), orderBy('createdAt', 'desc')), 
      (s) => {
        setNotes(s.docs.map(d => ({ id: d.id, ...d.data() })) as any);
        setLoading(false);
      },
      (error) => {
        console.error("SNAPSHOT ERROR", {
          path: `users/${user.uid}/notes`,
          code: error.code,
          message: error.message,
          uid: user.uid,
          role: profile?.role,
          status: profile?.status
        });
        setLoading(false);
      }
    );
    return () => { unsubTasks(); unsubNotes(); };
  }, [user, profile]);

  const handleOpenModal = (tab: any, item: any = null) => {
    setEditingItem(item);
    setFormData(item || { 
      status: 'pending', 
      dueDate: getLocalDateString(),
      subject: '' 
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const coll = activeTab === 'tasks' ? 'tasks' : 'notes';
      const ref = collection(db, 'users', user.uid, coll);
      const data = { ...formData, updatedAt: new Date() };
      
      if (editingItem) {
        await updateDoc(doc(db, 'users', user.uid, coll, editingItem.id), data);
      } else {
        await setDoc(doc(ref), { ...data, createdAt: new Date() });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      handleFirestoreError(err, editingItem ? OperationType.UPDATE : OperationType.CREATE, `users/${user.uid}/${activeTab === 'tasks' ? 'tasks' : 'notes'}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'tasks', task.id), {
      status: task.status === 'done' ? 'pending' : 'done'
    });
  };

  const toggleTaskPriority = async (task: Task) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'tasks', task.id), {
      isPriority: !task.isPriority
    });
  };

  const handleDelete = async () => {
    if (!user || !deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'users', user.uid, deleteTarget.coll, deleteTarget.id));
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/${deleteTarget.coll}/${deleteTarget.id}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex bg-white/5 p-1 rounded-2xl w-fit border border-white/5">
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'tasks' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
          >
            Tasks ({tasks.length})
          </button>
          <button 
            onClick={() => setActiveTab('notes')}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'notes' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
          >
            Notes ({notes.length})
          </button>
        </div>
        <button onClick={() => handleOpenModal(activeTab)} className="btn-primary flex items-center gap-2 h-14 px-8">
           <Plus size={20} /> Add {activeTab === 'tasks' ? 'Task' : 'Note'}
        </button>
      </div>

      {activeTab === 'tasks' && (
        <div className="flex flex-wrap items-center gap-2">
          {['all', 'pending', 'done', 'priority'].map((filter) => (
            <button
              key={filter}
              onClick={() => setTaskFilter(filter as any)}
              className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                taskFilter === filter 
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-500/50' 
                  : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300 border border-white/5'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {activeTab === 'tasks' ? (
          <div className="lg:col-span-2 space-y-4">
             {tasks.filter(t => {
               if (taskFilter === 'pending') return t.status === 'pending';
               if (taskFilter === 'done') return t.status === 'done';
               if (taskFilter === 'priority') return t.isPriority;
               return true;
             }).map(t => (
               <div key={t.id} className="glass-card p-6 flex items-center gap-6 group">
                  <button onClick={() => toggleTaskStatus(t)} className={`flex-shrink-0 transition-all ${t.status === 'done' ? 'text-green-500' : 'text-gray-600 hover:text-purple-400'}`}>
                    {t.status === 'done' ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-lg font-bold truncate transition-all ${t.status === 'done' ? 'text-gray-600 ml-1 line-through' : 'text-white'}`}>
                      {t.title}
                    </h4>
                    <div className="flex items-center gap-4 mt-2">
                       <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                         <Calendar size={12} className="text-purple-400" /> Due: {t.dueDate}
                       </span>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => toggleTaskPriority(t)} className={`p-2 rounded-lg bg-white/5 ${t.isPriority ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`}>
                      <Star size={16} className={t.isPriority ? 'fill-current' : ''} />
                    </button>
                    <button onClick={() => handleOpenModal('tasks', t)} className="p-2 rounded-lg bg-white/5 text-blue-400"><Edit2 size={16} /></button>
                    <button 
                      onClick={() => {
                        setDeleteTarget({ coll: 'tasks', id: t.id, title: t.title });
                        setIsDeleteModalOpen(true);
                      }} 
                      className="p-2 rounded-lg bg-white/5 text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
               </div>
             ))}
             {tasks.filter(t => {
               if (taskFilter === 'pending') return t.status === 'pending';
               if (taskFilter === 'done') return t.status === 'done';
               if (taskFilter === 'priority') return t.isPriority;
               return true;
             }).length === 0 && (
               <div className="glass-card p-24 text-center">
                  <CheckSquare size={48} className="text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500 font-bold uppercase tracking-widest">No matching tasks</p>
               </div>
             )}
          </div>
        ) : (
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
             {notes.map(n => (
               <div key={n.id} className="glass-card p-8 flex flex-col group relative overflow-hidden h-72">
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 flex gap-1">
                    <button onClick={() => handleOpenModal('notes', n)} className="p-2 rounded-lg bg-white/10 text-white"><Edit2 size={16} /></button>
                    <button 
                      onClick={() => {
                        setDeleteTarget({ coll: 'notes', id: n.id, title: n.title });
                        setIsDeleteModalOpen(true);
                      }} 
                      className="p-2 rounded-lg bg-white/10 text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-4">{n.subject || 'GENERAL'}</span>
                  <h4 className="text-xl font-bold text-white mb-4 line-clamp-2">{n.title}</h4>
                  <p className="text-sm text-gray-400 line-clamp-4 leading-relaxed flex-1">{n.content}</p>
                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                     <span className="text-[10px] font-bold text-gray-600 uppercase tabular-nums">
                       {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleDateString() : 'Just now'}
                     </span>
                     <ChevronRight size={14} className="text-gray-700" />
                  </div>
               </div>
             ))}
             {notes.length === 0 && (
               <div className="col-span-full glass-card p-24 text-center">
                  <FileText size={48} className="text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500 font-bold uppercase tracking-widest">No saved notes</p>
               </div>
             )}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? `Edit ${activeTab === 'tasks' ? 'Task' : 'Note'}` : `Add ${activeTab === 'tasks' ? 'Task' : 'Note'}`}>
        <form onSubmit={handleSave} className="space-y-4">
           {activeTab === 'tasks' ? (
             <>
               <div className="space-y-1">
                 <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Task Title</label>
                 <input required value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="glass-input w-full" placeholder="Finish Optics assignment..." />
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Due Date</label>
                 <input type="date" required value={formData.dueDate || ''} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="glass-input w-full" />
               </div>
               <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Note</label>
                <textarea value={formData.note || ''} onChange={e => setFormData({...formData, note: e.target.value})} className="glass-input w-full h-24" placeholder="Description/Resources..."></textarea>
              </div>
             </>
           ) : (
             <>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Subject</label>
                    <input required value={formData.subject || ''} onChange={e => setFormData({...formData, subject: e.target.value})} className="glass-input w-full" placeholder="e.g. Physics" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Title</label>
                    <input required value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="glass-input w-full" placeholder="Note Title" />
                  </div>
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Content</label>
                 <textarea required value={formData.content || ''} onChange={e => setFormData({...formData, content: e.target.value})} className="glass-input w-full h-72 py-4" placeholder="Write your note here..."></textarea>
               </div>
             </>
           )}
           <div className="pt-6 flex gap-3">
             <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
             <button type="submit" disabled={loading} className="btn-primary flex-[2]">Save {activeTab === 'tasks' ? 'Task' : 'Note'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title={deleteTarget?.coll === 'tasks' ? 'Delete Task' : 'Delete Note'}
        itemType={deleteTarget?.coll === 'tasks' ? 'Task' : 'Note'}
        itemName={deleteTarget?.title}
        message={`This will permanently remove this ${deleteTarget?.coll === 'tasks' ? 'task' : 'note'} from your account. This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </div>
  );
}
