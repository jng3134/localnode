import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Palette } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';

const ICONS = ['📱', '💻', '🧪', '📝', '⚡️', '🚀', '🧠', '📊', '🎨', '🔒'];
const COLORS = ['#3b82f6', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#6366f1', '#14b8a6', '#ef4444'];

export const CreateProjectModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const createProject = useProjectStore((state) => state.createProject);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState(ICONS[0]);
  const [color, setColor] = useState(COLORS[0]);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-create-project-modal', handleOpen);
    return () => window.removeEventListener('open-create-project-modal', handleOpen);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setName('');
    setDescription('');
    setIcon(ICONS[0]);
    setColor(COLORS[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createProject({
      name: name.trim(),
      description: description.trim(),
      icon,
      color,
    });
    handleClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-[#030014]/60 backdrop-blur-sm pointer-events-auto"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg mx-4 bg-white/[0.08] backdrop-blur-[24px] border border-white/[0.12] rounded-3xl overflow-hidden shadow-2xl z-10 pointer-events-auto flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08]">
              <h2 className="text-lg font-semibold text-white">Create New Project</h2>
              <button
                onClick={handleClose}
                className="p-2 -mr-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-zinc-700">
              <form id="create-project-form" onSubmit={handleSubmit} className="space-y-6">
                
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-300 ml-1">Project Name <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. React Native App"
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all font-sans"
                    autoFocus
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-300 ml-1">Description (Optional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the project goals..."
                    rows={3}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all font-sans resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Icon Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-300 ml-1">Project Icon</label>
                    <div className="flex flex-wrap gap-2">
                      {ICONS.map((i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setIcon(i)}
                          className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all cursor-pointer ${icon === i ? 'bg-white/20 border border-white/30 scale-110 shadow-lg' : 'bg-black/20 border border-white/5 hover:bg-white/10'}`}
                        >
                          {i}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-300 ml-1">Project Color</label>
                    <div className="flex flex-wrap gap-2">
                      {COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105 opacity-70 hover:opacity-100'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

              </form>
            </div>

            <div className="p-6 border-t border-white/[0.08] bg-black/20 flex gap-3 justify-end items-center mt-auto">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 rounded-xl font-medium text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!name.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20 cursor-pointer"
              >
                Create Project
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
