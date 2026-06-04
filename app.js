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
    syncSubmitBtn();
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

// === AVAILABILITY CALENDAR ===
var availabilityData = null;
var calSelectedStart = null;
var calSelectedEnd = null;
var calMobileMonthIdx = 0;
var calHasConflict = false;

function calPad2(n) { return n < 10 ? '0' + n : '' + n; }
function calDateStr(d) { return d.getFullYear() + '-' + calPad2(d.getMonth() + 1) + '-' + calPad2(d.getDate()); }
function calParseDate(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }

function calTrailerKey(val) {
  if (val === '7×18 Utility Trailer') return 'utility';
  if (val === '7×18 Car Hauler') return 'hauler';
  return null;
}

function calIsBooked(dateObj, key) {
  if (!availabilityData || availabilityData === 'failed' || !key) return false;
  var ranges = availabilityData[key] || [];
  var s = calDateStr(dateObj);
  for (var i = 0; i < ranges.length; i++) {
    if (s >= ranges[i].start && s <= ranges[i].end) return true;
  }
  return false;
}

function syncSubmitBtn() {
  var btn = document.querySelector('#bookingForm [type="submit"]');
  if (btn) btn.disabled = calHasConflict;
}

function updateCalStatus() {
  var el = document.getElementById('calendarStatus');
  if (!el) return;
  if (availabilityData === 'failed' || !calSelectedStart || !calSelectedEnd) {
    el.innerHTML = '';
    calHasConflict = false;
    syncSubmitBtn();
    return;
  }
  var key = calTrailerKey(document.getElementById('trailerSelect').value);
  var selS = calSelectedStart <= calSelectedEnd ? calSelectedStart : calSelectedEnd;
  var selE = calSelectedStart <= calSelectedEnd ? calSelectedEnd : calSelectedStart;
  calHasConflict = false;
  if (key) {
    var iter = new Date(selS);
    while (iter <= selE) {
      if (calIsBooked(iter, key)) { calHasConflict = true; break; }
      iter.setDate(iter.getDate() + 1);
    }
  }
  el.innerHTML = calHasConflict
    ? '<div class="cal-warning">These dates include unavailable days — please choose a different range</div>'
    : '<div class="cal-available">✓ Dates available</div>';
  syncSubmitBtn();
}

function calRenderMonth(year, month, key) {
  var DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  var MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var now = new Date();
  var todayStr = calDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  var todayMid = calParseDate(todayStr);
  var firstDow = new Date(year, month, 1).getDay();
  var lastDate = new Date(year, month + 1, 0).getDate();
  var selS = calSelectedStart, selE = calSelectedEnd;
  if (selS && selE && selS > selE) { var tmp = selS; selS = selE; selE = tmp; }

  var h = '<div class="cal-month"><div class="cal-month-header"><span class="cal-month-name">' + MON[month] + ' ' + year + '</span></div><div class="cal-grid">';
  DOW.forEach(function(dow) { h += '<div class="cal-dow">' + dow + '</div>'; });
  for (var i = 0; i < firstDow; i++) h += '<div class="cal-day empty"></div>';

  for (var day = 1; day <= lastDate; day++) {
    var dObj = new Date(year, month, day);
    var dStr = calDateStr(dObj);
    var past = dObj < todayMid;
    var booked = !past && calIsBooked(dObj, key);
    var inRange = false, isS = false, isE = false;
    if (selS && selE) {
      if (dObj >= selS && dObj <= selE) inRange = true;
      if (dStr === calDateStr(selS)) isS = true;
      if (dStr === calDateStr(selE)) isE = true;
    } else if (selS && dStr === calDateStr(selS)) { isS = true; }
    var cls = 'cal-day' + (past ? ' past' : booked ? ' booked' : ' selectable') +
      (dStr === todayStr ? ' today' : '') + (inRange ? ' in-range' : '') +
      (isS ? ' range-start' : '') + (isE ? ' range-end' : '');
    var attr = (!past && !booked) ? ' data-date="' + dStr + '"' : '';
    h += '<div class="' + cls + '"' + attr + '><span class="cal-day-num">' + day + '</span></div>';
  }
  h += '</div></div>';
  return h;
}

function renderCalendar() {
  var wrap = document.getElementById('availabilityCalendar');
  var mw = document.getElementById('calMonthsWrap');
  if (!wrap || !mw) return;
  var trailerVal = document.getElementById('trailerSelect').value;
  if (!trailerVal) {
    wrap.style.display = 'none';
    calHasConflict = false;
    syncSubmitBtn();
    return;
  }
  wrap.style.display = 'block';
  var key = calTrailerKey(trailerVal);
  var now = new Date();
  var m0 = { year: now.getFullYear(), month: now.getMonth() };
  var m1 = { year: now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear(), month: (now.getMonth() + 1) % 12 };
  if (availabilityData === 'failed') {
    mw.innerHTML = '<div class="cal-unavail-msg">Availability check unavailable — contact us to confirm dates</div>';
  } else {
    mw.innerHTML = calRenderMonth(m0.year, m0.month, key) + calRenderMonth(m1.year, m1.month, key);
  }
  mw.querySelectorAll('.cal-month').forEach(function(el, idx) { el.classList.toggle('active', idx === calMobileMonthIdx); });
  var MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var activeM = calMobileMonthIdx === 0 ? m0 : m1;
  var titleEl = document.getElementById('calMobileTitle');
  if (titleEl) titleEl.textContent = MON[activeM.month] + ' ' + activeM.year;
  var pb = document.getElementById('calPrevBtn'), nb = document.getElementById('calNextBtn');
  if (pb) pb.disabled = calMobileMonthIdx === 0;
  if (nb) nb.disabled = calMobileMonthIdx === 1;
  updateCalStatus();
}

function fetchAvailability() {
  fetch('https://irong-cc.westcal98.workers.dev/availability')
    .then(function(r) { return r.json(); })
    .then(function(data) { availabilityData = data; renderCalendar(); })
    .catch(function() { availabilityData = 'failed'; renderCalendar(); });
}

// Init calendar
fetchAvailability();
document.getElementById('trailerSelect').addEventListener('change', renderCalendar);
document.getElementById('calPrevBtn').addEventListener('click', function() { calMobileMonthIdx = 0; renderCalendar(); });
document.getElementById('calNextBtn').addEventListener('click', function() { calMobileMonthIdx = 1; renderCalendar(); });
document.getElementById('calMonthsWrap').addEventListener('click', function(e) {
  var dayEl = e.target.closest('.cal-day.selectable');
  if (!dayEl || !dayEl.dataset.date) return;
  var dObj = calParseDate(dayEl.dataset.date);
  if (!calSelectedStart || (calSelectedStart && calSelectedEnd)) {
    calSelectedStart = dObj;
    calSelectedEnd = null;
  } else {
    calSelectedEnd = dObj;
    if (calSelectedEnd < calSelectedStart) { var t = calSelectedStart; calSelectedStart = calSelectedEnd; calSelectedEnd = t; }
  }
  document.getElementById('startDate').value = calDateStr(calSelectedStart);
  document.getElementById('endDate').value = calSelectedEnd ? calDateStr(calSelectedEnd) : '';
  renderCalendar();
});
document.getElementById('startDate').addEventListener('change', function() {
  calSelectedStart = this.value ? calParseDate(this.value) : null;
  renderCalendar();
});
document.getElementById('endDate').addEventListener('change', function() {
  calSelectedEnd = this.value ? calParseDate(this.value) : null;
  renderCalendar();
});

// Service Worker registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
