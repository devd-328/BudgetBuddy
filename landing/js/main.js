// ================================================================
// BudgetBuddy Landing Page — main.js
// ================================================================

document.addEventListener('DOMContentLoaded', () => {

  // ────────────────────────────────────────────
  // 1. NAVBAR SCROLL EFFECT
  // ────────────────────────────────────────────
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });

  // ────────────────────────────────────────────
  // 2. MOBILE HAMBURGER MENU
  // ────────────────────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const closeMenu = document.getElementById('close-menu');

  hamburger?.addEventListener('click', () => {
    mobileMenu.classList.add('open');
    document.body.style.overflow = 'hidden';
    hamburger.setAttribute('aria-expanded', 'true');
  });

  closeMenu?.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
    hamburger.setAttribute('aria-expanded', 'false');
  });

  // Close on mobile nav link click
  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // ────────────────────────────────────────────
  // 3. SMOOTH SCROLL + HERO CTA FOCUS
  // ────────────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Auto-focus CTA email input when scrolling to #cta
        if (anchor.getAttribute('href') === '#cta') {
          setTimeout(() => {
            document.getElementById('cta-email')?.focus();
          }, 600);
        }
      }
    });
  });

  // Hero primary CTA — scroll to email input
  document.getElementById('hero-cta-primary')?.addEventListener('click', () => {
    document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      document.getElementById('cta-email')?.focus();
    }, 650);
  });

  // "See how it works" scroll
  document.getElementById('hero-cta-secondary')?.addEventListener('click', () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  });

  // ────────────────────────────────────────────
  // 4. FAQ ACCORDION
  // ────────────────────────────────────────────
  document.querySelectorAll('.faq-item').forEach(item => {
    const btn = item.querySelector('.faq-btn');
    const answer = item.querySelector('.faq-answer');
    const chevron = item.querySelector('.faq-chevron');

    btn?.addEventListener('click', () => {
      const isOpen = answer.classList.contains('open');

      // Close all
      document.querySelectorAll('.faq-answer').forEach(a => a.classList.remove('open'));
      document.querySelectorAll('.faq-chevron').forEach(c => c.classList.remove('open'));
      document.querySelectorAll('.faq-btn').forEach(b => b.setAttribute('aria-expanded', 'false'));

      // Toggle current
      if (!isOpen) {
        answer.classList.add('open');
        chevron?.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // ────────────────────────────────────────────
  // 5. EMAIL FORM VALIDATION & SUBMISSION
  // ────────────────────────────────────────────
  const emailForm = document.getElementById('cta-form');
  const emailInput = document.getElementById('cta-email');
  const emailError = document.getElementById('email-error');
  const toast = document.getElementById('toast');

  emailForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(val)) {
      emailError.textContent = 'Please enter a valid email address.';
      emailError.style.display = 'block';
      emailInput.focus();
      return;
    }

    emailError.style.display = 'none';

    // Store in localStorage
    const emails = JSON.parse(localStorage.getItem('bb_emails') || '[]');
    if (!emails.includes(val)) {
      emails.push(val);
      localStorage.setItem('bb_emails', JSON.stringify(emails));
    }

    // Show success
    emailInput.value = '';
    showToast('🎉 Check your inbox! You\'re on the list.');
  });

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
  }

  // ────────────────────────────────────────────
  // 6. SCROLL-TRIGGERED REVEAL ANIMATIONS
  // ────────────────────────────────────────────
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

});
