/* ============================================================
   Celestial Forecast - Daily Astrological Guidance
   A deterministic, daily-changing forecast generator
   ============================================================ */

// ---- Zodiac Data ----
const SIGNS = [
  { name: 'Aries',       symbol: '\u2648', icon: '\u2648\uFE0F', element: 'Fire',  modality: 'Cardinal', ruler: 'Mars',    dates: 'Mar 21 - Apr 19',  house: 1 },
  { name: 'Taurus',      symbol: '\u2649', icon: '\u2649\uFE0F', element: 'Earth', modality: 'Fixed',    ruler: 'Venus',   dates: 'Apr 20 - May 20',  house: 2 },
  { name: 'Gemini',      symbol: '\u264A', icon: '\u264A\uFE0F', element: 'Air',   modality: 'Mutable',  ruler: 'Mercury', dates: 'May 21 - Jun 20',  house: 3 },
  { name: 'Cancer',      symbol: '\u264B', icon: '\u264B\uFE0F', element: 'Water', modality: 'Cardinal', ruler: 'Moon',    dates: 'Jun 21 - Jul 22',  house: 4 },
  { name: 'Leo',         symbol: '\u264C', icon: '\u264C\uFE0F', element: 'Fire',  modality: 'Fixed',    ruler: 'Sun',     dates: 'Jul 23 - Aug 22',  house: 5 },
  { name: 'Virgo',       symbol: '\u264D', icon: '\u264D\uFE0F', element: 'Earth', modality: 'Mutable',  ruler: 'Mercury', dates: 'Aug 23 - Sep 22',  house: 6 },
  { name: 'Libra',       symbol: '\u264E', icon: '\u264E\uFE0F', element: 'Air',   modality: 'Cardinal', ruler: 'Venus',   dates: 'Sep 23 - Oct 22',  house: 7 },
  { name: 'Scorpio',     symbol: '\u264F', icon: '\u264F\uFE0F', element: 'Water', modality: 'Fixed',    ruler: 'Pluto',   dates: 'Oct 23 - Nov 21',  house: 8 },
  { name: 'Sagittarius', symbol: '\u2650', icon: '\u2650\uFE0F', element: 'Fire',  modality: 'Mutable',  ruler: 'Jupiter', dates: 'Nov 22 - Dec 21',  house: 9 },
  { name: 'Capricorn',   symbol: '\u2651', icon: '\u2651\uFE0F', element: 'Earth', modality: 'Cardinal', ruler: 'Saturn',  dates: 'Dec 22 - Jan 19',  house: 10 },
  { name: 'Aquarius',    symbol: '\u2652', icon: '\u2652\uFE0F', element: 'Air',   modality: 'Fixed',    ruler: 'Uranus',  dates: 'Jan 20 - Feb 18',  house: 11 },
  { name: 'Pisces',      symbol: '\u2653', icon: '\u2653\uFE0F', element: 'Water', modality: 'Mutable',  ruler: 'Neptune', dates: 'Feb 19 - Mar 20',  house: 12 },
];

const PLANETS = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'the Moon', 'the Sun'];
const ASPECTS = ['trine', 'sextile', 'conjunction', 'square', 'opposition', 'quincunx'];
const HOUSES = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

// ---- Deterministic Seeded RNG ----
function seedHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getFormattedDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// ---- Forecast Content Pools ----
const OVERALL_TEMPLATES = [
  (s, p1, a, p2, h) => `With ${p1} forming a ${a} to ${p2} in your ${h} house, today's energy favors introspection and quiet confidence. Trust the rhythm of the cosmos as it gently guides your ${s.element} nature toward new understanding.`,
  (s, p1, a, p2, h) => `The celestial dance between ${p1} and ${p2} creates a powerful ${a} that activates your ${h} house. As a ${s.modality.toLowerCase()} ${s.element.toLowerCase()} sign ruled by ${s.ruler}, you are uniquely positioned to harness this energy for transformation.`,
  (s, p1, a, p2, h) => `A luminous ${a} between ${p1} and ${p2} illuminates your ${h} house today, ${s.name}. The cosmic tides are shifting in your favor, and your innate ${s.element.toLowerCase()} energy will be the catalyst for meaningful progress.`,
  (s, p1, a, p2, h) => `${p1} whispers through your ${h} house in a delicate ${a} with ${p2}, urging you to embrace the full spectrum of your ${s.modality.toLowerCase()} nature. The universe conspires to align circumstances with your deepest aspirations.`,
  (s, p1, a, p2, h) => `Today the ${a} between ${p1} and ${p2} reverberates through your ${h} house with unmistakable intensity. Your ${s.element.toLowerCase()} essence is amplified, making this an extraordinary day for bold yet measured action.`,
  (s, p1, a, p2, h) => `As ${p1} casts a ${a} toward ${p2} across your ${h} house, the astral currents invite you to step into a more expansive version of yourself. ${s.ruler}'s influence lends clarity to every decision you face.`,
  (s, p1, a, p2, h) => `The heavens arrange a striking ${a} between ${p1} and ${p2} that lights up your ${h} house. Under ${s.ruler}'s watchful gaze, your ${s.element.toLowerCase()} spirit finds the momentum it has been seeking.`,
  (s, p1, a, p2, h) => `Cosmic geometry aligns ${p1} in a profound ${a} with ${p2}, sending ripples through your ${h} house. This transit amplifies the gifts of your ${s.modality.toLowerCase()} nature and calls forth your hidden reserves of wisdom.`,
];

