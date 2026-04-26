import React from 'react';

export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-24 min-h-screen">
      <h1 className="text-5xl font-sans font-light mb-12">Privacy <span className="font-serif italic">Policy</span></h1>
      
      <div className="space-y-8 font-sans text-white/80 leading-relaxed">
        <section>
          <h2 className="text-xl text-white mb-4">1. Information Collection</h2>
          <p>RevLabs Media House ("we," "our," or "us") collects information you provide directly to us, such as when you create an account, submit a project brief, or communicate with us. This includes personal information (e.g., name, email address) compliant with GDPR, US Privacy Laws, and Indian IT Act.</p>
        </section>

        <section>
          <h2 className="text-xl text-white mb-4">2. Data Usage</h2>
          <p>We use the collected data to provide, maintain, and improve our services; to process your transactions and send related information; and to communicate with you regarding your projects and bookings. We never sell your personal data.</p>
        </section>

        <section>
          <h2 className="text-xl text-white mb-4">3. Media & Assets</h2>
          <p>All video footage, images, and raw materials provided by the client remain their intellectual property. RevLabs utilizes these assets solely for the purpose of completing the contracted editing and production services unless explicit promotional permission is granted.</p>
        </section>

        <section>
          <h2 className="text-xl text-white mb-4">4. Security</h2>
          <p>We implement industry-standard security measures to protect your personal information and project assets from unauthorized access, alteration, disclosure, or destruction.</p>
        </section>

        <section>
          <h2 className="text-xl text-white mb-4">5. Your Rights</h2>
          <p>Depending on your location, you may have the right to access, correct, delete, or restrict the use of your personal information. To exercise these rights, contact us directly.</p>
        </section>
      </div>
    </div>
  );
}
