import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, Routes, Route, useLocation } from 'react-router-dom';
import { useAdminData } from '../../hooks/useAdminData';
import AdminReports from './AdminReports';
import AdminUsers from './AdminUsers';
import AdminPayments from './AdminPayments';
import AdminPortfolio from './AdminPortfolio';
import AdminContacts from './AdminContacts';
import { Users, FileText, CreditCard, LayoutDashboard, Shield, Briefcase, Inbox } from 'lucide-react';

export default function AdminPanel() {
  const { users, reports, payments, portfolio, loading } = useAdminData();
  const location = useLocation();

  const totalRevenue = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const pendingReports = reports.filter(r => r.status === 'pending').length;

  const navItems = [
    { to: '/admin',           label: 'Overview',  icon: LayoutDashboard, exact: true },
    { to: '/admin/portfolio', label: 'Portfolio', icon: Briefcase },
    { to: '/admin/reports',   label: 'Reports',   icon: FileText },
    { to: '/admin/users',     label: 'Users',     icon: Users },
    { to: '/admin/payments',  label: 'Payments',  icon: CreditCard },
    { to: '/admin/contacts',  label: 'Inbox',     icon: Inbox },
  ];

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      {/* Admin Top Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <Shield className="w-4 h-4 text-black" />
            </div>
            <div>
              <span className="font-sans text-xs text-white/40 uppercase tracking-[0.2em]">Management</span>
              <h2 className="font-sans text-sm font-medium -mt-1">Admin Control</h2>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="font-sans text-[10px] text-white/60 uppercase tracking-wider">Live System</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 pt-24 pb-20">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Vertical Navigation */}
          <aside className="lg:w-64 shrink-0">
            <nav className="sticky top-24 space-y-2">
              {navItems.map(({ to, label, icon: Icon, exact }) => {
                const active = exact
                  ? location.pathname === to
                  : location.pathname.startsWith(to) && to !== '/admin';
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`group flex items-center gap-4 px-4 py-3 rounded-xl font-sans text-sm transition-all duration-300 ${
                      active
                        ? 'bg-white text-black font-semibold shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-4 h-4 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
                    {label}
                    {active && (
                      <motion.div 
                        layoutId="activeNav"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-black/20"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Dynamic Content Area */}
          <main className="flex-1 min-w-0">
            <Routes>
              {/* Overview Dash */}
              <Route
                index
                element={
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <header className="mb-12">
                      <h1 className="text-4xl md:text-5xl font-sans font-light tracking-tight mb-2">
                        System <span className="font-serif italic text-white/40">Overview</span>
                      </h1>
                      <p className="text-white/40 font-sans">Real-time performance and management metrics.</p>
                    </header>

                    {/* High-Impact Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-12">
                      {[
                        { label: 'Total Users',     value: users.length,    icon: Users,      color: 'from-blue-500/20' },
                        { label: 'Active Reports',  value: reports.length,  icon: FileText,   color: 'from-purple-500/20' },
                        { label: 'Pending Task',    value: pendingReports,  icon: Shield,     color: 'from-amber-500/20' },
                        { label: 'Total Revenue',   value: `$${totalRevenue.toLocaleString('en-US')}`, icon: CreditCard, color: 'from-emerald-500/20' },
                      ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className={`relative group overflow-hidden bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-500`}>
                          <div className={`absolute inset-0 bg-gradient-to-br ${color} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                          <div className="relative flex justify-between items-start mb-4">
                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                              <Icon className="w-5 h-5 text-white/60" />
                            </div>
                            {label === 'Pending Task' && value > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-sans font-bold uppercase tracking-wider border border-amber-500/20">Action Needed</span>
                            )}
                          </div>
                          <p className="relative text-white/40 font-sans text-xs uppercase tracking-[0.15em] mb-1">{label}</p>
                          <p className="relative text-3xl font-sans font-semibold tracking-tight text-white">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Financial Chart Section */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 mb-8">
                      <div className="flex justify-between items-center mb-10">
                        <div>
                          <h3 className="font-sans text-xl font-medium text-white">Revenue <span className="font-serif italic text-white/40">Growth</span></h3>
                          <p className="text-white/30 font-sans text-sm mt-1">Monthly performance based on verified payments.</p>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-sans uppercase tracking-[0.2em] text-white/30">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                            <span>Revenue</span>
                          </div>
                        </div>
                      </div>

                      <div className="h-64 flex items-end gap-3 md:gap-6 px-2">
                        {/* Generate bars based on last 6 months */}
                        {(() => {
                          const months = [];
                          for (let i = 5; i >= 0; i--) {
                            const d = new Date();
                            d.setMonth(d.getMonth() - i);
                            const monthName = d.toLocaleString('default', { month: 'short' });
                            const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
                            
                            const monthlyRev = payments
                              .filter(p => {
                                const pd = new Date(p.created_at);
                                return p.status === 'paid' && pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth();
                              })
                              .reduce((sum, p) => sum + Number(p.amount), 0);
                            
                            months.push({ name: monthName, value: monthlyRev });
                          }

                          const maxVal = Math.max(...months.map(m => m.value), 1000);

                          return months.map((m, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center group">
                              <div className="relative w-full flex flex-col items-center justify-end h-48">
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                  <div className="bg-white text-black text-[10px] font-bold px-2 py-1 rounded shadow-xl">
                                    $${m.value.toLocaleString()}
                                  </div>
                                </div>
                                {/* Bar */}
                                <motion.div 
                                  initial={{ height: 0 }}
                                  animate={{ height: `${(m.value / maxVal) * 100}%` }}
                                  transition={{ duration: 1, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                                  className={`w-full max-w-[40px] rounded-t-lg bg-white/10 group-hover:bg-white transition-colors duration-500 relative overflow-hidden ${m.value > 0 ? 'bg-gradient-to-t from-white/5 to-white' : ''}`}
                                >
                                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                                </motion.div>
                              </div>
                              <span className="mt-4 font-sans text-[10px] text-white/30 uppercase tracking-widest group-hover:text-white transition-colors">{m.name}</span>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>

                    {/* Navigation Shortcut Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { to: '/admin/reports',  label: 'Workflow Queue',  desc: 'Review and approve pending project reports.', icon: FileText, accent: 'bg-purple-500' },
                        { to: '/admin/users',    label: 'User Directory',  desc: 'Manage permissions and user access levels.',  icon: Users,    accent: 'bg-blue-500' },
                        { to: '/admin/payments', label: 'Financial Audit',  desc: 'Track transaction history and revenue flow.', icon: CreditCard, accent: 'bg-emerald-500' },
                      ].map(({ to, label, desc, icon: Icon, accent }) => (
                        <Link
                          key={to}
                          to={to}
                          className="relative group bg-white/[0.02] border border-white/5 rounded-2xl p-8 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500"
                        >
                          <div className={`w-1 h-8 absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full ${accent} opacity-0 group-hover:opacity-100 transition-all duration-500`} />
                          <div className="mb-6 inline-flex p-4 rounded-2xl bg-white/5 group-hover:bg-white/10 transition-colors">
                            <Icon className="w-6 h-6 text-white/40 group-hover:text-white transition-colors" />
                          </div>
                          <h3 className="font-sans text-xl font-medium mb-2 text-white group-hover:translate-x-1 transition-transform">{label}</h3>
                          <p className="text-white/30 font-sans text-sm leading-relaxed">{desc}</p>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                }
              />
              <Route path="reports"   element={<AdminReports />} />
              <Route path="users"     element={<AdminUsers />} />
              <Route path="payments"  element={<AdminPayments />} />
              <Route path="portfolio" element={<AdminPortfolio />} />
              <Route path="contacts"  element={<AdminContacts />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}