const LOVE_TEMPLATES = [
  (s, p, h) => `${p} casts a warm glow across your ${h} house of partnerships, softening your ${s.element.toLowerCase()} edges and inviting deeper emotional connection. Open conversations initiated today carry the potential to reshape your closest bonds.`,
  (s, p, h) => `Romance takes on a transcendent quality as ${p} activates your ${h} house. Whether single or partnered, your ${s.name} magnetism is undeniable. Express vulnerability and watch how beautifully others respond.`,
  (s, p, h) => `The passage of ${p} through your ${h} house stirs a longing for authenticity in love. Your ${s.element.toLowerCase()} heart knows what it needs\u2014honor that inner compass and let it guide you toward connections that truly nourish.`,
  (s, p, h) => `With ${p} gracing your ${h} house, an unexpected tenderness infuses your interactions. As a ${s.modality.toLowerCase()} sign, you may resist surrender, but today the stars whisper: let love lead.`,
  (s, p, h) => `Emotional currents run deep as ${p} illuminates your ${h} house. Your ${s.element.toLowerCase()} nature craves both passion and stability\u2014today you may find a partner or friend who offers both in abundance.`,
  (s, p, h) => `The cosmic influence of ${p} in your ${h} house heightens your sensitivity to the unspoken language of love. Pay attention to gestures, glances, and silences\u2014they carry more meaning than words today.`,
];

const CAREER_TEMPLATES = [
  (s, p, h) => `${p} energizes your ${h} house of ambition, igniting the strategic side of your ${s.name} nature. Financial decisions made under this transit have staying power. Trust your instincts but verify the details.`,
  (s, p, h) => `Professional breakthroughs shimmer on the horizon as ${p} transits your ${h} house. Your ${s.element.toLowerCase()} determination becomes your greatest asset. A conversation with a mentor or authority figure could shift your trajectory.`,
  (s, p, h) => `The influence of ${p} in your ${h} house suggests that collaborative ventures outshine solo efforts today. Your ${s.modality.toLowerCase()} approach to challenges impresses those who hold the keys to advancement.`,
  (s, p, h) => `Financial currents flow more favorably as ${p} activates your ${h} house. Your ${s.element.toLowerCase()} practicality serves you well\u2014resist impulsive spending and instead channel resources toward long-term growth.`,
  (s, p, h) => `${p} in your ${h} house signals a day for planting seeds rather than harvesting. The groundwork you lay today, guided by your innate ${s.name} tenacity, will yield impressive returns in the coming weeks.`,
  (s, p, h) => `A creative solution to a persistent challenge emerges as ${p} lights up your ${h} house. Your ${s.ruler}-given talent for seeing beyond the obvious gives you an edge that colleagues will notice and admire.`,
];

const HEALTH_TEMPLATES = [
  (s, p, h) => `${p} in your ${h} house draws your attention to the mind-body connection. As a ${s.element.toLowerCase()} sign, you benefit from activities that ground and center you\u2014consider meditation, yoga, or a contemplative walk in nature.`,
  (s, p, h) => `Your vitality receives a cosmic boost as ${p} transits your ${h} house. Channel your ${s.element.toLowerCase()} energy into movement that feels joyful rather than obligatory. Hydration and restorative sleep are your allies tonight.`,
  (s, p, h) => `The transit of ${p} through your ${h} house highlights the importance of rest and renewal. Your ${s.modality.toLowerCase()} nature may push you to keep going, but wisdom lies in knowing when to pause and recharge.`,
  (s, p, h) => `With ${p} activating your ${h} house, pay extra attention to your emotional well-being. Your ${s.element.toLowerCase()} temperament absorbs the energies around you\u2014create boundaries that protect your inner peace.`,
  (s, p, h) => `Cosmic rhythms align with your body's natural cycles as ${p} moves through your ${h} house. This is an excellent day to establish a new wellness routine or return to a practice that once brought you vitality.`,
  (s, p, h) => `${p} in your ${h} house reminds you that true wellness encompasses spirit as well as body. Nourish your ${s.element.toLowerCase()} soul with beauty, laughter, and the company of those who lift your energy.`,
];

