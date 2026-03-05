/**
 * AnthrosAI — stripe.js
 * Payments: Stripe Checkout, PRO activation, AdSense
 */

'use strict';

const STRIPE_PK = 'pk_test_51T5oEmFBiq7G8hs0ITtU4Pu9CiVCebvQmJSn7XZrtVv9Gc3GX26yWBXUZMzjrMokwJY2d7ckynL4s5jFvDuRcNX900Ux3BIRw7';
let _stripe = null;
let _selectedPlan = 'annual';

function getStripe() {
  if (!_stripe && typeof Stripe !== 'undefined') {
    try { _stripe = Stripe(STRIPE_PK); } catch(e) {}
  }
  return _stripe;
}

function selectPlan(plan) {
  _selectedPlan = plan;
  document.querySelectorAll('.pw-plan-btn').forEach(b => {
    b.classList.toggle('sel', b.dataset.plan === plan);
  });
}

function openPaywall() {
  const m = document.getElementById('paywallModal');
  if (m) m.classList.add('open');
}

function closePaywall() {
  const m = document.getElementById('paywallModal');
  if (m) m.classList.remove('open');
}

async function startCheckout(plan) {
  _selectedPlan = plan || _selectedPlan;
  const btn = document.getElementById('checkoutBtn');
  if (btn) { btn.textContent = 'Opening secure payment...'; btn.disabled = true; }

  try {
    // POST to Vercel serverless function → Stripe Checkout Session
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: _selectedPlan === 'annual' ? 'yearly' : 'monthly' })
    });
    if (!res.ok) throw new Error('API error ' + res.status);
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    throw new Error('No URL returned');
  } catch(err) {
    console.error('Checkout error:', err);
    showToast('Payment gateway error — try again', 'err');
    if (btn) { btn.textContent = 'Get AnthrosAI PRO →'; btn.disabled = false; }
  }
}

function activatePro() {
  window.isPro = true;
  const badge = document.getElementById('planBadge');
  if (badge) { badge.textContent = 'PRO'; badge.className = 'plan-badge pro'; }
  const mpc = document.getElementById('membershipCard');
  if (mpc) mpc.innerHTML = '<div><div style="font-weight:800;font-size:1rem">AnthrosAI <span style="color:#FFB800">PRO</span> 👑</div><div style="font-size:.75rem;color:var(--muted2)">All features unlocked.</div></div>';
  const lb = document.getElementById('aiLimitBar');
  if (lb) lb.classList.remove('show');
  saveAppState();
  showToast('🎉 Welcome to AnthrosAI PRO!', 'ok');
}

// Called on page load to check Stripe return
function checkPaymentReturn() {
  const p = new URLSearchParams(window.location.search);
  if (p.get('payment') === 'success' || p.get('session_id')) {
    window.history.replaceState({}, '', window.location.pathname);
    setTimeout(() => {
      activatePro();
      showToast('💳 Payment confirmed! PRO unlocked 🎉', 'ok');
    }, 800);
  }
}

// ── ADSENSE BANNER ─────────────────────────────────────────
function injectAdSense(containerId) {
  const wrap = document.getElementById(containerId);
  if (!wrap || isPro) return; // No ads for PRO users
  wrap.innerHTML = `
    <div class="ads-wrapper">
      <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7252126084365082" crossorigin="anonymous"><\/script>
      <ins class="adsbygoogle"
           style="display:block"
           data-ad-client="ca-pub-7252126084365082"
           data-ad-slot="4518705482"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
      <script>(adsbygoogle = window.adsbygoogle || []).push({});<\/script>
    </div>`;
}


// ── Stripe window bindings ──
window.getStripe = getStripe;
window.openPaywall = openPaywall;
window.startCheckout = startCheckout;
window.closePaywall = closePaywall;
window.checkPaymentReturn = checkPaymentReturn;
window.injectAdSense = injectAdSense;
window.selectPlan = selectPlan;
window.activatePro = activatePro;
