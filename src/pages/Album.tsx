import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Image, ExternalLink, Calendar, User, Maximize2, X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getPermissions } from '@/lib/permissions';
import { doc, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { usePerformance } from '@/hooks/usePerformance';

interface Photo {
  id: string;
  title: string;
  imageUrl: string;
  driveUrl?: string;
  caption: string;
  date: string;
  uploadedBy: string;
}

const PhotoCard = React.memo(({ photo, idx, onClick, shouldReduceMotion, backdropBlurClass }: any) => (
  <motion.div
    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: shouldReduceMotion ? 0 : idx * 0.03 }}
    onClick={() => onClick(photo)}
    className={`glass-card overflow-hidden group cursor-pointer relative aspect-square ${backdropBlurClass}`}
  >
    <img 
      src={photo.imageUrl} 
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
      alt={photo.title} 
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6">
       <h4 className="text-white font-black text-sm mb-1 uppercase tracking-tight line-clamp-1">{photo.title}</h4>
       <div className="flex items-center gap-3 text-[9px] text-gray-400 font-bold uppercase tracking-widest">
         <span className="flex items-center gap-1"><Calendar size={10} className="text-purple-400" /> {photo.date}</span>
       </div>
    </div>
    <div className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
      <Maximize2 size={14} className="text-white" />
    </div>
  </motion.div>
));

export default function Album() {
  const { profile } = useAuth();
  const { canManageShared } = getPermissions(profile);
  const { shouldReduceMotion, backdropBlurClass } = usePerformance();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Limit to fetching 48 images (divisible by grid columns)
    const q = query(collection(db, 'album'), orderBy('createdAt', 'desc'), limit(48));
    const unsubscribe = onSnapshot(
      q, 
      (s) => {
        setPhotos(s.docs.map(d => ({ id: d.id, ...d.data() })) as any);
        setLoading(false);
      },
      (error) => {
        console.error("SNAPSHOT ERROR", {
          path: "album",
          code: error.code,
          message: error.message,
          uid: profile?.uid,
          role: profile?.role,
          status: profile?.status
        });
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [profile]);

  const handlePhotoClick = useCallback((photo: Photo) => {
    setSelectedPhoto(photo);
  }, []);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Batch<span className="gradient-text">Album</span></h1>
          <p className="text-gray-400">Capturing the unforgettable moments of Physics 23 ({photos.length} photos).</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-2xl" />
          ))}
        </div>
      ) : photos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {photos.map((photo, idx) => (
            <PhotoCard 
              key={photo.id} 
              photo={photo} 
              idx={idx} 
              onClick={handlePhotoClick}
              shouldReduceMotion={shouldReduceMotion}
              backdropBlurClass={backdropBlurClass}
            />
          ))}
        </div>
      ) : (
        <div className="glass-card p-24 text-center">
          <Image className="text-gray-700 mb-4 mx-auto" size={48} />
          <p className="text-gray-500 font-bold uppercase tracking-widest uppercase tracking-widest">No memories shared yet</p>
          <p className="text-xs text-gray-600 mt-2">Admins and CRs can add photos to the album.</p>
        </div>
      )}

      {/* Fullscreen Overlay */}
      <AnimatePresence>
        {selectedPhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setSelectedPhoto(null)} 
               className="absolute inset-0 bg-black/95 backdrop-blur-xl" 
            />
            
            <button 
              onClick={() => setSelectedPhoto(null)} 
              className="absolute top-8 right-8 z-50 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              <X size={24} />
            </button>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="relative z-10 max-w-5xl w-full max-h-[85vh] flex flex-col lg:flex-row glass-card overflow-hidden border-white/5"
            >
              <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
                <img src={selectedPhoto.imageUrl} className="max-w-full max-h-full object-contain" alt="" />
              </div>
              <div className="w-full lg:w-96 p-8 flex flex-col gap-6 bg-gray-950 overflow-y-auto">
                <div className="space-y-4">
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">{selectedPhoto.title}</h2>
                  <div className="flex flex-wrap gap-4 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><Calendar size={14} className="text-purple-400" /> {selectedPhoto.date}</span>
                    <span className="flex items-center gap-1.5"><User size={14} className="text-blue-400" /> {selectedPhoto.uploadedBy}</span>
                  </div>
                </div>
                
                {selectedPhoto.caption && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-sm text-gray-300 leading-relaxed italic">"{selectedPhoto.caption}"</p>
                  </div>
                )}

                <div className="mt-auto space-y-4 pt-8">
                  {canManageShared && (
                    <button 
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all font-bold uppercase text-[11px] tracking-widest"
                    >
                      <Trash2 size={16} /> Delete Photo
                    </button>
                  )}
                  {selectedPhoto.driveUrl && (
                    <a 
                      href={selectedPhoto.driveUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn-primary w-full h-12 flex items-center justify-center gap-2 text-sm"
                    >
                      <ExternalLink size={18} /> Open in Drive
                    </a>
                  )}
                  <button onClick={() => setSelectedPhoto(null)} className="btn-secondary w-full h-12 text-sm">Close Viewer</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={async () => {
          if (!selectedPhoto) return;
          setIsDeleting(true);
          try {
            await deleteDoc(doc(db, 'album', selectedPhoto.id));
            setIsDeleteModalOpen(false);
            setSelectedPhoto(null);
          } catch (err: any) {
            handleFirestoreError(err, OperationType.DELETE, `album/${selectedPhoto.id}`);
          } finally {
            setIsDeleting(false);
          }
        }}
        title="Delete Photo"
        itemType="Photo"
        itemName={selectedPhoto?.title}
        message="This will permanently remove this photo from the batch album. This action cannot be undone."
        isLoading={isDeleting}
      />
    </div>
  );
}