const COMPAT_EMOTIONAL = [
  (s1, s2, el) => `The ${s1.element.toLowerCase()}-${s2.element.toLowerCase()} interplay creates ${el === 'harmonious' ? 'a naturally warm emotional resonance' : 'a dynamic tension that deepens understanding'}. Today, ${s1.name} brings steadfast devotion while ${s2.name} contributes intuitive sensitivity.`,
  (s1, s2, el) => `Emotional wavelengths ${el === 'harmonious' ? 'synchronize beautifully' : 'challenge each other productively'} between ${s1.name} and ${s2.name}. The key lies in honoring what each sign needs: ${s1.element === 'Fire' || s1.element === 'Air' ? 'space to express' : 'time to process'} and ${s2.element === 'Fire' || s2.element === 'Air' ? 'freedom to explore' : 'security to trust'}.`,
  (s1, s2, el) => `Under today's stars, ${s1.name}'s ${s1.modality.toLowerCase()} nature ${el === 'harmonious' ? 'complements' : 'contrasts with'} ${s2.name}'s ${s2.modality.toLowerCase()} approach to emotions. This ${el === 'harmonious' ? 'harmony' : 'creative friction'} can forge an unbreakable bond if both remain open.`,
];

const COMPAT_COMMUNICATION = [
  (s1, s2) => `${s1.name}'s ${s1.ruler}-influenced communication style meets ${s2.name}'s ${s2.ruler}-driven perspective. Today, choosing curiosity over assumption transforms every exchange into an opportunity for deeper connection.`,
  (s1, s2) => `Words carry extra weight today between ${s1.name} and ${s2.name}. The ${s1.element.toLowerCase()} mind and the ${s2.element.toLowerCase()} heart can find common ground through patient listening and gentle honesty.`,
  (s1, s2) => `The intellectual dance between ${s1.name} and ${s2.name} sparkles with potential today. Share ideas freely\u2014${s1.ruler}'s analytical gifts combined with ${s2.ruler}'s creative vision produce something neither could achieve alone.`,
];

const COMPAT_ADVENTURES = [
  (s1, s2) => `The cosmic weather favors shared experiences for ${s1.name} and ${s2.name}. Whether it's exploring a new place or diving into a creative project, the synergy between your signs makes everything more vivid and memorable.`,
  (s1, s2) => `Adventure calls to both ${s1.name} and ${s2.name} today, though you may define it differently. Find the overlap\u2014perhaps a culinary exploration, a spontaneous outing, or an evening of deep conversation under the stars.`,
  (s1, s2) => `When ${s1.element.toLowerCase()} meets ${s2.element.toLowerCase()} in the pursuit of joy, the results are enchanting. Today's planetary alignments encourage you both to step outside your comfort zones and discover something new together.`,
];

const COMPAT_ADVICE = [
  (s1, s2) => `Today's celestial counsel for ${s1.name} and ${s2.name}: lead with appreciation. Acknowledge the unique gifts each of you brings. ${s1.name}'s strength in ${s1.element === 'Fire' ? 'inspiration' : s1.element === 'Earth' ? 'grounding' : s1.element === 'Air' ? 'perspective' : 'intuition'} pairs beautifully with ${s2.name}'s gift of ${s2.element === 'Fire' ? 'courage' : s2.element === 'Earth' ? 'stability' : s2.element === 'Air' ? 'clarity' : 'empathy'}.`,
  (s1, s2) => `The stars advise ${s1.name} and ${s2.name} to create a shared ritual today\u2014even something small, like a morning coffee together or an evening check-in. Rituals strengthen the invisible threads that bind your cosmic energies.`,
  (s1, s2) => `For ${s1.name} and ${s2.name}, today's guidance is simple: be present. Put away distractions and offer each other the gift of undivided attention. The ${s1.ruler}-${s2.ruler} connection thrives on authentic, unhurried moments.`,
];

// ---- Element Compatibility ----
function elementCompat(el1, el2) {
  const harmonious = {
    Fire: ['Fire', 'Air'], Earth: ['Earth', 'Water'],
    Air: ['Air', 'Fire'], Water: ['Water', 'Earth'],
  };
  return harmonious[el1]?.includes(el2) ? 'harmonious' : 'challenging';
}

