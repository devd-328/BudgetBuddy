import re

with open('e:/BudgetBuddy/landing/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

match = re.search(r'<body[^>]*>(.*?)<script', html, re.DOTALL | re.IGNORECASE)
content = match.group(1)

content = content.replace('class=', 'className=')

def style_replacer(match):
    style_str = match.group(1)
    rules = style_str.split(';')
    new_rules = []
    for rule in rules:
        if ':' not in rule: continue
        key, val = rule.split(':', 1)
        key = key.strip()
        val = val.strip()
        parts = key.split('-')
        key = parts[0] + ''.join(x.title() for x in parts[1:])
        new_rules.append(f"{key}: '{val}'")
    return "style={{" + ", ".join(new_rules) + "}}"

content = re.sub(r'style="([^"]+)"', style_replacer, content)
content = re.sub(r'<!--(.*?)-->', r'{/*\1*/}', content, flags=re.DOTALL)
content = re.sub(r'<input([^>]*?(?<!/))>', r'<input\1 />', content)
content = content.replace('<br>', '<br />')
content = content.replace('stroke-linecap=', 'strokeLinecap=')
content = content.replace('stroke-linejoin=', 'strokeLinejoin=')
content = content.replace('stroke-width=', 'strokeWidth=')
content = content.replace('fill-rule=', 'fillRule=')
content = content.replace('clip-rule=', 'clipRule=')
content = content.replace('viewbox=', 'viewBox=')
content = content.replace('novalidate', 'noValidate')
content = content.replace('autocomplete=', 'autoComplete=')

component = """import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  const [emails, setEmails] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bb_emails') || '[]'); } 
    catch { return []; }
  });
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    const navbar = document.getElementById('navbar');
    const handleScroll = () => {
      navbar?.classList.toggle('scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      revealObserver.disconnect();
    };
  }, []);

  const handleMobileMenuToggle = (open) => {
    const mobileMenu = document.getElementById('mobile-menu');
    const hamburger = document.getElementById('hamburger');
    if (open) {
      mobileMenu?.classList.add('open');
      document.body.style.overflow = 'hidden';
      hamburger?.setAttribute('aria-expanded', 'true');
    } else {
      mobileMenu?.classList.remove('open');
      document.body.style.overflow = '';
      hamburger?.setAttribute('aria-expanded', 'false');
    }
  };

  const handleScrollTo = (e, targetId) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (targetId === 'cta') {
        setTimeout(() => {
          document.getElementById('cta-email')?.focus();
        }, 600);
      }
    }
    handleMobileMenuToggle(false);
  };

  const handleFaqToggle = (e) => {
    const btn = e.currentTarget;
    const item = btn.parentElement;
    const answer = item.querySelector('.faq-answer');
    const chevron = item.querySelector('.faq-chevron');
    
    const isOpen = answer.classList.contains('open');

    document.querySelectorAll('.faq-answer').forEach(a => a.classList.remove('open'));
    document.querySelectorAll('.faq-chevron').forEach(c => c.classList.remove('open'));
    document.querySelectorAll('.faq-btn').forEach(b => b.setAttribute('aria-expanded', 'false'));

    if (!isOpen) {
      answer.classList.add('open');
      chevron?.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('cta-email');
    const emailError = document.getElementById('email-error');
    const val = emailInput.value.trim();
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;

    if (!emailRegex.test(val)) {
      emailError.textContent = 'Please enter a valid email address.';
      emailError.style.display = 'block';
      emailInput.focus();
      return;
    }

    emailError.style.display = 'none';
    const newEmails = [...emails];
    if (!newEmails.includes(val)) {
      newEmails.push(val);
      localStorage.setItem('bb_emails', JSON.stringify(newEmails));
      setEmails(newEmails);
    }

    emailInput.value = '';
    setToastMsg('🎉 Check your inbox! You\\'re on the list.');
    setTimeout(() => setToastMsg(''), 4000);
  };

  return (
    <div className="font-inter antialiased landing-page">
      <a href="#main" className="skip-link" onClick={(e) => handleScrollTo(e, 'main')}>Skip to main content</a>
      
      <div id="toast" role="alert" aria-live="polite" className={toastMsg ? 'show' : ''}>
        {toastMsg}
      </div>

      ###CONTENT###
    </div>
  );
}
"""

component = component.replace('###CONTENT###', content)
# Ensure Link components correctly replace anchor tags for local paths
component = component.replace('href="/login"', 'to="/login"')
component = component.replace('href="/signup"', 'to="/signup"')
# Replace relative <a> with Link to
component = re.sub(r'<a(.*?)to="(/[^"]+)"(.*?)>', r'<Link\1to="\2"\3>', component)
component = component.replace('</a>', '</a>').replace('</Link>', '</Link>')
component = re.sub(r'(<a[^>]*to="/[^"]+"[^>]*>.*?)</a([^>]*>)', r'\1</Link\2', component)

with open('e:/BudgetBuddy/src/pages/Landing.jsx', 'w', encoding='utf-8') as out:
    out.write(component)
