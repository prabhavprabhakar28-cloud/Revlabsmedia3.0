import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion';
import { usePortfolio } from '../hooks/usePortfolio';
import { X, ChevronLeft, ChevronRight, ArrowUpRight, Loader2 } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import CTASection from '../components/CTASection';

// ── Fallback Data (Used if database is empty) ──────────────────────────────

const staticProjects = [
  {
    title: 'Cinematic Auto',
    category: 'Video',
    format: 'Commercial',
    desc: 'High-octane car commercial focusing on intense lighting arrays and speed.',
    brief: 'Concept-to-delivery commercial production for a luxury automotive brand. The brief required conveying raw power through cinematic lighting and sub-second editorial cuts.',
    team: ['Creative Director', 'DP & Gaffer', 'Post-Production', 'Sound Designer'],
    deliverables: ['60s Hero TVC', '15s Cut-Down', 'Social Package (4:5 + 9:16)'],
    client: 'Undisclosed Automotive Brand',
    year: '2024',
    quote: '"RevLabs turned a product brief into a visual spectacle. The final cut exceeded every benchmark we set."',
    quoteName: 'Head of Marketing',
  },
  {
    title: 'Dusk till Dawn',
    category: 'Photo',
    format: 'Campaign',
    desc: 'A gorgeous 12-piece editorial photo series capturing urban decay.',
    brief: 'A long-form editorial commission exploring urban decay and architectural beauty across three cities. Shot over 14 days across New Delhi, Mumbai, and Kolkata.',
    team: ['Photographer', 'Photo Editor', 'Art Director', 'Location Scout'],
    deliverables: ['12 Hero Stills', 'Behind-The-Scenes Series', 'Print-Ready RAW Files'],
    client: 'Frame Magazine',
    year: '2024',
    quote: '"The Dusk till Dawn series set a new benchmark for editorial photography in India. Absolutely stunning work."',
    quoteName: 'Editor-in-Chief, Frame Magazine',
  },
  {
    title: 'Tech Review Series',
    category: 'Video',
    format: 'YouTube',
    desc: 'Sleek, minimalist aesthetic review series driving millions of organic views.',
    brief: 'A 12-episode YouTube series built around a minimalist, studio-white aesthetic. Designed for maximum watch time and subscriber conversion.',
    team: ['Director', 'Videographer', 'Motion Graphics', 'Script Writer'],
    deliverables: ['12 × 10-min Episodes', 'Thumbnail Library', 'B-Roll Package'],
    client: 'TechPulse India',
    year: '2023',
    quote: '"Average watch-time doubled after RevLabs took over production. The ROI was immediate."',
    quoteName: 'Channel Founder, TechPulse',
  },
  {
    title: 'Digital Frontier',
    category: 'Editorial',
    format: 'Digital Magazine',
    desc: 'Interactive editorial spread pushing the boundaries of grid design.',
    brief: 'A fully interactive digital magazine spread exploring the intersection of technology and human identity. Designed for web and tablet, with animated transitions.',
    team: ['Art Director', 'Interaction Designer', 'Copywriter', 'Web Developer'],
    deliverables: ['Interactive Web Issue', 'Static Print PDF', 'Social Excerpts'],
    client: 'Frontier Journal',
    year: '2024',
    quote: '"The most-read issue in our publication history, by a factor of three."',
    quoteName: 'Creative Director, Frontier Journal',
  },
  {
    title: 'Fashion Week NYC',
    category: 'Video',
    format: 'Social Reels',
    desc: 'Fast-paced, high-retention reel edits prioritizing viral sound synchronization.',
    brief: 'Real-time social content creation during NYFW — shooting and publishing within 90 minutes of each show. Maximizing virality through sound sync and trend awareness.',
    team: ['Social Media Director', 'Videographer', 'Editor', 'Trend Analyst'],
    deliverables: ['30 × Reels', '15 × Story Packages', 'Weekly Highlight Reel'],
    client: 'Multiple Fashion Labels',
    year: '2024',
    quote: '"Our most viral season ever. RevLabs just gets the pace of social media."',
    quoteName: 'Brand Manager, Fashion Label',
  },
  {
    title: 'Neo-Tokyo',
    category: 'Photo',
    format: 'Street',
    desc: 'Cyberpunk-inspired night photography utilizing custom light prisms.',
    brief: 'An art-driven personal project turned commercial commission. Custom fabricated prism setups used to create unique in-camera light distortions across Tokyo\'s Shibuya and Shinjuku districts.',
    team: ['Lead Photographer', 'Lighting Technician', 'Photo Editor'],
    deliverables: ['40 Final Stills', 'Limited Edition Print Run (50)', 'Digital Gallery License'],
    client: 'Private Collector + Gallery Exhibition',
    year: '2023',
    quote: '"Neo-Tokyo is the most technically inventive photography I\'ve seen come out of Asia in years."',
    quoteName: 'Gallery Curator, Tokyo Arts Initiative',
  },
];