// ---- Generate Forecast ----
function generateForecast(signName, dateStr) {
  const sign = SIGNS.find(s => s.name === signName);
  if (!sign) return null;
  const seed = seedHash(dateStr + signName);
  const rng = seededRandom(seed);

  // Pick astrological details
  const p1 = pick(PLANETS, rng);
  let p2 = pick(PLANETS, rng);
  while (p2 === p1) p2 = pick(PLANETS, rng);
  const aspect = pick(ASPECTS, rng);
  const house = pick(HOUSES, rng);
  const loveP = pick(PLANETS, rng);
  const loveH = pick(HOUSES, rng);
  const careerP = pick(PLANETS, rng);
  const careerH = pick(HOUSES, rng);
  const healthP = pick(PLANETS, rng);
  const healthH = pick(HOUSES, rng);

  // Energy score 55-98
  const energy = Math.floor(rng() * 44) + 55;

  // Lucky numbers (5 unique, 1-49)
  const lucky = [];
  while (lucky.length < 5) {
    const n = Math.floor(rng() * 49) + 1;
    if (!lucky.includes(n)) lucky.push(n);
  }
  lucky.sort((a, b) => a - b);

  return {
    sign,
    energy,
    overall: pick(OVERALL_TEMPLATES, rng)(sign, p1, aspect, p2, house),
    love: pick(LOVE_TEMPLATES, rng)(sign, loveP, loveH),
    career: pick(CAREER_TEMPLATES, rng)(sign, careerP, careerH),
    health: pick(HEALTH_TEMPLATES, rng)(sign, healthP, healthH),
    lucky,
  };
}

// ---- Generate Compatibility ----
function generateCompatibility(sign1Name, sign2Name, dateStr) {
  const s1 = SIGNS.find(s => s.name === sign1Name);
  const s2 = SIGNS.find(s => s.name === sign2Name);
  if (!s1 || !s2) return null;
  const seed = seedHash(dateStr + sign1Name + sign2Name + 'compat');
  const rng = seededRandom(seed);

  const elCompat = elementCompat(s1.element, s2.element);
  const baseScore = elCompat === 'harmonious' ? 68 : 52;
  const score = Math.min(99, Math.max(45, baseScore + Math.floor(rng() * 28) - 8));

  return {
    score,
    emotional: pick(COMPAT_EMOTIONAL, rng)(s1, s2, elCompat),
    communication: pick(COMPAT_COMMUNICATION, rng)(s1, s2),
    adventures: pick(COMPAT_ADVENTURES, rng)(s1, s2),
    advice: pick(COMPAT_ADVICE, rng)(s1, s2),
  };
}

// ---- Stars Canvas ----
function initStars() {
  const canvas = document.getElementById('stars-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, stars = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function createStars() {
    stars = [];
    const count = Math.floor((w * h) / 2800);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.6 + 0.3,
        alpha: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }
  }

  function draw(time) {
    ctx.clearRect(0, 0, w, h);

    // Subtle nebula gradient
    const grad = ctx.createRadialGradient(w * 0.3, h * 0.4, 0, w * 0.3, h * 0.4, w * 0.6);
    grad.addColorStop(0, 'rgba(90, 50, 160, 0.03)');
    grad.addColorStop(0.5, 'rgba(40, 30, 100, 0.02)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const grad2 = ctx.createRadialGradient(w * 0.75, h * 0.2, 0, w * 0.75, h * 0.2, w * 0.4);
    grad2.addColorStop(0, 'rgba(60, 80, 180, 0.025)');
    grad2.addColorStop(1, 'transparent');
    ctx.fillStyle = grad2;
    ctx.fillRect(0, 0, w, h);

    for (const star of stars) {
      const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.35 + 0.65;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(230, 225, 255, ${star.alpha * twinkle})`;
      ctx.fill();

      // Glow for bigger stars
      if (star.r > 1.0) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 190, 255, ${star.alpha * twinkle * 0.08})`;
        ctx.fill();
      }
    }
    requestAnimationFrame(draw);
  }

  resize();
  createStars();
  requestAnimationFrame(draw);

  window.addEventListener('resize', () => { resize(); createStars(); });
}

