import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  Upload, Link, X, CheckCircle, AlertCircle,
  Loader2, File, Image, ExternalLink, Trash2,
} from 'lucide-react';

const MAX_FILE_SIZE  = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES  = ['image/', 'video/', 'application/pdf', 'text/', 'application/zip', 'application/x-zip'];

function isAllowedType(file) {
  return ALLOWED_TYPES.some(t => file.type.startsWith(t));
}

function formatBytes(bytes) {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileRow({ file, onRemove }) {
  const isImage = file.mime_type?.startsWith('image/');
  const isExternal = file.file_type !== 'upload';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl group"
    >
      <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
        {isImage ? <Image className="w-4 h-4 text-white/40" /> : <File className="w-4 h-4 text-white/40" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-sans text-sm truncate">{file.file_name}</p>
        <p className="text-white/30 font-sans text-xs">
          {isExternal ? file.file_type : formatBytes(file.file_size || 0)}
        </p>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {file.file_url && (
          <a
            href={file.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/40 hover:text-white transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
        {onRemove && (
          <button onClick={() => onRemove(file.id)} className="text-red-400/60 hover:text-red-400 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function FileUpload({ reportId, existingFiles = [], onFilesChange }) {
  const { user } = useAuth();
  const [isDragging, setIsDragging]     = useState(false);
  const [uploading, setUploading]       = useState([]);
  const [error, setError]               = useState('');
  const [linkInput, setLinkInput]       = useState('');
  const [linkType, setLinkType]         = useState('drive');
  const [addingLink, setAddingLink]     = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const fileInputRef = useRef(null);

  const uploadFile = useCallback(async (file) => {
    if (!isAllowedType(file)) {
      setError(`File type not supported: ${file.name}`);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large (max 50MB): ${file.name}`);
      return;
    }

    const uploadId = `${Date.now()}-${Math.random()}`;
    setUploading(prev => [...prev, { id: uploadId, name: file.name, progress: 0 }]);
    setError('');

    try {
      // Upload to Supabase Storage
      const path = `${user.id}/${reportId}/${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, '_')}`;
      const { data, error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(path, file, { upsert: false });

      if (uploadError) {
        // If storage bucket doesn't exist, fall through with a note
        if (uploadError.message?.includes('bucket')) {
          throw new Error('Storage bucket not set up. Please contact admin.');
        }
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage.from('project-files').getPublicUrl(path);

      // Save metadata to DB
      const { data: record, error: dbError } = await supabase
        .from('project_files')
        .insert({
          report_id: reportId,
          user_id:   user.id,
          file_name: file.name,
          file_type: 'upload',
          file_url:  publicUrl,
          file_size: file.size,
          mime_type: file.type,
        })
        .select()
        .single();

      if (dbError) throw dbError;
      onFilesChange?.(prev => [...prev, record]);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(prev => prev.filter(u => u.id !== uploadId));
    }
  }, [user, reportId, onFilesChange]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(uploadFile);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(uploadFile);
    e.target.value = '';
  };

  const handleAddLink = async () => {
    if (!linkInput.trim()) return;
    setAddingLink(true);
    setError('');
    try {
      const { data: record, error: dbError } = await supabase
        .from('project_files')
        .insert({
          report_id: reportId,
          user_id:   user.id,
          file_name: linkInput.trim(),
          file_type: linkType,
          file_url:  linkInput.trim(),
          file_size: null,
          mime_type: null,
        })
        .select()
        .single();

      if (dbError) throw dbError;
      onFilesChange?.(prev => [...prev, record]);
      setLinkInput('');
      setShowLinkInput(false);
    } catch (err) {
      setError(err.message || 'Failed to save link');
    } finally {
      setAddingLink(false);
    }
  };

  const handleRemoveFile = async (fileId) => {
    try {
      const { error } = await supabase.from('project_files').delete().eq('id', fileId);
      if (error) throw error;
      onFilesChange?.(prev => prev.filter(f => f.id !== fileId));
    } catch (err) {
      setError('Failed to remove file');
    }
  };

  return (
    <div className="space-y-4">
      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 font-sans text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto text-red-400/60 hover:text-red-400">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragging
            ? 'border-white/40 bg-white/[0.05]'
            : 'border-white/10 bg-white/[0.01] hover:border-white/20 hover:bg-white/[0.02]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,video/*,.pdf,.zip,.txt,.doc,.docx"
        />
        <Upload className={`w-10 h-10 mx-auto mb-3 transition-colors ${isDragging ? 'text-white/60' : 'text-white/20'}`} />
        <p className="text-white/60 font-sans text-sm font-medium">
          {isDragging ? 'Drop files here' : 'Drag & drop files, or click to browse'}
        </p>
        <p className="text-white/20 font-sans text-xs mt-1">
          Images, videos, PDFs, ZIPs — max 50MB each
        </p>
      </div>

      {/* Link Input Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowLinkInput(!showLinkInput)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-white/40 font-sans text-sm hover:text-white hover:border-white/20 transition-all"
        >
          <Link className="w-4 h-4" />
          Add Google Drive / Dropbox Link
        </button>
      </div>

      <AnimatePresence>
        {showLinkInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 p-4 bg-white/[0.02] border border-white/10 rounded-xl">
              <div className="flex gap-1 p-1 bg-white/5 rounded-lg shrink-0">
                {['drive', 'dropbox', 'other'].map(t => (
                  <button
                    key={t}
                    onClick={() => setLinkType(t)}
                    className={`px-3 py-1 rounded-md font-sans text-[10px] font-bold uppercase tracking-widest transition-all ${
                      linkType === t ? 'bg-white text-black' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <input
                type="url"
                placeholder="Paste your link here..."
                value={linkInput}
                onChange={e => setLinkInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddLink()}
                className="flex-1 bg-transparent text-white font-sans text-sm focus:outline-none placeholder:text-white/20"
              />
              <button
                onClick={handleAddLink}
                disabled={addingLink || !linkInput.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-sans text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-50"
              >
                {addingLink ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Add'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Progress */}
      {uploading.map(u => (
        <div key={u.id} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
          <Loader2 className="w-4 h-4 text-white/40 animate-spin shrink-0" />
          <p className="text-white/60 font-sans text-sm flex-1 truncate">Uploading {u.name}…</p>
        </div>
      ))}

      {/* File List */}
      <AnimatePresence>
        {existingFiles.map(file => (
          <FileRow key={file.id} file={file} onRemove={handleRemoveFile} />
        ))}
      </AnimatePresence>

      {existingFiles.length === 0 && uploading.length === 0 && (
        <p className="text-white/20 font-sans text-xs text-center py-2">
          No files uploaded yet.
        </p>
      )}
    </div>
  );
}
