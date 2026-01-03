const sky = document.getElementById("sky");
const starsLayer = document.getElementById("starsLayer");
const linesSvg = document.getElementById("linesSvg");
const starsCanvas = document.getElementById("starsCanvas");
const heartsCanvas = document.getElementById("heartsCanvas");

const modal = document.getElementById("modal");
const closeBtn = document.getElementById("closeBtn");
const mTitle = document.getElementById("mTitle");
const mDate = document.getElementById("mDate");
const mText = document.getElementById("mText");
const mPhoto = document.getElementById("mPhoto");
const finalActions = document.getElementById("finalActions");
const heartBtn = document.getElementById("heartBtn");

let DATA = null;
let starEls = new Map(); // id -> element

function formatDate(iso) {
  if (!iso) return "";
  // простий формат YYYY-MM-DD -> DD.MM.YYYY
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${m[3]}.${m[2]}.${m[1]}`;
}

function openModal(star) {
  mTitle.textContent = star.label || "Зірка";
  mDate.textContent = star.date ? `📅 ${formatUA(star.date)}` : "";
  mText.textContent = star.text || "";

  if (star.photo) {
    mPhoto.src = star.photo;
    mPhoto.classList.remove("hidden");
  } else {
    mPhoto.classList.add("hidden");
    mPhoto.removeAttribute("src");
  }

  if (star.id === "final") {
    finalActions.classList.remove("hidden");
  } else {
    finalActions.classList.add("hidden");
  }

  modal.classList.remove("hidden");
}

function closeModal() {
  modal.classList.add("hidden");
}

closeBtn.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

function resizeCanvases() {
  const rect = sky.getBoundingClientRect();
  starsCanvas.width = Math.floor(rect.width * devicePixelRatio);
  starsCanvas.height = Math.floor(rect.height * devicePixelRatio);
  starsCanvas.style.width = rect.width + "px";
  starsCanvas.style.height = rect.height + "px";

  linesSvg.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);
  linesSvg.setAttribute("width", rect.width);
  linesSvg.setAttribute("height", rect.height);

  // hearts overlay
  heartsCanvas.width = Math.floor(window.innerWidth * devicePixelRatio);
  heartsCanvas.height = Math.floor(window.innerHeight * devicePixelRatio);
  heartsCanvas.style.width = window.innerWidth + "px";
  heartsCanvas.style.height = window.innerHeight + "px";
}

// ====== Falling comets starfield (background animation) ======
let STATIC_STARS = [];
let COMETS = [];
let lastTs = 0;

// налаштування (можеш крутити)
const STAR_DENSITY = 1 / 4200;      // чим менше число — тим більше зірок
const COMET_SPAWN_RATE = 0.8;      // комет в секунду (0.2..0.8 норм)
const COMET_MIN_SPEED = 260;        // px/sec
const COMET_MAX_SPEED = 520;        // px/sec
const COMET_MIN_LEN = 120;          // px
const COMET_MAX_LEN = 260;          // px

function buildStaticStars() {
    const rect = sky.getBoundingClientRect();
    const count = Math.floor(rect.width * rect.height * STAR_DENSITY);
  
    STATIC_STARS = [];
    for (let i = 0; i < count; i++) {
      const r = Math.random() * 1.35 + 0.25; // 0.25..1.6
      const isBig = r > 1.1;
  
      STATIC_STARS.push({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        r,
  
        // базова яскравість
        baseA: (isBig ? 0.55 : 0.35) + Math.random() * (isBig ? 0.25 : 0.18),
  
        // магічне “дихання” (пульсація)
        amp: (isBig ? 0.35 : 0.25) + Math.random() * 0.35, // досить сильно
        tw: Math.random() * 2 * Math.PI,
        tws: 0.7 + Math.random() * 2.2,
  
        // “іскра” — короткі підсилення (інколи)
        spark: Math.random() * 1.0,         // 0..1, прогрес спалаху
        sparkDelay: 0.8 + Math.random() * 2.8, // через скільки сек може спалахнути
        sparkTimer: Math.random() * 2.5,    // щоб не всі одночасно
  
        // легкий відтінок для магії (білий / рожевий)
        tint: Math.random() < 0.22 ? "pink" : "white"
      });
    }
  }

  function spawnComet() {
    const rect = sky.getBoundingClientRect();
    const margin = 80; // щоб стартували трохи “за кадром”
  
    // 0=top, 1=right, 2=bottom, 3=left
    const side = Math.floor(Math.random() * 4);
  
    let x, y;
    if (side === 0) { // top
      x = Math.random() * rect.width;
      y = -margin;
    } else if (side === 1) { // right
      x = rect.width + margin;
      y = Math.random() * rect.height;
    } else if (side === 2) { // bottom
      x = Math.random() * rect.width;
      y = rect.height + margin;
    } else { // left
      x = -margin;
      y = Math.random() * rect.height;
    }
  
    // ціль — випадкова точка всередині (щоб напрям був повністю різний)
    const tx = Math.random() * rect.width;
    const ty = Math.random() * rect.height;
  
    const speed = COMET_MIN_SPEED + Math.random() * (COMET_MAX_SPEED - COMET_MIN_SPEED);
  
    // напрям на ціль + невеликий “jitter” (розкид)
    const baseAngle = Math.atan2(ty - y, tx - x);
    const jitter = (Math.random() - 0.5) * 0.5; // ~±0.25 рад ≈ ±14°
    const angle = baseAngle + jitter;
  
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
  
    COMETS.push({
      x, y, vx, vy,
      len: COMET_MIN_LEN + Math.random() * (COMET_MAX_LEN - COMET_MIN_LEN),
      life: 0,
      maxLife: 1.0 + Math.random() * 0.9,
      width: 1.2 + Math.random() * 1.8
    });
  }
  

function drawStarfieldFrame(dt) {
  const rect = sky.getBoundingClientRect();
  const ctx = starsCanvas.getContext("2d");

  // важливо: малюємо в CSS-пікселях, але з devicePixelRatio
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

  // очистка
  ctx.clearRect(0, 0, rect.width, rect.height);

  // зірки (легке мерехтіння)
  for (const s of STATIC_STARS) {
    s.tw += dt * s.tws;
  
    // “дихання” зірки
    const breathe = 1 + s.amp * Math.sin(s.tw);
  
    // механіка іскри: раз на певний час короткий спалах
    s.sparkTimer += dt;
    if (s.sparkTimer >= s.sparkDelay) {
      // шанс спалаху (не кожного разу)
      if (Math.random() < 0.55) s.spark = 1.0;
      s.sparkTimer = 0;
      s.sparkDelay = 0.9 + Math.random() * 3.2;
    }
  
    // затухання іскри
    if (s.spark > 0) s.spark = Math.max(0, s.spark - dt * 2.8);
  
    // “форма” іскри (швидкий підйом/плавне падіння)
    const sparkShape = s.spark > 0 ? (1 - Math.pow(1 - s.spark, 3)) : 0; // 0..1
    const sparkleBoost = 1 + 0.55 * sparkShape;
  
    // підсумкова альфа
    const a = Math.max(0, Math.min(1, s.baseA * breathe * sparkleBoost));
  
    // колір: більшість білі, частина — з рожевим відтінком
    const core = (s.tint === "pink") ? "rgba(255,190,225,1)" : "rgba(255,255,255,1)";
    const glow = (s.tint === "pink") ? "rgba(255,105,180,1)" : "rgba(255,255,255,1)";
  
    // 1) glow-ореол
    const glowSize = s.r * (2.6 + 1.2 * sparkShape);
    ctx.globalAlpha = a * (0.22 + 0.35 * sparkShape);
    ctx.beginPath();
    ctx.arc(s.x, s.y, glowSize, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
  
    // 2) “тіло” зірки
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = core;
    ctx.fill();
  
    // 3) маленький “хрестик” (лише коли іскра сильна)
    if (sparkShape > 0.35) {
      ctx.globalAlpha = a * 0.55;
      ctx.lineWidth = 1;
      ctx.strokeStyle = core;
      ctx.beginPath();
      ctx.moveTo(s.x - 5, s.y);
      ctx.lineTo(s.x + 5, s.y);
      ctx.moveTo(s.x, s.y - 5);
      ctx.lineTo(s.x, s.y + 5);
      ctx.stroke();
    }
  }
  
  ctx.globalAlpha = 1;

  ctx.save();
  ctx.globalCompositeOperation = "lighter"; // красивіший “світлячок”

  for (const c of COMETS) {
    c.life += dt;
    c.x += c.vx * dt;
    c.y += c.vy * dt;

    // плавне зникання
    const t = Math.min(1, c.life / c.maxLife);
    const alpha = (t < 0.2) ? (t / 0.2) : (1 - (t - 0.2) / 0.8);
    const a = Math.max(0, Math.min(1, alpha));

    // напрямок шлейфу (протилежний швидкості)
    const dx = c.vx;
    const dy = c.vy;
    const mag = Math.hypot(dx, dy) || 1;
    const ux = dx / mag;
    const uy = dy / mag;

    const x2 = c.x - ux * c.len;
    const y2 = c.y - uy * c.len;

    // градієнт шлейфу
    const g = ctx.createLinearGradient(c.x, c.y, x2, y2);
    g.addColorStop(0, `rgba(255,255,255,${0.95 * a})`);
    g.addColorStop(0.35, `rgba(255,105,180,${0.55 * a})`);
    g.addColorStop(1, `rgba(255,105,180,0)`);

    ctx.strokeStyle = g;
    ctx.lineWidth = c.width;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // “голова” комети
    ctx.globalAlpha = 0.95 * a;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 1.6 + c.width, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  // прибрати “мертві” комети
  COMETS = COMETS.filter(c => c.life < c.maxLife && c.x < rect.width + 200 && c.y < rect.height + 200);
}

function startStarfield() {
  lastTs = performance.now();

  function loop(ts) {
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;

    // шанс народження комети
    if (Math.random() < COMET_SPAWN_RATE * dt) {
      spawnComet();
    }

    drawStarfieldFrame(dt);
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}


function drawBackgroundStars() {
  const rect = sky.getBoundingClientRect();
  const ctx = starsCanvas.getContext("2d");
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);

  // випадкові зірочки (статичні)
  const count = Math.floor((rect.width * rect.height) / 5500);
  for (let i = 0; i < count; i++) {
    const x = Math.random() * rect.width;
    const y = Math.random() * rect.height;
    const r = Math.random() * 1.4 + 0.2;
    const a = Math.random() * 0.6 + 0.25;
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function percentToPx(xPercent, yPercent) {
  const rect = sky.getBoundingClientRect();
  return {
    x: (xPercent / 100) * rect.width,
    y: (yPercent / 100) * rect.height
  };
}

function renderStars() {
  starsLayer.innerHTML = "";
  starEls.clear();

  for (const s of DATA.stars) {
    const btn = document.createElement("button");
    btn.className = "star" + (s.size >= 1.4 ? " big" : "");
    btn.style.left = `${s.x}%`;
    btn.style.top = `${s.y}%`;
    btn.setAttribute("type", "button");
    btn.setAttribute("aria-label", s.label || "Зірка");

    const dot = document.createElement("div");
    dot.className = "dot";
    dot.style.animationDuration = `${1.8 + Math.random() * 1.8}s`;

    // легкий масштаб за size
    const scale = Math.max(0.85, Math.min(1.8, s.size || 1.0));
    btn.style.setProperty("--dotScale", scale);

    const label = document.createElement("div");
    label.className = "label";
    label.textContent = s.label || "";

    btn.appendChild(dot);
    btn.appendChild(label);

    btn.addEventListener("click", () => openModal(s));

    starsLayer.appendChild(btn);
    starEls.set(s.id, btn);
  }
}

const formatUA = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return new Intl.DateTimeFormat("uk-UA", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).format(d);
  };

function renderLines() {
  linesSvg.innerHTML = "";
  const rect = sky.getBoundingClientRect();

  const getCenterPx = (id) => {
    const s = DATA.stars.find(x => x.id === id);
    if (!s) return null;
    return percentToPx(s.x, s.y);
  };

  for (const [a, b] of DATA.links || []) {
    const pa = getCenterPx(a);
    const pb = getCenterPx(b);
    if (!pa || !pb) continue;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", pa.x);
    line.setAttribute("y1", pa.y);
    line.setAttribute("x2", pb.x);
    line.setAttribute("y2", pb.y);
    linesSvg.appendChild(line);
  }
}

// ❤️ Сердечка поверх екрана (коротка анімація)
const hearts = [];
function spawnHeartBurst() {
    heartsCanvas.classList.remove("hidden");
    const w = window.innerWidth;
    const h = window.innerHeight;
  
    const BASE_BURST = 320;   // перший “вибух”
    const EXTRA_TIME = 2500;   // скільки мс підсипати додатково
    const EXTRA_RATE = 300;   // скільки сердечок за секунду додатково
  
    const pushHearts = (count) => {
      for (let i = 0; i < count; i++) {
        hearts.push({
          x: w / 2 + (Math.random() - 0.5) * 140,
          y: h / 2 + (Math.random() - 0.5) * 90,
          vx: (Math.random() - 0.5) * 3.2,
          vy: -(1.1 + Math.random() * 2.8),
          s: 0.7 + Math.random() * 1.6,
          a: 1.0
        });
      }
    };
  
    // стартовий вибух
    pushHearts(BASE_BURST);
  
    function drawHeart(ctx, x, y, size, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y);
      ctx.scale(size, size);
  
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.bezierCurveTo(0, 0, -12, 0, -12, 8);
      ctx.bezierCurveTo(-12, 16, 0, 22, 0, 28);
      ctx.bezierCurveTo(0, 22, 12, 16, 12, 8);
      ctx.bezierCurveTo(12, 0, 0, 0, 0, 8);
      ctx.closePath();
  
      ctx.fillStyle = "#ff69b4";
      ctx.fill();
      ctx.restore();
    }
  
    const start = performance.now();
    let last = start;
  
    function step(ts) {
      const dt = Math.min(0.05, (ts - last) / 1000);
      last = ts;
  
      // підсипання додаткових сердечок першу секунду
      const elapsed = ts - start;
      if (elapsed < EXTRA_TIME) {
        const add = Math.floor(EXTRA_RATE * dt);
        if (add > 0) pushHearts(add);
      }
  
      const ctx = heartsCanvas.getContext("2d");
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  
      for (const p of hearts) {
        p.x += p.vx * 3;
        p.y += p.vy * 3;
        p.a *= 0.982; // трохи довше живуть
        drawHeart(ctx, p.x, p.y, 0.9 * p.s, p.a);
      }
  
      for (let i = hearts.length - 1; i >= 0; i--) {
        if (hearts[i].a < 0.05) hearts.splice(i, 1);
      }
  
      if (hearts.length > 0) requestAnimationFrame(step);
      else heartsCanvas.classList.add("hidden");
    }
  
    requestAnimationFrame(step);
  }
  

heartBtn.addEventListener("click", () => {
  closeModal();
  spawnHeartBurst();
});

async function init() {
  const res = await fetch("./stars.json");
  DATA = await res.json();

  document.getElementById("title").textContent = DATA.title || "Наше сузір’я ✨";
  document.getElementById("subtitle").textContent = DATA.subtitle || "";

  resizeCanvases();
    buildStaticStars();
    startStarfield();
    renderStars();
    renderLines();
}

window.addEventListener("resize", () => {
    resizeCanvases();
    buildStaticStars();
    renderLines();
});

init();
