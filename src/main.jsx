// File: src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';

// ── Scroll-reveal observer ──────────────────────────────────────────
// Watches any element with class "reveal", "reveal-left", "reveal-right",
// or "stagger-children" and adds "revealed" when it enters the viewport.
const observerOptions = {
  threshold: 0.12,
  rootMargin: '0px 0px -40px 0px',
};

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target); // fire once
    }
  });
}, observerOptions);

// Re-observe whenever DOM changes (handles lazy-loaded pages)
const mutationObserver = new MutationObserver(() => {
  document
    .querySelectorAll(
      '.reveal:not(.revealed), .reveal-left:not(.revealed), .reveal-right:not(.revealed), .stagger-children:not(.revealed)'
    )
    .forEach((el) => revealObserver.observe(el));
});

mutationObserver.observe(document.body, { childList: true, subtree: true });

// Initial scan (catches elements already in DOM on first load)
requestAnimationFrame(() => {
  document
    .querySelectorAll(
      '.reveal, .reveal-left, .reveal-right, .stagger-children'
    )
    .forEach((el) => revealObserver.observe(el));
});

// ── Mount ────────────────────────────────────────────────────────────
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);