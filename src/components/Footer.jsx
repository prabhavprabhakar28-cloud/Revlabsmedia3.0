import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-2xl font-sans font-semibold mb-4">RevLabs Media House</h2>
            <p className="text-white/70 max-w-sm font-sans">
              A premium video editing studio crafting story-driven content for brands, creators, and agencies.
            </p>
          </div>
          <div>
            <ul className="space-y-4 text-white font-sans text-sm">
              <li><Link to="/work" className="hover:text-white/70 transition-colors">Work</Link></li>
              <li><Link to="/services" className="hover:text-white/70 transition-colors">Services</Link></li>
              <li><Link to="/about" className="hover:text-white/70 transition-colors">About</Link></li>
              <li><Link to="/contact" className="hover:text-white/70 transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <ul className="space-y-4 text-white font-sans text-sm">
              <li><Link to="/privacy" className="hover:text-white/70 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white/70 transition-colors">Terms & Conditions</Link></li>
              <li><a href="mailto:hello@revlabs.online" className="hover:text-white/70 transition-colors">hello@revlabs.online</a></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/10 text-white/50 text-xs font-sans gap-2 text-center md:text-left">
          <p>&copy; 2026 RevLabs Media House. All rights reserved.</p>
          <p>Crafted with intent. Based in India.</p>
        </div>
      </div>
    </footer>
  );
}
