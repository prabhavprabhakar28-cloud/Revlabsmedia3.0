import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
import { useNavigate } from 'react-router-dom';
import CTASection from '../components/CTASection';
import Accordion from '../components/Accordion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useSEO } from '../hooks/useSEO';

export default function Services() {
  useSEO({ title: 'Services & Pricing', description: 'Browse RevLabs pricing — video editing, photography, web design, and social media packages.', canonical: '/services' });
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Category State
  const categories = ['Video Editing', 'Photo Editing', 'Web Design', 'Social Media'];
  const [activeCategory, setActiveCategory] = useState('Video Editing');

  // --- VIDEO EDITING STATE ---
  const [format, setFormat] = useState('reels'); // 'reels' | 'long'
  
  // Reels State
  const [reelsTier, setReelsTier] = useState('growth'); // 'starter' | 'growth' | 'premium'
  const [reelsCount, setReelsCount] = useState(1);
  const [reelsAddons, setReelsAddons] = useState({ motionGraphics: false, animations: false, vfx: false });
  
  // Long State
  const [longMinutes, setLongMinutes] = useState(5);
  const [longAddons, setLongAddons] = useState({ motionGraphics: false, animations: false, vfx: false });
  
  // Global Video State
  const [colorGrading, setColorGrading] = useState('none');
  const [revisions, setRevisions] = useState(0);

  // Constants for Video (USD)
  const REELS_TIERS = {
    starter: { price: 60, label: 'Starter' },
    growth: { price: 120, label: 'Growth' },
    premium: { price: 200, label: 'Premium' }
  };
  
  const REELS_ADDONS = { motionGraphics: 20, animations: 10, vfx: 15 };
  
  const LONG_BASE = 200; // $200 per 5 mins
  const LONG_ADDONS = { motionGraphics: 80, animations: 60, vfx: 40 };
  
  const COLOR_FEES = { none: 0, standard: 80, cinematic: 150 };
  const REVISION_FEE = 20;

  // Calculate video pricing
  const { total: videoTotal, breakdown: videoBreakdown } = useMemo(() => {
    let t = 0;
    const b = [];
    if (format === 'reels') {
      const tierLabel = REELS_TIERS[reelsTier].label;
      const tierPrice = REELS_TIERS[reelsTier].price;
      const base = tierPrice * reelsCount;
      t += base;
      b.push({ label: `${reelsCount}x Reels (${tierLabel} Tier)`, price: base });
      
      if (reelsAddons.motionGraphics) { t += REELS_ADDONS.motionGraphics * reelsCount; b.push({ label: 'Motion Graphics', price: REELS_ADDONS.motionGraphics * reelsCount }); }
      if (reelsAddons.animations) { t += REELS_ADDONS.animations * reelsCount; b.push({ label: 'Animations', price: REELS_ADDONS.animations * reelsCount }); }
      if (reelsAddons.vfx) { t += REELS_ADDONS.vfx * reelsCount; b.push({ label: 'VFX', price: REELS_ADDONS.vfx * reelsCount }); }
    } else {
      const blocks = Math.ceil(longMinutes / 5);
      const base = LONG_BASE * blocks;
      t += base;
      b.push({ label: `Long Format (${longMinutes} mins)`, price: base });
      
      if (longAddons.motionGraphics) { t += LONG_ADDONS.motionGraphics; b.push({ label: 'Motion Graphics', price: LONG_ADDONS.motionGraphics }); }
      if (longAddons.animations) { t += LONG_ADDONS.animations; b.push({ label: 'Animations', price: LONG_ADDONS.animations }); }
      if (longAddons.vfx) { t += LONG_ADDONS.vfx; b.push({ label: 'VFX', price: LONG_ADDONS.vfx }); }
    }
    
    if (colorGrading !== 'none') {
      t += COLOR_FEES[colorGrading];
      b.push({ label: `Color Grading (${colorGrading})`, price: COLOR_FEES[colorGrading] });
    }
    
    if (revisions > 0) {
      t += revisions * REVISION_FEE;
      b.push({ label: `${revisions}x Revisions`, price: revisions * REVISION_FEE });
    }
    return { total: t, breakdown: b };
  }, [format, reelsTier, reelsCount, reelsAddons, longMinutes, longAddons, colorGrading, revisions]);

  // Modal quote
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const triggerVideoBooking = () => {
    setPendingBooking({ serviceType: 'Video ' + format, total: videoTotal, items: videoBreakdown });
    setIsModalOpen(true);
  };

  const triggerStaticBooking = (title, price) => {
    setPendingBooking({
      serviceType: activeCategory,
      total: price,
      items: [{ label: title, price: price }]
    });
    setIsModalOpen(true);
  };

  const executeBooking = async () => {
    if (!user) {
      navigate('/login', { state: { from: '/services', message: 'Please login to continue booking.' } });
      return;
    }

    console.log('Initiating booking for user:', user.id);
    setIsSaving(true);
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            user_id: user.id,
            service_type: pendingBooking.serviceType,
            total_price: pendingBooking.total,
            breakdown: pendingBooking.items,
            status: 'pending'
          }
        ])
        .select();

      if (error) {
        console.error('Supabase Insert Error:', error);
        throw error;
      }

      console.log('Order saved successfully:', data[0]);
      const bookingData = { ...pendingBooking, orderId: data[0].id };
      localStorage.setItem('revlabs_cart', JSON.stringify(bookingData));
      // Navigate to payment with the order record
      navigate('/payment', { state: bookingData });
    } catch (error) {
      console.error('Catch Block Error:', error);
      alert(`Booking Error: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Static Packages Data (USD)
  const photoPackages = [
    { title: 'Basic Edit', desc: 'Standard retouching and color correction for precision consistency.', price: 30, unit: '/ image', details: [{label: 'Deliverables', value: 'High-res JPEGs/PNGs'}, {label: 'Features', value: 'Color correction, exposure balance'}, {label: 'What\'s included', value: '1 round of revisions'}, {label: 'Benefits', value: 'Consistent brand look'}] },
    { title: 'Advanced Manipulation', desc: 'Complex composites, skin retouching, and VFX integration.', price: 50, unit: '/ image', details: [{label: 'Deliverables', value: 'Multi-layer PSDs & high-res exports'}, {label: 'Features', value: 'Object removal, skin smoothing, composites'}, {label: 'What\'s included', value: '2 rounds of revisions'}, {label: 'Benefits', value: 'Flawless, high-end commercial quality'}] },
    { title: 'Campaign Bulk (10+)', desc: 'Engineered preset grading designed explicitly for huge campaign rollouts.', price: 15, unit: '/ image', details: [{label: 'Deliverables', value: 'Batch processed high-res images'}, {label: 'Features', value: 'Custom engineered presets'}, {label: 'What\'s included', value: 'Priority delivery'}, {label: 'Benefits', value: 'Perfect consistency across massive campaigns'}] }
  ];

  const webPackages = [
    { title: 'Landing Page', desc: 'High-conversion, performance-driven single page build optimized for strict ROAS.', price: 850, unit: ' minimum', details: [{label: 'Deliverables', value: 'Single page build'}, {label: 'Features', value: 'Responsive design, basic SEO'}, {label: 'What\'s included', value: 'Copy integration, form setup'}, {label: 'Benefits', value: 'Rapid deployment, focused conversion'}] },
    { title: 'Multi-Page Website', desc: 'Comprehensive structure parsing, seamless animations, and integrated CMS backend.', price: 2500, unit: ' starting', details: [{label: 'Deliverables', value: 'Up to 5 pages + CMS integration'}, {label: 'Features', value: 'Advanced animations, custom routing'}, {label: 'What\'s included', value: 'Content management system setup'}, {label: 'Benefits', value: 'Scalable architecture for growing brands'}] },
    { title: 'Premium Platform', desc: 'Custom robust agency-level build utilizing experimental logic architectures.', price: 5000, unit: ' starting', details: [{label: 'Deliverables', value: 'Full custom web application'}, {label: 'Features', value: 'Complex state, database integration'}, {label: 'What\'s included', value: 'Performance optimization, analytics'}, {label: 'Benefits', value: 'Enterprise-grade performance and design'}] },
    { title: 'Website Management', desc: 'Continuous maintenance, security audits, and content updates to keep your platform elite.', price: 500, unit: '/ month', details: [{label: 'Deliverables', value: 'Ongoing support & updates'}, {label: 'Features', value: 'Security monitoring, performance tuning'}, {label: 'What\'s included', value: 'Up to 5 hours of edits/mo'}, {label: 'Benefits', value: 'Zero downtime and peak performance'}] }
  ];

  const socialPackages = [
    { title: 'Starter', desc: 'Standard strategic scheduling and brand formulation execution.', price: 1000, unit: '/ month', details: [{label: 'Deliverables', value: '12 posts per month'}, {label: 'Features', value: 'Content calendar, basic copy'}, {label: 'What\'s included', value: 'Monthly strategy call'}, {label: 'Benefits', value: 'Consistent active presence'}] },
    { title: 'Growth Engine', desc: 'Heavy trend analysis mixed with precision community engagement and targeting.', price: 1500, unit: '/ month', details: [{label: 'Deliverables', value: '20 posts + 5 Reels/Shorts per month'}, {label: 'Features', value: 'Trend capitalization, community management'}, {label: 'What\'s included', value: 'Bi-weekly analytics review'}, {label: 'Benefits', value: 'Rapid audience growth and high engagement'}] },
    { title: 'Premium Scale', desc: 'Complete omnipresence pipeline, deep analytics, and relentless performance tuning.', price: 3000, unit: '/ month', details: [{label: 'Deliverables', value: 'Daily posts + 15 Reels/Shorts per month'}, {label: 'Features', value: 'Omni-channel distribution, viral hook engineering'}, {label: 'What\'s included', value: 'Weekly strategy syncs, VIP support'}, {label: 'Benefits', value: 'Total market domination and explosive scaling'}] }
  ];

  return (
    <>
      <div className="max-w-7xl mx-auto px-6 py-20 md:py-32 min-h-screen">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-sans font-light mb-6">Our <span className="font-serif italic drop-shadow-sm">Services</span></h1>
          <p className="text-white/70 font-sans max-w-2xl mx-auto text-lg">Comprehensive, growth-driven visual systems engineered for elite creators and global brands.</p>
        </div>

        {/* Category Navbar */}
        <div className="flex flex-wrap justify-center gap-4 mb-20">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-8 py-3 outline-none rounded-full font-sans text-sm tracking-wide transition-all duration-300 ${
                activeCategory === cat 
                ? 'bg-white text-black font-semibold' 
                : 'text-white/60 hover:text-white border border-white/20 hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Dynamic Content */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            
            {/* VIDEO EDITING */}
            {activeCategory === 'Video Editing' && (
              <motion.div 
                key="video"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-12"
              >
                {/* Left Col: Configurator */}
                <div className="lg:col-span-7 space-y-12">
                  <div className="bg-[#050505] border border-white/10 rounded-[12px] p-8">
                    <h3 className="text-xl font-sans mb-6 font-semibold tracking-wide">Select Production Scale</h3>
                    <div className="flex gap-4">
                      <button onClick={() => setFormat('reels')} className={`flex-1 py-4 px-4 rounded-[8px] transition-all font-sans ${format === 'reels' ? 'bg-[#f8f8f8] text-black' : 'bg-transparent text-white border border-white/20 hover:bg-white/10'}`}>Reels / Shorts</button>
                      <button onClick={() => setFormat('long')} className={`flex-1 py-4 px-4 rounded-[8px] transition-all font-sans ${format === 'long' ? 'bg-[#f8f8f8] text-black' : 'bg-transparent text-white border border-white/20 hover:bg-white/10'}`}>Long Format</button>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {format === 'reels' ? (
                      <motion.div key="reels" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-8">
                        
                        {/* New Reels Tiers */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                          {[
                            { id: 'starter', label: 'Starter', price: '$60 / clip', desc: 'Clean cuts & basic pacing.', details: [{label: 'Deliverables', value: '1080p MP4'}, {label: 'Features', value: 'Basic cuts, text'}, {label: 'What\'s included', value: '1 round of revisions'}, {label: 'Benefits', value: 'Cost-effective content'}] },
                            { id: 'growth', label: 'Growth', price: '$120 / clip', desc: 'High-impact edits, subtitles & sound design.', popular: true, details: [{label: 'Deliverables', value: '4K MP4'}, {label: 'Features', value: 'Motion graphics, sound effects'}, {label: 'What\'s included', value: '2 rounds of revisions'}, {label: 'Benefits', value: 'High retention and engagement'}] },
                            { id: 'premium', label: 'Premium', price: '$200+ / clip', desc: 'Complex storytelling & heavy assets.', details: [{label: 'Deliverables', value: '4K MP4 + Source files'}, {label: 'Features', value: 'Advanced VFX, custom sound design'}, {label: 'What\'s included', value: 'Unlimited revisions'}, {label: 'Benefits', value: 'Cinematic quality for top tier creators'}] }
                          ].map((tier) => (
                            <div 
                              key={tier.id}
                              onClick={() => setReelsTier(tier.id)}
                              className={`relative cursor-pointer transition-all duration-300 p-6 rounded-[12px] border flex flex-col justify-between ${reelsTier === tier.id ? 'bg-[#151515] border-white' : 'bg-[#050505] border-white/10 hover:border-white/30'}`}
                            >
                              <div>
                                {tier.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full whitespace-nowrap">Most Popular</span>}
                                <h4 className="font-serif italic text-2xl mb-1">{tier.label}</h4>
                                <p className="text-xl font-sans text-white/90 mb-4">{tier.price}</p>
                                <p className="text-sm font-sans text-white/50">{tier.desc}</p>
                              </div>
                              {tier.details && (
                                <div onClick={e => e.stopPropagation()} className="mt-4">
                                  <Accordion details={tier.details} />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="bg-[#050505] border border-white/10 rounded-[12px] p-8">
                          <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-sans font-semibold">Volume Structure</h3><span className="text-3xl font-serif italic">{reelsCount} {reelsCount === 1 ? 'Clip' : 'Clips'}</span></div>
                          <input type="range" min="1" max="30" value={reelsCount} onChange={(e) => setReelsCount(parseInt(e.target.value))} className="w-full accent-[#f8f8f8]" />
                          <p className="text-white/50 text-sm mt-4 text-right">Applying {REELS_TIERS[reelsTier].label} scaling multiplier</p>
                        </div>
                        
                        <div className="bg-[#050505] border border-white/10 rounded-[12px] p-8">
                          <h3 className="text-xl font-sans mb-6 font-semibold">Reels Growth Engine Add-ons</h3>
                          <div className="space-y-4">
                            {Object.entries({ motionGraphics: 'Motion Graphics (+$20/clip)', animations: 'Animations (+$10/clip)', vfx: 'VFX (+$15/clip)' }).map(([key, label]) => (
                              <label key={key} className="flex items-center gap-4 cursor-pointer">
                                <input type="checkbox" checked={reelsAddons[key]} onChange={(e) => setReelsAddons({...reelsAddons, [key]: e.target.checked})} className="w-5 h-5 rounded-[4px] accent-white" />
                                <span className="font-sans text-white/80">{label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div key="long" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-8 pt-4">
                        <div className="bg-[#050505] border border-white/10 rounded-[12px] p-8">
                          <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-sans font-semibold">Runtime Duration</h3><span className="text-3xl font-serif italic">{longMinutes} mins</span></div>
                          <input type="range" min="5" max="60" step="5" value={longMinutes} onChange={(e) => setLongMinutes(parseInt(e.target.value))} className="w-full accent-[#f8f8f8]" />
                          <p className="text-white/50 text-sm mt-4 text-right">${LONG_BASE} per 5-minute block</p>
                        </div>
                        <div className="bg-[#050505] border border-white/10 rounded-[12px] p-8">
                          <h3 className="text-xl font-sans mb-6 font-semibold">Premium Asset Add-ons</h3>
                          <div className="space-y-4">
                            {Object.entries({ motionGraphics: 'Motion Graphics (+$80 flat)', animations: 'Animations (+$60 flat)', vfx: 'VFX (+$40 flat)' }).map(([key, label]) => (
                              <label key={key} className="flex items-center gap-4 cursor-pointer">
                                <input type="checkbox" checked={longAddons[key]} onChange={(e) => setLongAddons({...longAddons, [key]: e.target.checked})} className="w-5 h-5 rounded-[4px] accent-white" />
                                <span className="font-sans text-white/80">{label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="bg-[#050505] border border-white/10 rounded-[12px] p-8 space-y-8">
                    <div>
                      <h3 className="text-xl font-sans mb-6 font-semibold">Color Grading Standard</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[ { id: 'none', label: 'Raw' }, { id: 'standard', label: 'Standard (+$80)' }, { id: 'cinematic', label: 'Cinematic (+$150)' } ].map(opt => (
                          <button key={opt.id} onClick={() => setColorGrading(opt.id)} className={`py-4 px-4 rounded-[8px] text-sm transition-all font-sans ${colorGrading === opt.id ? 'bg-[#f8f8f8] text-black' : 'bg-transparent text-white border border-white/20 hover:bg-white/10'}`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="pt-8 border-t border-white/10">
                      <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-sans font-semibold">Refinement Passes</h3><span className="text-3xl font-serif italic">{revisions}</span></div>
                      <input type="range" min="0" max="10" value={revisions} onChange={(e) => setRevisions(parseInt(e.target.value))} className="w-full accent-white" />
                      <p className="text-white/50 text-sm mt-4 text-right">${REVISION_FEE} per additional revision round</p>
                    </div>
                  </div>
                </div>

                {/* Right Col: Live Invoice */}
                <div className="lg:col-span-5 relative">
                  <div className="lg:sticky top-32 bg-[#0a0a0a] border border-white/10 p-8 lg:p-10 rounded-[12px] shadow-2xl">
                    <h2 className="text-3xl font-sans font-light mb-8 pb-4 border-b border-white/10">Project Engine</h2>
                    <div className="space-y-4 mb-10 min-h-[150px]">
                      <AnimatePresence>
                        {videoBreakdown.map((item, idx) => (
                          <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }} className="flex justify-between text-white/80 font-sans text-sm tracking-wide">
                            <span className="pr-4">{item.label}</span>
                            <span className="font-medium pr-1">${item.price.toLocaleString()}</span>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                    <div className="border-t border-white/20 pt-8 mb-8 flex justify-between items-end">
                      <div>
                        <span className="font-sans text-white/50 uppercase tracking-widest text-xs block mb-1">Total Estimate</span>
                        <span className="text-[10px] text-white/30 uppercase tracking-widest block">Inclusive of all taxes</span>
                      </div>
                      <span className="font-serif italic text-5xl">${videoTotal.toLocaleString()}</span>
                    </div>
                    <Button onClick={triggerVideoBooking} className="w-full text-center text-xl py-6 rounded-[8px]">
                      Proceed to Booking
                    </Button>
                    <p className="text-white/40 text-xs text-center mt-4">Calculations are in USD ($) representing premium market rates.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STATIC PACKAGES */}
            {activeCategory !== 'Video Editing' && (
              <motion.div 
                key={activeCategory}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`grid grid-cols-1 ${activeCategory === 'Web Design' ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'} gap-8`}
              >
                {(activeCategory === 'Photo Editing' ? photoPackages : activeCategory === 'Web Design' ? webPackages : socialPackages).map((pkg, idx) => (
                  <div key={idx} className="group bg-[#050505] border border-white/10 p-10 rounded-[12px] flex flex-col justify-between hover:bg-[#0a0a0a] hover:border-white/30 hover:-translate-y-2 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.05)]">
                    <div>
                      <h3 className="text-3xl font-serif italic mb-4">{pkg.title}</h3>
                      <p className="text-white/60 font-sans leading-relaxed mb-4">{pkg.desc}</p>
                      {pkg.details && <Accordion details={pkg.details} />}
                    </div>
                    <div className="mt-8">
                      <div className="text-3xl font-sans font-light text-white mb-8 border-t border-white/10 pt-8">
                        ${pkg.price.toLocaleString()}<span className="text-base text-white/50 font-sans">{pkg.unit}</span>
                      </div>
                      <Button onClick={() => triggerStaticBooking(`${activeCategory} - ${pkg.title}`, pkg.price)} variant="primary" className="w-full text-center rounded-[8px]">
                        Secure Package
                      </Button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <CTASection />

      {/* Booking Modal Popup */}
      <AnimatePresence>
        {isModalOpen && pendingBooking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-[#0a0a0a] border border-white/10 rounded-[12px] p-10 max-w-lg w-full relative">
              <h2 className="text-4xl font-serif italic mb-4">Confirm Scale Architecture</h2>
              <p className="text-white/60 font-sans mb-8 leading-relaxed">You are staging the deployment of our premium {pendingBooking.serviceType} package. Proceeding will verify your slot and take you to secure checkout.</p>
              
              <div className="space-y-4 mb-10 bg-white/5 p-6 rounded-[8px] border border-white/10">
                <div className="flex justify-between font-sans text-sm text-white/80">
                  <span>Selected Engine</span>
                  <span className="capitalize">{pendingBooking.serviceType}</span>
                </div>
                <div className="flex justify-between font-sans text-sm text-white border-t border-white/20 pt-4 mt-4">
                  <div>
                    <span className="block">Total Capital Due</span>
                    <span className="text-[10px] text-white/40 uppercase tracking-widest block font-sans">Inclusive of all taxes</span>
                  </div>
                  <span className="text-xl font-medium">${pendingBooking.total.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 px-4 font-sans text-white/70 hover:text-white transition-colors border border-white/20 hover:bg-white/10 rounded-[8px]">
                  Cancel
                </button>
                <Button onClick={executeBooking} className="flex-1 text-center py-4 rounded-[8px]" disabled={isSaving}>
                  {isSaving ? 'Initializing...' : 'Pay Securely'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
