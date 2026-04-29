import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { CreditCard, Shield, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

// Dynamically load the Razorpay SDK
const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function Payment() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [cartData, setCartData] = useState(location.state || null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);

  useEffect(() => {
    if (!cartData) {
      const stored = localStorage.getItem('revlabs_cart');
      if (stored) {
        try { setCartData(JSON.parse(stored)); }
        catch { setCartData(null); }
      }
    }
  }, [cartData]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) navigate('/login', { state: { from: '/payment', message: 'Please sign in to complete your purchase.' } });
  }, [user, navigate]);

  const handlePayment = async () => {
    if (!cartData?.total) return setError('No items in cart.');
    setLoading(true);
    setError('');

    // 1. Load Razorpay SDK
    const loaded = await loadRazorpay();
    if (!loaded) {
      setError('Failed to load payment SDK. Check your internet connection.');
      setLoading(false);
      return;
    }

    try {
      // 2. Create order via Edge Function (server-side — never trust frontend amount)
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-razorpay-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            amount:      cartData.total,       // Amount in USD
            currency:    'USD',
            service_type: cartData.serviceType || 'RevLabs Service',
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create payment order.');
      }

      const order = await response.json();

      // 3. Insert pending payment record
      const { data: paymentRecord, error: insertError } = await supabase
        .from('payments')
        .insert({
          user_id:          user.id,
          amount:           cartData.total,
          currency:         'INR',
          status:           'pending',
          payment_provider: 'razorpay',
          provider_order_id: order.id,
          service_type:     cartData.serviceType || 'RevLabs Service',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 4. Open Razorpay checkout
      const options = {
        key:         import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount:      order.amount,   // Amount in paise (Razorpay uses paise)
        currency:    order.currency,
        name:        'RevLabs',
        description: cartData.serviceType || 'Creative Services',
        order_id:    order.id,
        prefill: {
          name:  profile?.full_name || '',
          email: user.email || '',
        },
        theme: { color: '#ffffff' },
        handler: async (response) => {
          // 5. Store payment IDs — webhook will verify & mark as paid
          await supabase
            .from('payments')
            .update({
              provider_payment_id: response.razorpay_payment_id,
              provider_signature:  response.razorpay_signature,
              // Status stays 'pending' — webhook will set it to 'paid'
            })
            .eq('id', paymentRecord.id);

          localStorage.removeItem('revlabs_cart');
          setSuccess(true);
          setLoading(false);
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async (response) => {
        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('id', paymentRecord.id);
        setError(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });
      rzp.open();

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
          <h1 className="text-4xl font-serif italic text-white mb-4">Payment Initiated!</h1>
          <p className="text-white/50 font-sans mb-2">Your payment is being verified.</p>
          <p className="text-white/30 font-sans text-sm mb-8">We'll confirm once the webhook verifies your transaction.</p>
          <a href="/dashboard" className="px-8 py-4 bg-white text-black rounded-full font-sans font-semibold hover:bg-white/90 transition-colors">
            Go to Dashboard
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white pt-28 pb-20 px-6">
      <div className="max-w-2xl mx-auto">

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-white/40 font-sans text-sm uppercase tracking-widest mb-3">Checkout</p>
          <h1 className="text-4xl font-sans font-light mb-10">
            Complete Your <span className="font-serif italic">Order</span>
          </h1>

          {/* Cart Summary */}
          <div className="bg-[#050505] border border-white/10 rounded-[12px] p-8 mb-6">
            <h2 className="text-lg font-sans font-medium mb-6 text-white/80">Order Summary</h2>

            {cartData ? (
              <div className="space-y-3">
                {cartData.items?.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm font-sans">
                    <span className="text-white/70">{item.name}</span>
                    <span className="text-white">${Number(item.price).toLocaleString('en-US')}</span>
                  </div>
                )) ?? (
                  <div className="flex justify-between items-center text-sm font-sans">
                    <span className="text-white/70">{cartData.serviceType || 'Service Package'}</span>
                    <span className="text-white">${Number(cartData.total).toLocaleString('en-US')}</span>
                  </div>
                )}
                <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                  <span className="font-sans font-semibold text-white">Total</span>
                  <div className="text-right">
                    <span className="text-2xl font-sans font-semibold text-white block">
                      ${Number(cartData.total).toLocaleString('en-US')}
                    </span>
                    <span className="text-[10px] text-white/40 uppercase tracking-widest block -mt-1">
                      Inclusive of all taxes
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-white/30 font-sans">No order found.</p>
                <a href="/services" className="mt-4 inline-block text-white/50 hover:text-white font-sans text-sm underline">
                  Browse Services
                </a>
              </div>
            )}
          </div>

          {/* Security Badges */}
          <div className="flex items-center gap-3 mb-6 text-white/30 font-sans text-xs">
            <Shield className="w-4 h-4" />
            <span>Secured by Razorpay · 256-bit SSL Encryption · PCI DSS Compliant</span>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-[8px] text-red-400 font-sans text-sm flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={loading || !cartData?.total}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-[10px] bg-white text-black font-sans font-semibold text-base hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
            ) : (
              <><CreditCard className="w-5 h-5" /> Pay with Razorpay</>
            )}
          </button>

          <p className="text-white/25 font-sans text-xs text-center mt-4">
            By proceeding, you agree to RevLabs' Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
