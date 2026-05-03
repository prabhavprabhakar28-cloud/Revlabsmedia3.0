import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, Routes, Route, useLocation } from 'react-router-dom';
import { useAdminData } from '../../hooks/useAdminData';
import AdminReports from './AdminReports';
import AdminUsers from './AdminUsers';
import AdminPayments from './AdminPayments';
import AdminPortfolio from './AdminPortfolio';
import AdminContacts from './AdminContacts';
import AdminWorkflow from './AdminWorkflow';
import AdminMeetings from './AdminMeetings';
import {
  Users, FileText, CreditCard, LayoutDashboard, Shield,
  Briefcase, Inbox, Kanban, Calendar,
  TrendingUp, TrendingDown, ArrowUpRight,
  DollarSign, Package, AlertCircle,
} from 'lucide-react';

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ label, value, sub, trend, trendLabel, icon: Icon, gradient, loading, to }) {
  const isPositive = trend >= 0;
  
  const content = (
    <div className={`relative group overflow-hidden bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-500 h-full`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="relative">
        <div className="flex justify-between items-start mb-5">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <Icon className="w-5 h-5 text-white/60" />
          </div>
          {trend !== undefined && !loading && (
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-sans uppercase tracking-wider ${
              isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
            }`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <p className="text-white/40 font-sans text-[10px] uppercase tracking-[0.2em] mb-1">{label}</p>
        {loading ? (
          <div className="h-9 bg-white/5 rounded-lg animate-pulse w-24 mb-1" />
        ) : (
          <p className="text-3xl font-sans font-semibold tracking-tight text-white mb-1">{value}</p>
        )}
        {sub && <p className="text-white/30 font-sans text-xs">{sub}</p>}
        {trendLabel && !loading && (
          <p className="text-white/20 font-sans text-[10px] mt-1">{trendLabel}</p>
        )}
      </div>
    </div>
  );

  return to ? <Link to={to} className="block h-full">{content}</Link> : content;
}

// ── Revenue Bar Chart ─────────────────────────────────────────
function RevenueChart({ data, loading }) {
  const maxVal = Math.max(...data.map(m => m.value), 100);
  return (
    <div className="h-52 flex items-end gap-2 md:gap-4 px-1">
      {loading
        ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full max-w-[40px] rounded-t-lg bg-white/5 animate-pulse"
                style={{ height: `${20 + Math.random() * 60}%` }}
              />
              <div className="h-2 w-6 bg-white/5 rounded animate-pulse" />
            </div>
          ))
        : data.map((m, i) => (
          <div key={i} className="flex-1 flex flex-col items-center group">
            <div className="relative w-full flex flex-col items-center justify-end h-44">
              {/* Hover tooltip */}
              <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="bg-white text-black text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap">
                  ${m.value.toLocaleString()}
                </div>
              </div>
              {/* Bar */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max((m.value / maxVal) * 100, m.value > 0 ? 4 : 0)}%` }}
                transition={{ duration: 0.8, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className={`w-full max-w-[40px] rounded-t-lg transition-colors duration-300 ${
                  m.value > 0
                    ? 'bg-gradient-to-t from-white/20 to-white group-hover:from-white/40 group-hover:to-white'
                    : 'bg-white/5'
                }`}
              />
            </div>
            <span className="mt-3 font-sans text-[10px] text-white/30 uppercase tracking-widest group-hover:text-white/60 transition-colors">
              {m.name}
            </span>
          </div>
        ))}
    </div>
  );
}

