import React from 'react';

export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-24 min-h-screen">
      <h1 className="text-5xl font-sans font-light mb-12">Terms & <span className="font-serif italic">Conditions</span></h1>
      
      <div className="space-y-8 font-sans text-white/80 leading-relaxed">
        <section>
          <h2 className="text-xl text-white mb-4">1. Service Agreement</h2>
          <p>By engaging with RevLabs Media House for video editing and post-production services, you agree to these terms. Project commencement is subject to receiving all necessary assets and down payments.</p>
        </section>

        <section>
          <h2 className="text-xl text-white mb-4">2. Pricing Disclaimer</h2>
          <p>All prices generated via our online Calculator are estimates. Final pricing may be subject to change upon review of the raw footage and complexity of the requirements. Clients will be notified of any discrepancies prior to the commencement of work.</p>
        </section>

        <section>
          <h2 className="text-xl text-white mb-4">3. Revision Policy</h2>
          <p>Each package standardly does not include free revisions unless specified. Any extra revisions requested post-delivery will incur a flat fee of ₹20 per revision round, to be billed separately.</p>
        </section>

        <section>
          <h2 className="text-xl text-white mb-4">4. Payment Terms</h2>
          <p>All payments must be made securely via our integrated payment gateway. We require full upfront payment for packages below ₹500. For custom/long-term contracts, milestone-based payments apply. Late invoices incur a 5% monthly fee.</p>
        </section>

        <section>
          <h2 className="text-xl text-white mb-4">5. Intellectual Property</h2>
          <p>Upon final payment, the client receives full usage rights of the delivered final export. RevLabs retains the right to display the final work in our portfolio, unless a Non-Disclosure Agreement (NDA) is signed prior to project start.</p>
        </section>
      </div>
    </div>
  );
}