// ---- DOM Rendering ----
function buildSignGrid(containerId, personKey) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  const saved = localStorage.getItem(`astro_${personKey}`);
  SIGNS.forEach(sign => {
    const btn = document.createElement('button');
    btn.className = 'sign-btn' + (saved === sign.name ? ' selected' : '');
    btn.innerHTML = `<span class="sign-icon">${sign.symbol}</span>${sign.name}`;
    btn.addEventListener('click', () => {
      container.querySelectorAll('.sign-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      localStorage.setItem(`astro_${personKey}`, sign.name);
      checkConfirmBtn();
    });
    container.appendChild(btn);
  });
}

function checkConfirmBtn() {
  const btn = document.getElementById('btn-confirm');
  if (!btn) return;
  btn.disabled = !(localStorage.getItem('astro_me') && localStorage.getItem('astro_oryne'));
}

function renderForecastCard(prefix, forecast) {
  const symbolEl = document.getElementById(`symbol-${prefix}`);
  const signEl = document.getElementById(`sign-${prefix}`);
  const datesEl = document.getElementById(`dates-${prefix}`);
  const bodyEl = document.getElementById(`body-${prefix}`);
  if (!symbolEl || !signEl || !bodyEl) return;

  symbolEl.textContent = forecast.sign.symbol;
  signEl.textContent = forecast.sign.name;
  if (datesEl) datesEl.textContent = forecast.sign.dates;

  bodyEl.innerHTML = `
    <div class="forecast-section">
      <h3><span class="sec-icon">\u2728</span> Overall Energy</h3>
      <div class="energy-meter-wrap">
        <div class="energy-track"><div class="energy-fill" style="width:${forecast.energy}%"></div></div>
        <span class="energy-label">${forecast.energy}%</span>
      </div>
      <p>${forecast.overall}</p>
    </div>
    <div class="forecast-section">
      <h3><span class="sec-icon">\u2764\uFE0F</span> Love & Relationships</h3>
      <p>${forecast.love}</p>
    </div>
    <div class="forecast-section">
      <h3><span class="sec-icon">\uD83D\uDCB0</span> Career & Finance</h3>
      <p>${forecast.career}</p>
    </div>
    <div class="forecast-section">
      <h3><span class="sec-icon">\uD83C\uDF3F</span> Health & Wellness</h3>
      <p>${forecast.health}</p>
    </div>
    <div class="forecast-section">
      <h3><span class="sec-icon">\uD83D\uDD2E</span> Lucky Numbers</h3>
      <div class="lucky-row">${forecast.lucky.map(n => `<span class="lucky-num">${n}</span>`).join('')}</div>
    </div>
  `;
}

function renderCompatibility(sign1, sign2, dateStr) {
  const compat = generateCompatibility(sign1, sign2, dateStr);
  if (!compat) return;

  const s1 = SIGNS.find(s => s.name === sign1);
  const s2 = SIGNS.find(s => s.name === sign2);

  document.getElementById('compat-signs').innerHTML = `${s1.symbol} <span style="color:var(--rose)">\u2661</span> ${s2.symbol}`;
  document.getElementById('compat-meter').style.width = compat.score + '%';
  document.getElementById('compat-pct').textContent = compat.score + '% Aligned';
  document.getElementById('compat-emotional').textContent = compat.emotional;
  document.getElementById('compat-communication').textContent = compat.communication;
  document.getElementById('compat-adventures').textContent = compat.adventures;
  document.getElementById('compat-advice').textContent = compat.advice;
}

function showApp() {
  const dateStr = getTodayString();
  const meSign = localStorage.getItem('astro_me');
  const oryneSign = localStorage.getItem('astro_oryne');
  if (!meSign || !oryneSign) { showModal(); return; }

  document.getElementById('setup-modal').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('date-line').textContent = getFormattedDate();

  renderForecastCard('me', generateForecast(meSign, dateStr));
  renderForecastCard('oryne', generateForecast(oryneSign, dateStr));
  renderCompatibility(meSign, oryneSign, dateStr);
}

function showModal() {
  document.getElementById('app').classList.add('hidden');
  document.getElementById('setup-modal').classList.remove('hidden');
  buildSignGrid('grid-me', 'me');
  buildSignGrid('grid-oryne', 'oryne');
  checkConfirmBtn();
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  initStars();

  // Confirm button
  document.getElementById('btn-confirm')?.addEventListener('click', () => {
    if (localStorage.getItem('astro_me') && localStorage.getItem('astro_oryne')) {
      showApp();
    }
  });

  // Change signs button
  document.getElementById('btn-change')?.addEventListener('click', showModal);

  // Decide what to show
  if (localStorage.getItem('astro_me') && localStorage.getItem('astro_oryne')) {
    showApp();
  } else {
    showModal();
  }
});
