// Pre-select trailer from Reserve Now button
document.querySelectorAll('.trailer-reserve-btn[data-trailer]').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var trailer = this.getAttribute('data-trailer');
    var sel = document.getElementById('trailerSelect');
    if (sel) {
      for (var i = 0; i < sel.options.length; i++) {
        if (sel.options[i].text === trailer) {
          sel.selectedIndex = i;
          break;
        }
      }
    }
  });
});

// Mobile menu — event listeners only, no inline onclick
document.getElementById('menuToggleBtn').addEventListener('click', function() {
  document.getElementById('mobileMenu').classList.toggle('open');
});

// Close menu when any link inside it is clicked
document.querySelectorAll('.mobile-menu .menu-link, .mobile-menu .mobile-cta').forEach(function(link) {
  link.addEventListener('click', function() {
    document.getElementById('mobileMenu').classList.remove('open');
  });
});

// Close menu when clicking outside
document.addEventListener('click', function(e) {
  var menu = document.getElementById('mobileMenu');
  var btn = document.getElementById('menuToggleBtn');
  if (menu.classList.contains('open') && !menu.contains(e.target) && !btn.contains(e.target)) {
    menu.classList.remove('open');
  }
});

// FAQ accordion
document.querySelectorAll('.faq-question').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var item = btn.parentElement;
    var wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(function(i) { i.classList.remove('open'); });
    if (!wasOpen) item.classList.add('open');
  });
});

// Booking form — POST to Iron G Command Center Worker
document.getElementById('bookingForm').addEventListener('submit', function(e) {
  e.preventDefault();
  var form = e.target;
  var submitBtn = form.querySelector('[type="submit"]');
  var originalText = submitBtn.textContent;

  if (submitBtn.disabled) return;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';

  var trailerVal = document.getElementById('trailerSelect').value;
  var contactPrefEl = form.querySelector('input[name="contactPref"]:checked');

  var payload = {
    type: trailerVal === 'Not sure — need advice' ? 'info' : 'rental',
    firstName: document.getElementById('firstName').value,
    phone: document.getElementById('phone').value,
    email: document.getElementById('email').value,
    city: document.getElementById('city').value,
    trailer: trailerVal,
    startDate: document.getElementById('startDate').value,
    startTime: document.getElementById('startTime').value,
    endDate: document.getElementById('endDate').value,
    endTime: document.getElementById('endTime').value,
    towVehicle: document.getElementById('towVehicle').value,
    hauling: document.getElementById('hauling').value,
    contactPref: contactPrefEl ? contactPrefEl.value : '',
    source: document.getElementById('source').value,
    notes: document.getElementById('notes').value,
    timestamp: new Date().toISOString()
  };

  fetch('https://irong-cc.westcal98.workers.dev/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(function(res) {
    if (res.ok) {
      document.getElementById('bookingForm').style.display = 'none';
      document.getElementById('formSuccess').style.display = 'block';
    } else {
      throw new Error('Server error');
    }
  })
  .catch(function() {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
    alert("Something went wrong. Please call or text us directly at (405) 393-4161 and we'll get you sorted.");
  });
});

// Scroll animations
var observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });
document.querySelectorAll('.fade-up').forEach(function(el) {
  el.classList.add('animate');
  observer.observe(el);
});

// Nav border highlight on scroll
window.addEventListener('scroll', function() {
  var nav = document.getElementById('mainNav');
  if (nav) nav.style.borderBottomColor = window.scrollY > 50 ? 'var(--steel)' : 'var(--border)';
});

// Set min date on start/end date inputs
var today = new Date().toISOString().split('T')[0];
var dateInput = document.getElementById('startDate');
if (dateInput) dateInput.setAttribute('min', today);
var endDateInput = document.getElementById('endDate');
if (endDateInput) endDateInput.setAttribute('min', today);

// Sync end time to start time when start time changes
var startTimeInput = document.getElementById('startTime');
var endTimeInput = document.getElementById('endTime');
if (startTimeInput && endTimeInput) {
  startTimeInput.addEventListener('change', function() {
    if (!endTimeInput.value) endTimeInput.value = startTimeInput.value;
  });
}

// Service Worker registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