const testimonials = [
  {
    quote: "RevLabs doesn't just execute briefs — they redefine them. The Cinematic Auto campaign is the single most-shared piece of content our brand has ever produced.",
    name: 'Arjun Sharma',
    title: 'VP of Brand, Velocity Motors',
    project: 'Cinematic Auto',
  },
  {
    quote: "Working with RevLabs felt like collaborating with a creative studio that genuinely cares about the story behind the product. They elevated our fashion content into art.",
    name: 'Priya Menon',
    title: 'Creative Lead, Élite Fashion',
    project: 'Fashion Week NYC',
  },
  {
    quote: "Every deliverable arrived ahead of schedule and above spec. They are the rare team that brings both technical mastery and creative vision to every frame.",
    name: 'Rohan Pillai',
    title: 'Editor-in-Chief, Frame Magazine',
    project: 'Dusk till Dawn',
  },
];

const processSteps = [
  {
    number: '01',
    label: 'Concept',
    desc: 'Deep-dive discovery sessions to define the creative brief, visual language, and measurable outcomes.',
  },
  {
    number: '02',
    label: 'Pre-Production',
    desc: 'Shot lists, location scouting, crew assembly, and a frame-by-frame storyboard before a single camera rolls.',
  },
  {
    number: '03',
    label: 'Production',
    desc: 'Precision execution on set. Every lighting array, angle, and performance captured with intent.',
  },
  {
    number: '04',
    label: 'Delivery',
    desc: 'Post-production, colour grade, sound design, and multi-format export — on time, every time.',
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function CaseStudyPanel({ project, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden col-span-1 md:col-span-2"
    >
      <div className="border border-white/10 rounded-sm bg-[#050505] mb-16">
        {/* Top bar */}
        <div className="flex justify-between items-center px-8 py-5 border-b border-white/10">
          <div className="flex items-center gap-4">
            <span className="text-white/40 font-sans text-xs uppercase tracking-widest">Case Study</span>
            <span className="text-white/20">·</span>
            <span className="text-white/60 font-sans text-xs uppercase tracking-widest">{project.client}</span>
            <span className="text-white/20">·</span>
            <span className="text-white/40 font-sans text-xs">{project.year}</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
          {/* Visual placeholder */}
          <div className="lg:col-span-3 aspect-video bg-[#0a0a0a] border-b lg:border-b-0 lg:border-r border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <h2 className="text-5xl md:text-7xl font-serif italic text-white/10">{project.title}</h2>
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-2 p-8 flex flex-col gap-8">
            <div>
              <h3 className="text-3xl font-serif italic text-white mb-3">{project.title}</h3>
              <p className="text-white/60 font-sans text-sm leading-relaxed">{project.brief}</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-white/30 font-sans text-[10px] uppercase tracking-[0.2em] mb-2">Team</p>
                <ul className="space-y-1">
                  {project.team.map(t => (
                    <li key={t} className="text-white/70 font-sans text-xs">{t}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-white/30 font-sans text-[10px] uppercase tracking-[0.2em] mb-2">Deliverables</p>
                <ul className="space-y-1">
                  {project.deliverables.map(d => (
                    <li key={d} className="text-white/70 font-sans text-xs">{d}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Client quote */}
            <div className="border-t border-white/10 pt-6">
              <p className="text-white/80 font-serif italic text-sm leading-relaxed mb-3">
                {project.quote}
              </p>
              <p className="text-white/30 font-sans text-[11px] uppercase tracking-widest">— {project.quoteName}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TestimonialsSection() {
  const [active, setActive] = useState(0);
  const intervalRef = useRef(null);

  const startTimer = () => {
    intervalRef.current = setInterval(() => {
      setActive(prev => (prev + 1) % testimonials.length);
    }, 5000);
  };

  useEffect(() => {
    startTimer();
    return () => clearInterval(intervalRef.current);
  }, []);

  const goTo = (idx) => {
    clearInterval(intervalRef.current);
    setActive(idx);
    startTimer();
  };

  const prev = () => goTo((active - 1 + testimonials.length) % testimonials.length);
  const next = () => goTo((active + 1) % testimonials.length);

  return (
    <section className="py-32 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Label */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-4 mb-16"
        >
          <div className="w-8 h-px bg-white/30" />
          <span className="font-sans text-xs text-white/40 uppercase tracking-[0.25em]">Client Voices</span>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Large quote mark */}
          <div className="lg:col-span-1 hidden lg:flex items-start">
            <span className="font-serif italic text-[120px] leading-none text-white/8 select-none">&ldquo;</span>
          </div>

          {/* Quote content */}
          <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <blockquote className="text-2xl md:text-4xl font-serif italic text-white leading-relaxed mb-8">
                  {testimonials[active].quote}
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-px bg-white/20" />
                  <div>
                    <p className="font-sans font-medium text-white text-sm">{testimonials[active].name}</p>
                    <p className="font-sans text-white/40 text-xs mt-0.5">{testimonials[active].title}</p>
                  </div>
                  <span className="ml-2 px-3 py-1 border border-white/10 rounded-full text-white/30 font-sans text-[10px] uppercase tracking-widest">
                    {testimonials[active].project}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="lg:col-span-2 flex lg:flex-col items-center gap-6">
            <div className="flex lg:flex-col gap-3">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`transition-all duration-300 ${
                    i === active
                      ? 'w-6 h-6 lg:w-6 lg:h-6 bg-white rounded-sm'
                      : 'w-2 h-2 bg-white/20 rounded-full hover:bg-white/40'
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-3 lg:mt-4">
              <button
                onClick={prev}
                className="w-10 h-10 border border-white/10 rounded-sm flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={next}
                className="w-10 h-10 border border-white/10 rounded-sm flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProcessTimeline() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.8', 'end 0.5'],
  });
  const lineWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <section className="py-32 border-t border-white/10" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Label */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-20"
        >
          <div className="flex items-center gap-4">
            <div className="w-8 h-px bg-white/30" />
            <span className="font-sans text-xs text-white/40 uppercase tracking-[0.25em]">How We Work</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-sans font-light tracking-tight text-right">
            The <span className="font-serif italic">Process</span>
          </h2>
        </motion.div>

        {/* Animated connector line */}
        <div className="relative mb-12 hidden md:block">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-white/8" />
          <motion.div
            className="absolute top-1/2 left-0 h-px bg-white/40"
            style={{ width: lineWidth }}
          />
          {/* Step dots on the line */}
          <div className="relative flex justify-between">
            {processSteps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.15 }}
                className="w-3 h-3 rounded-full bg-white border-4 border-black"
              />
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4">
          {processSteps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="group"
            >
              {/* Number */}
              <div className="mb-6">
                <span className="font-serif italic text-7xl md:text-8xl text-white/10 leading-none select-none group-hover:text-white/20 transition-colors duration-500">
                  {step.number}
                </span>
              </div>
              {/* Step Label */}
              <h3 className="text-xl font-sans font-medium text-white mb-3 uppercase tracking-widest">
                {step.label}
              </h3>
              <div className="w-8 h-px bg-white/20 mb-4 group-hover:w-16 transition-all duration-500" />
              <p className="text-white/50 font-sans text-sm leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Work() {
  useSEO({ title: 'Our Work', description: 'A curated selection of RevLabs finest visual storytelling projects — video, photo, and editorial.', canonical: '/work' });
  const { projects: dbProjects, loading } = usePortfolio();
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeCaseStudy, setActiveCaseStudy] = useState(null);

  // Combine DB projects with static fallbacks if needed
  // For now, if DB has items, we use those. If not, we use static.
  const projects = dbProjects.length > 0 ? dbProjects : staticProjects;

  const categories = ['All', 'Video', 'Photo', 'Editorial'];

  const filteredProjects = activeCategory === 'All'
    ? projects
    : projects.filter(p => p.category === activeCategory);

  const handleCardClick = (title) => {
    setActiveCaseStudy(prev => (prev === title ? null : title));
  };

  // Close on ESC
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') setActiveCaseStudy(null); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Reset case study when category filter changes
  useEffect(() => { setActiveCaseStudy(null); }, [activeCategory]);

  return (
    <>
      <div className="max-w-7xl mx-auto px-6 py-32 min-h-screen">

        {/* ── Header ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl md:text-8xl font-sans font-light mb-6 uppercase tracking-wider">
            Our <span className="font-serif italic lowercase normal-case">Work</span>
          </h1>
          <p className="text-white/70 font-sans max-w-xl mx-auto text-lg leading-relaxed">
            A curated selection of our finest visual storytelling projects, pushing the boundaries of aesthetics and performance.
          </p>
        </motion.div>

        {/* ── Featured Hero ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mb-24 group relative w-full h-[60vh] min-h-[500px] bg-[#050505] border border-white/10 rounded-sm overflow-hidden cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-10" />
          <div className="absolute inset-0 bg-white/5 group-hover:scale-105 transition-transform duration-[1.5s] ease-out z-0" />

          <div className="absolute bottom-0 left-0 p-8 md:p-12 z-20 w-full md:w-2/3">
            <div className="text-white/60 text-sm font-sans tracking-widest uppercase mb-4 flex items-center gap-4">
              <span className="bg-white/10 px-3 py-1 rounded-full text-white/90">Featured Project</span>
              <span>Video &middot; Documentary</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-serif italic text-white mb-6">The Artisan</h2>
            <p className="text-xl text-white/80 font-sans leading-relaxed">
              A deeply immersive 20-minute brand documentary exploring the fading art of classical horology, winning multiple digital storytelling awards.
            </p>
          </div>
        </motion.div>

        {/* ── Category Tabs ───────────────────────────────────── */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-full font-sans text-sm transition-all duration-300 ${
                activeCategory === cat
                  ? 'bg-white text-black'
                  : 'text-white/60 hover:text-white border border-white/20 hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── Project Grid with Inline Case Studies ───────────── */}
        {loading && dbProjects.length === 0 ? (
          <div className="flex justify-center py-32">
            <Loader2 className="w-12 h-12 text-white/10 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-16">
          <AnimatePresence>
            {filteredProjects.map((project, idx) => {
              const isActive = activeCaseStudy === project.title;
              return (
                <React.Fragment key={project.title}>
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                    transition={{ duration: 0.5, delay: idx * 0.05 }}
                    className={`group cursor-pointer hover:-translate-y-2 transition-transform duration-500 ${isActive ? '-translate-y-2' : ''}`}
                    onClick={() => handleCardClick(project.title)}
                  >
                    {/* Thumbnail */}
                    <div className={`relative aspect-[4/3] bg-white/5 border rounded-[2px] overflow-hidden mb-6 transition-all duration-500 ${
                      isActive ? 'border-white/30 shadow-[0_20px_40px_-15px_rgba(255,255,255,0.08)]' : 'border-white/10 group-hover:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.05)]'
                    }`}>
                      {/* Smart Media: Video Embed > Image > Gradient Fallback */}
                      {project.video_url ? (
                        <iframe
                          src={project.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/').replace('vimeo.com/', 'player.vimeo.com/video/')}
                          className="absolute inset-0 w-full h-full"
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                          title={project.title}
                        />
                      ) : project.image_url ? (
                        <img src={project.image_url} alt={project.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                      ) : (
                        <div className="absolute inset-0 bg-[#0a0a0a] group-hover:scale-110 transition-transform duration-700 ease-out" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {/* Expand indicator */}
                      <div className={`absolute top-4 right-4 w-8 h-8 border border-white/20 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isActive ? 'bg-white rotate-45' : 'bg-transparent group-hover:bg-white/10'
                      }`}>
                        <ArrowUpRight className={`w-3.5 h-3.5 transition-colors ${isActive ? 'text-black' : 'text-white/60'}`} />
                      </div>
                    </div>

                    {/* Meta */}
                    <div>
                      <div className="flex items-center gap-3 text-white/50 text-xs font-sans tracking-widest uppercase mb-3">
                        <span className="text-white/80">{project.category}</span>
                        <span>&middot;</span>
                        <span>{project.format}</span>
                        <span className="ml-auto text-white/25">{project.year}</span>
                      </div>
                      <h3 className={`text-3xl font-serif italic mb-3 transition-colors ${isActive ? 'text-white' : 'text-white group-hover:text-white/80'}`}>
                        {project.title}
                      </h3>
                      <p className="text-white/60 font-sans text-sm leading-relaxed">{project.desc}</p>
                      <p className={`font-sans text-xs mt-3 uppercase tracking-widest transition-all duration-300 ${isActive ? 'text-white/60' : 'text-white/20 group-hover:text-white/40'}`}>
                        {isActive ? 'Click to collapse ↑' : 'Click to expand →'}
                      </p>
                    </div>
                  </motion.div>

                  {/* Inline Case Study Panel — spans full width after every 2nd card */}
                  <AnimatePresence>
                    {isActive && (
                      <CaseStudyPanel
                        key={`case-${project.title}`}
                        project={project}
                        onClose={() => setActiveCaseStudy(null)}
                      />
                    )}
                  </AnimatePresence>
                </React.Fragment>
              );
            })}
          </AnimatePresence>
        </div>
        )}
      </div>

      {/* ── Testimonials ─────────────────────────────────────── */}
      <TestimonialsSection />

      {/* ── Process Timeline ─────────────────────────────────── */}
      <ProcessTimeline />

      {/* ── CTA ──────────────────────────────────────────────── */}
      <CTASection />
    </>
  );
}
