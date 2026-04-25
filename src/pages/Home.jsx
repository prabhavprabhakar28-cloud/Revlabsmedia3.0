import React from 'react';
import { motion } from 'framer-motion';
import Button from '../components/Button';
import { useSEO } from '../hooks/useSEO';

export default function Home() {
  useSEO({
    title: 'Premium Video & Content Production',
    description: 'RevLabs Media House — High-impact video editing, content strategy, and performance-driven visuals for brands and creators.',
    canonical: '/',
  });
  return (
    <div className="relative w-full overflow-x-hidden bg-[#000000] text-white">
      {/* 1. HERO SECTION */}
      <div className="relative w-full h-screen overflow-hidden">
        {/* Background Video */}
        <video
          className="absolute inset-0 w-full h-full object-cover z-0"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260306_074215_04640ca7-042c-45d6-bb56-58b1e8a42489.mp4"
          autoPlay
          loop
          muted
          playsInline
        />

        {/* Main Content Container - 250px bottom padding is required, full height relative to hero */}
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-between pointer-events-none pb-[250px] pt-32 px-6">
          
          {/* Empty spacer to maintain flex justify-between alignment */}
          <div aria-hidden="true" className="h-8 mt-8"></div>

          {/* Hero Content with Corner Accents */}
          <motion.div 
            className="relative max-w-4xl w-full text-center pointer-events-auto p-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            {/* Corner Accents - 7x7px white squares */}
            <div className="absolute top-0 left-0 w-[7px] h-[7px] bg-white" />
            <div className="absolute top-0 right-0 w-[7px] h-[7px] bg-white" />
            <div className="absolute bottom-0 left-0 w-[7px] h-[7px] bg-white" />
            <div className="absolute bottom-0 right-0 w-[7px] h-[7px] bg-white" />

            <h1 className="flex flex-col items-center gap-2 mb-6 pointer-events-auto">
              <span className="font-sans font-light text-[64px] leading-tight text-white m-0 p-0">
                Agency that makes your
              </span>
              <span className="font-serif italic text-[64px] leading-tight text-white m-0 p-0">
                videos & reels viral
              </span>
            </h1>
            
            <p className="max-w-xl mx-auto text-white/75 font-sans mb-10 text-[19px] leading-relaxed">
              We help brands and creators scale through high-impact video editing, content strategy, and performance-driven visuals.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Button to="/services" className="px-10 py-4 text-lg w-full sm:w-auto text-center">
                Get Started
              </Button>
              <Button to="/work" variant="secondary" className="px-10 py-4 text-lg w-full sm:w-auto text-center">
                View Work
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 text-white/60 font-sans text-sm tracking-wide">
              <span>&#9733;</span>
              <span>50+ Projects Delivered</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 2. SERVICES SECTION */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="mb-16">
          <p className="text-white/50 text-xs font-sans tracking-widest uppercase mb-4">WHAT WE DO</p>
          <h2 className="text-5xl md:text-6xl font-sans font-light">One Studio. <span className="font-serif italic drop-shadow-sm">Multiple Crafts.</span></h2>
          <p className="text-white/60 font-sans text-lg leading-relaxed max-w-2xl mt-6">
            We specialize in video editing, graphic design, motion graphics, and web development — delivering high-impact digital experiences across platforms.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { title: 'Reels & Shorts', desc: 'Punchy, scroll-stopping cuts engineered for retention across Instagram, TikTok and YouTube Shorts.' },
            { title: 'Long-Form Video', desc: 'Documentaries, podcasts, interviews and brand films edited with pace and structure.' },
            { title: 'Motion & VFX', desc: 'Branded motion graphics, animations and clean compositing layered into your edit.' },
            { title: 'Color Grading', desc: 'Standard correction or full cinematic looks — applied once per project for visual consistency.' }
          ].map((item, idx) => (
            <div key={idx} className="border border-white/10 rounded-[12px] p-12 bg-[#050505] hover:bg-[#0a0a0a] transition-colors duration-300">
              <h3 className="text-2xl font-serif italic mb-4">{item.title}</h3>
              <p className="text-white/60 font-sans text-[15px] leading-relaxed max-w-md">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. PROCESS SECTION */}
      <section className="py-32 px-6 bg-[#030303] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <p className="text-white/50 text-xs font-sans tracking-widest uppercase mb-4">HOW IT WORKS</p>
            <h2 className="text-5xl md:text-6xl font-sans font-light">Four steps. <span className="font-serif italic lowercase drop-shadow-sm">zero friction.</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {[
              { step: '01', title: 'Brief', desc: 'Share your goal, footage and references.' },
              { step: '02', title: 'Build', desc: 'Use our calculator to scope and book.' },
              { step: '03', title: 'Edit', desc: 'We edit. You review. We refine.' },
              { step: '04', title: 'Deliver', desc: 'Final master files, ready to publish.' }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="text-blue-400 font-sans tracking-widest text-sm mb-4">{item.step} &mdash; {item.title}</div>
                <p className="text-white/70 font-sans leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. WHY REVLABS SECTION */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          <div>
            <p className="text-white/50 text-xs font-sans tracking-widest uppercase mb-4">WHY REVLABS</p>
            <h2 className="text-5xl md:text-6xl font-sans font-light mb-8 pt-2">Premium output. <br/><span className="font-serif italic lowercase drop-shadow-sm">honest pricing.</span></h2>
            <p className="text-white/60 font-sans text-lg leading-relaxed max-w-md">
              Transparent rates, a live calculator and a structured booking flow — so you always know what you're paying for, before you pay.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            {[
              'Senior editor on every project',
              'Live price calculator — no surprise invoices',
              'Clear revision policy: $20 per extra revision',
              'Source files & masters owned by you after payment'
            ].map((text, idx) => (
              <div key={idx} className="bg-[#050505] border border-white/10 rounded-[12px] p-8 flex items-center shadow-lg">
                <p className="text-white/90 font-sans">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CTA SECTION */}
      <section className="py-40 px-6">
        <div className="max-w-5xl mx-auto border border-white/10 rounded-[20px] bg-gradient-to-b from-[#0a0a0a] to-[#000000] p-16 md:p-24 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <h2 className="text-5xl md:text-6xl font-sans font-light mb-6">Ready to ship <span className="font-serif italic pr-1">better video?</span></h2>
          <p className="text-white/60 font-sans text-lg mb-12 max-w-xl mx-auto leading-relaxed">
            Configure your project in under a minute. See the price instantly. Book with confidence.
          </p>
          <Button to="/services" className="px-12 py-5 text-lg">
            Configure your project &rarr;
          </Button>
        </div>
      </section>
    </div>
  );
}