// ── Recent Activity Feed ──────────────────────────────────────
function ActivityFeed({ payments, reports, meetings }) {
  const items = [
    ...payments.slice(0, 5).map(p => ({
      type: 'payment',
      label: p.status === 'paid' ? `Payment received — $${Number(p.amount).toLocaleString()}` : `Payment ${p.status}`,
      sub:   p.profiles?.full_name || p.profiles?.email || '—',
      time:  p.created_at,
      color: p.status === 'paid' ? 'text-emerald-400' : p.status === 'failed' ? 'text-red-400' : 'text-yellow-400',
      icon:  CreditCard,
    })),
    ...reports.slice(0, 3).map(r => ({
      type: 'report',
      label: `Project: ${r.title}`,
      sub:   r.profiles?.full_name || '—',
      time:  r.updated_at,
      color: 'text-blue-400',
      icon:  FileText,
    })),
    ...meetings.slice(0, 2).map(m => ({
      type: 'meeting',
      label: `Meeting: ${m.meeting_type} (${m.status})`,
      sub:   m.profiles?.full_name || '—',
      time:  m.created_at,
      color: 'text-purple-400',
      icon:  Calendar,
    })),
  ]
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 8);

  if (items.length === 0) return (
    <p className="text-white/20 font-sans text-sm text-center py-8">No recent activity.</p>
  );

  return (
    <div className="space-y-1">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors"
          >
            <div className={`p-2 rounded-lg bg-white/5 mt-0.5 shrink-0`}>
              <Icon className={`w-3.5 h-3.5 ${item.color}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white/80 font-sans text-sm truncate">{item.label}</p>
              <p className="text-white/30 font-sans text-xs">{item.sub}</p>
            </div>
            <p className="text-white/20 font-sans text-[10px] shrink-0 mt-1">
              {new Date(item.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function AdminPanel() {
  const { users, reports, payments, meetings, analytics, loading } = useAdminData();
  const location = useLocation();

  const navItems = [
    { to: '/admin',            label: 'Overview',  icon: LayoutDashboard, exact: true },
    { to: '/admin/workflow',   label: 'Workflow',  icon: Kanban },
    { to: '/admin/portfolio',  label: 'Portfolio', icon: Briefcase },
    { to: '/admin/reports',    label: 'Reports',   icon: FileText },
    { to: '/admin/users',      label: 'Users',     icon: Users },
    { to: '/admin/payments',   label: 'Payments',  icon: CreditCard },
    { to: '/admin/meetings',   label: 'Meetings',  icon: Calendar },
    { to: '/admin/contacts',   label: 'Inbox',     icon: Inbox },
  ];

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      {/* Admin Top Header - Positioned below main Navbar */}
      <div className="fixed top-20 left-0 right-0 z-40 bg-black/70 backdrop-blur-xl border-b border-y border-white/5 hidden md:block">
        <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-white flex items-center justify-center">
              <Shield className="w-3 h-3 text-black" />
            </div>
            <div>
              <span className="font-sans text-[10px] text-white/40 uppercase tracking-[0.2em]">Admin</span>
              <h2 className="font-sans text-xs font-medium -mt-1">RevLabs Control</h2>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Quick stats in header */}
            {!loading && (
              <div className="hidden lg:flex items-center gap-4 text-[10px] font-sans uppercase tracking-widest">
                <span className="text-emerald-400 font-bold">${analytics.totalRevenue.toLocaleString()}</span>
                <span className="text-white/20">revenue</span>
                <span className="text-white/60 font-bold">{users.length}</span>
                <span className="text-white/20">users</span>
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="font-sans text-[10px] text-white/60 uppercase tracking-wider">Live</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 pt-24 md:pt-40 pb-20 overflow-x-hidden">
        <div className="flex flex-col lg:flex-row gap-12">

          {/* Vertical Navigation */}
          <aside className="lg:w-56 shrink-0">
            <nav className="sticky top-24 md:top-40 space-y-1">
              {navItems.map(({ to, label, icon: Icon, exact }) => {
                const active = exact
                  ? location.pathname === to
                  : location.pathname.startsWith(to) && to !== '/admin';
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl font-sans text-sm transition-all duration-200 ${
                      active
                        ? 'bg-white text-black font-semibold'
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-black' : 'group-hover:text-white/80'}`} />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Dynamic Content Area */}
          <main className="flex-1 min-w-0">
            <Routes>
              {/* ── Overview ──────────────────────────────────── */}
              <Route
                index
                element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <header className="mb-10">
                      <h1 className="text-4xl md:text-5xl font-sans font-light tracking-tight mb-2">
                        System <span className="font-serif italic text-white/40">Overview</span>
                      </h1>
                      <p className="text-white/30 font-sans text-sm">
                        Live metrics — updates automatically as data changes.
                      </p>
                    </header>

                    {/* ── KPI Stat Cards ── */}
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
                      <StatCard
                        label="Total Users"
                        value={loading ? '—' : users.length.toLocaleString()}
                        sub={loading ? '' : `${analytics.newUsersThisWeek} new this week`}
                        trend={analytics.userGrowthPct}
                        trendLabel="vs last week"
                        icon={Users}
                        gradient="from-blue-500/10"
                        loading={loading}
                        to="/admin/users"
                      />
                      <StatCard
                        label="Active Projects"
                        value={loading ? '—' : analytics.activeProjects.toLocaleString()}
                        sub={loading ? '' : `${analytics.pendingReports} awaiting review`}
                        icon={Package}
                        gradient="from-purple-500/10"
                        loading={loading}
                        to="/admin/workflow"
                      />
                      <StatCard
                        label="Monthly Revenue"
                        value={loading ? '—' : `$${analytics.monthlyRevenue.toLocaleString()}`}
                        sub={loading ? '' : `$${analytics.weeklyRevenue.toLocaleString()} this week`}
                        trend={analytics.revenueGrowthPct}
                        trendLabel="vs last month"
                        icon={DollarSign}
                        gradient="from-emerald-500/10"
                        loading={loading}
                        to="/admin/payments"
                      />
                      <StatCard
                        label="Total Revenue"
                        value={loading ? '—' : `$${analytics.totalRevenue.toLocaleString()}`}
                        sub={loading ? '' : `Avg $${analytics.avgOrderValue.toLocaleString()} / order`}
                        icon={TrendingUp}
                        gradient="from-amber-500/10"
                        loading={loading}
                        to="/admin/payments"
                      />
                    </div>

                    {/* ── Revenue Chart + Activity Feed ── */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-10">
                      {/* Revenue Chart */}
                      <div className="xl:col-span-2 bg-white/[0.02] border border-white/5 rounded-2xl p-8">
                        <div className="flex justify-between items-center mb-8">
                          <div>
                            <h3 className="font-sans text-lg font-medium text-white">
                              Revenue <span className="font-serif italic text-white/40">Growth</span>
                            </h3>
                            <p className="text-white/30 font-sans text-xs mt-1">
                              Monthly revenue from verified payments
                            </p>
                          </div>
                          <div className="text-right">
                            {!loading && analytics.revenueGrowthPct !== 0 && (
                              <div className={`flex items-center gap-1 text-xs font-bold font-sans ${
                                analytics.revenueGrowthPct >= 0 ? 'text-emerald-400' : 'text-red-400'
                              }`}>
                                {analytics.revenueGrowthPct >= 0
                                  ? <TrendingUp className="w-3.5 h-3.5" />
                                  : <TrendingDown className="w-3.5 h-3.5" />}
                                {Math.abs(analytics.revenueGrowthPct)}% MoM
                              </div>
                            )}
                          </div>
                        </div>
                        <RevenueChart data={analytics.revenueByMonth} loading={loading} />
                      </div>

                      {/* Activity Feed */}
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8">
                        <h3 className="font-sans text-lg font-medium text-white mb-6">
                          Live <span className="font-serif italic text-white/40">Activity</span>
                        </h3>
                        <ActivityFeed payments={payments} reports={reports} meetings={meetings} />
                      </div>
                    </div>

                    {/* ── Status Breakdown ── */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                      {[
                        {
                          label: 'Payments',
                          items: [
                            { label: 'Paid',    value: analytics.paidCount,    color: 'text-emerald-400' },
                            { label: 'Pending', value: analytics.pendingCount, color: 'text-yellow-400' },
                            { label: 'Failed',  value: analytics.failedCount,  color: 'text-red-400' },
                          ],
                          to: '/admin/payments', icon: CreditCard,
                        },
                        {
                          label: 'Projects',
                          items: [
                            { label: 'Pending',   value: analytics.reportsByStatus['pending']   || 0, color: 'text-yellow-400' },
                            { label: 'Active',    value: analytics.reportsByStatus['approved']  || 0, color: 'text-blue-400' },
                            { label: 'Completed', value: analytics.reportsByStatus['completed'] || 0, color: 'text-emerald-400' },
                          ],
                          to: '/admin/reports', icon: FileText,
                        },
                        {
                          label: 'Meetings',
                          items: [
                            { label: 'Pending',   value: meetings.filter(m => m.status === 'pending').length,   color: 'text-yellow-400' },
                            { label: 'Confirmed', value: meetings.filter(m => m.status === 'confirmed').length, color: 'text-blue-400' },
                            { label: 'Upcoming',  value: analytics.upcomingMeetings,                            color: 'text-purple-400' },
                          ],
                          to: '/admin/meetings', icon: Calendar,
                        },
                      ].map(({ label, items, to, icon: Icon }) => (
                        <Link
                          key={label}
                          to={to}
                          className="group bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
                        >
                          <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-white/40" />
                              <h4 className="text-white/60 font-sans text-sm font-medium">{label}</h4>
                            </div>
                            <ArrowUpRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/60 transition-colors" />
                          </div>
                          <div className="space-y-3">
                            {items.map(it => (
                              <div key={it.label} className="flex justify-between items-center">
                                <span className="text-white/40 font-sans text-xs">{it.label}</span>
                                <span className={`font-sans font-bold text-sm ${it.color}`}>
                                  {loading ? '—' : it.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* ── Quick Navigation ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { to: '/admin/workflow',  label: 'Project Workflow',  desc: 'Kanban board — drag and drop projects between stages.', icon: Kanban, accent: 'bg-purple-500' },
                        { to: '/admin/users',     label: 'User Directory',    desc: 'Manage permissions and view client history.',           icon: Users,  accent: 'bg-blue-500' },
                        { to: '/admin/payments',  label: 'Financial Audit',   desc: 'Full transaction log with filters and breakdowns.',     icon: CreditCard, accent: 'bg-emerald-500' },
                        { to: '/admin/meetings',  label: 'Meeting Schedule',  desc: 'Confirm and manage client meeting requests.',           icon: Calendar, accent: 'bg-amber-500' },
                      ].map(({ to, label, desc, icon: Icon, accent }) => (
                        <Link
                          key={to}
                          to={to}
                          className="relative group bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
                        >
                          <div className={`w-1 h-8 absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full ${accent} opacity-0 group-hover:opacity-100 transition-all duration-500`} />
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors">
                              <Icon className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="font-sans text-base font-medium text-white">{label}</h3>
                          </div>
                          <p className="text-white/30 font-sans text-sm leading-relaxed">{desc}</p>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                }
              />

              {/* ── Sub-routes ─────────────────────────────────── */}
              <Route path="workflow"  element={<AdminWorkflow />} />
              <Route path="reports"   element={<AdminReports />} />
              <Route path="users"     element={<AdminUsers />} />
              <Route path="payments"  element={<AdminPayments />} />
              <Route path="portfolio" element={<AdminPortfolio />} />
              <Route path="contacts"  element={<AdminContacts />} />
              <Route path="meetings"  element={<AdminMeetings />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}
