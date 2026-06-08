import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileAttachmentState } from './ChatFileUpload';
import { FileText, FileArchive, FileCode, CheckCircle2, File, X, Maximize2, Download, Image as ImageIcon } from 'lucide-react';

interface AttachmentPreviewsProps {
  attachments: FileAttachmentState[];
  removeAttachment: (id: string) => void;
}

export const AttachmentPreviews: React.FC<AttachmentPreviewsProps> = ({ attachments, removeAttachment }) => {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      <AnimatePresence>
        {attachments.map((att) => {
          const isDoc = att.type.includes('pdf') || att.type.includes('document') || att.name.endsWith('.docx') || att.name.endsWith('.pdf');
          const isZip = att.type.includes('zip') || att.name.endsWith('.zip');
          const isImage = att.type.startsWith('image/');

          return (
            <motion.div
              key={att.id}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              whileHover={{ y: -2 }}
              className="group relative flex items-center gap-3 bg-white/[0.08] backdrop-blur-[20px] border border-white/10 rounded-2xl p-2 pr-3 max-w-[200px] shadow-lg transition-transform"
            >
              {/* Remove Button */}
              <button 
                type="button"
                onClick={() => removeAttachment(att.id)}
                className="absolute -top-2 -right-2 bg-rose-500 text-white w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10 cursor-pointer"
              >
                <X size={12} />
              </button>

              <div className="flex-shrink-0 w-10 h-10 rounded-xl overflow-hidden bg-black/40 flex items-center justify-center relative border border-white/5">
                {isImage && att.url ? (
                  <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                ) : isDoc ? (
                  <FileText className="w-5 h-5 text-rose-400" />
                ) : isZip ? (
                  <FileArchive className="w-5 h-5 text-amber-400" />
                ) : (
                  <File className="w-5 h-5 text-indigo-400" />
                )}
                
                {/* Upload Status Overlay */}
                {att.status === 'uploading' && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
                {att.status === 'success' && (
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full border-2 border-[#1a1132]">
                    <CheckCircle2 size={10} className="text-white" />
                  </div>
                )}
              </div>

              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-white text-xs font-medium truncate tracking-tight">{att.name}</span>
                <span className="text-zinc-500 text-[10px] tracking-wider truncate uppercase">
                   {att.status === 'uploading' ? (
                     <div className="w-full bg-white/10 rounded-full h-1 mt-1">
                       <div className="bg-indigo-400 h-1 rounded-full transition-all duration-300" style={{ width: `${att.progress}%` }}></div>
                     </div>
                   ) : (
                     <>{(att.size / 1024 / 1024).toFixed(2)} MB</>
                   )}
                </span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
