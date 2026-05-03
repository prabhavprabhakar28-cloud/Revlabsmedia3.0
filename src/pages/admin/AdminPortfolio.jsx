import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminData } from '../../hooks/useAdminData';
import { Plus, Pencil, Trash2, X, Loader2, Image as ImageIcon, ExternalLink } from 'lucide-react';
import Button from '../../components/Button';

export default function AdminPortfolio() {
  const { portfolio, loading, addProject, updateProject, deleteProject } = useAdminData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    title: '', category: 'Video', format: '', description: '', 
    brief: '', team: '', deliverables: '', client: '', year: '', 
    quote: '', quote_name: '', image_url: '', is_featured: false
  });
  const [actionLoading, setActionLoading] = useState(false);

  const openModal = (project = null) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        ...project,
        team: project.team?.join(', ') || '',
        deliverables: project.deliverables?.join(', ') || ''
      });
    } else {
      setEditingProject(null);
      setFormData({
        title: '', category: 'Video', format: '', description: '', 
        brief: '', team: '', deliverables: '', client: '', year: '', 
        quote: '', quote_name: '', image_url: '', is_featured: false
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    
    const formattedData = {
      ...formData,
      team: formData.team.split(',').map(s => s.trim()).filter(Boolean),
      deliverables: formData.deliverables.split(',').map(s => s.trim()).filter(Boolean)
    };

    try {
      if (editingProject) {
        await updateProject(editingProject.id, formattedData);
      } else {
        await addProject(formattedData);
      }
      closeModal();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await deleteProject(id);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex justify-between items-center mb-12">
        <div>
          <h2 className="text-3xl font-sans font-light text-white tracking-tight">Portfolio <span className="font-serif italic text-white/40">Manager</span></h2>
          <p className="text-white/40 font-sans text-sm mt-1">Manage the projects displayed on the Work page.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-sans font-semibold text-sm hover:bg-white/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Project
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
              <div className="aspect-video bg-white/5 animate-pulse" />
              <div className="p-6 space-y-3">
                <div className="h-3 bg-white/10 rounded w-1/3 animate-pulse" />
                <div className="h-5 bg-white/10 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-white/5 rounded w-full animate-pulse mt-4" />
                <div className="h-4 bg-white/5 rounded w-2/3 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {portfolio.map((project) => (
            <div key={project.id} className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden group hover:border-white/20 transition-all duration-500">
              <div className="aspect-video bg-white/5 relative">
                {project.image_url ? (
                  <img src={project.image_url} alt={project.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/10">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
                {project.is_featured && (
                  <div className="absolute top-4 left-4 px-3 py-1 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-full">
                    Featured
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <button onClick={() => openModal(project)} className="p-3 bg-white/10 rounded-full hover:bg-white hover:text-black transition-all">
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDelete(project.id)} className="p-3 bg-red-500/10 rounded-full hover:bg-red-500 text-red-500 hover:text-white transition-all">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-white/30 font-sans text-[10px] uppercase tracking-[0.2em]">{project.category} &middot; {project.format}</p>
                    <h3 className="text-xl font-serif italic text-white mt-1">{project.title}</h3>
                  </div>
                  <span className="text-white/20 font-sans text-xs">{project.year}</span>
                </div>
                <p className="text-white/40 font-sans text-sm line-clamp-2">{project.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/90 backdrop-blur-md" 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-8 border-b border-white/5">
                <h3 className="text-2xl font-serif italic text-white">
                  {editingProject ? 'Edit Project' : 'Add New Project'}
                </h3>
                <button onClick={closeModal} className="text-white/40 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* Left Section: Core Info */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-white/40 font-sans text-[10px] uppercase tracking-widest">Project Title</label>
                      <input 
                        required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30"
                        placeholder="e.g. Cinematic Auto"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-white/40 font-sans text-[10px] uppercase tracking-widest">Category</label>
                        <select 
                          value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none"
                        >
                          {['Video', 'Photo', 'Editorial'].map(c => <option key={c} value={c} className="bg-black">{c}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-white/40 font-sans text-[10px] uppercase tracking-widest">Year</label>
                        <input 
                          value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none"
                          placeholder="2024"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-white/40 font-sans text-[10px] uppercase tracking-widest">Client</label>
                      <input 
                        value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none"
                        placeholder="Client name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-white/40 font-sans text-[10px] uppercase tracking-widest">Short Description</label>
                      <textarea 
                        rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none resize-none"
                        placeholder="A brief overview for the grid view..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-white/40 font-sans text-[10px] uppercase tracking-widest">Case Study Brief</label>
                      <textarea 
                        rows={5} value={formData.brief} onChange={e => setFormData({...formData, brief: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none resize-none"
                        placeholder="Detailed project breakdown..."
                      />
                    </div>
                  </div>

                  {/* Right Section: Media & Quote */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-white/40 font-sans text-[10px] uppercase tracking-widest">Image URL</label>
                      <input 
                        value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none"
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-white/40 font-sans text-[10px] uppercase tracking-widest">Team (Comma separated)</label>
                      <input 
                        value={formData.team} onChange={e => setFormData({...formData, team: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none"
                        placeholder="Director, Editor, DP..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-white/40 font-sans text-[10px] uppercase tracking-widest">Deliverables (Comma separated)</label>
                      <input 
                        value={formData.deliverables} onChange={e => setFormData({...formData, deliverables: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none"
                        placeholder="TVC, Social Pack, RAW Files..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-white/40 font-sans text-[10px] uppercase tracking-widest">Client Quote</label>
                      <textarea 
                        rows={3} value={formData.quote} onChange={e => setFormData({...formData, quote: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none resize-none italic"
                        placeholder="Excellent work..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-white/40 font-sans text-[10px] uppercase tracking-widest">Quote Attribute</label>
                      <input 
                        value={formData.quote_name} onChange={e => setFormData({...formData, quote_name: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none"
                        placeholder="CEO, Example Brand"
                      />
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <input 
                        type="checkbox" id="featured" checked={formData.is_featured} 
                        onChange={e => setFormData({...formData, is_featured: e.target.checked})}
                        className="w-5 h-5 rounded bg-white/5 border-white/10 checked:bg-white"
                      />
                      <label htmlFor="featured" className="text-white/80 font-sans text-sm">Feature on Hero Section</label>
                    </div>
                  </div>
                </div>

                <div className="mt-12 flex gap-4">
                  <Button type="submit" disabled={actionLoading} className="flex-1 py-4">
                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (editingProject ? 'Update Project' : 'Create Project')}
                  </Button>
                  <button type="button" onClick={closeModal} className="flex-1 py-4 border border-white/10 rounded-xl font-sans text-sm text-white/60 hover:text-white transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
