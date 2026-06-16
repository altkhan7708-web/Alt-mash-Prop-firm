/**
 * ALT-MASH TRADER FUNDING - CLIENT SIDE INTERACTION CONTROLLER
 * Handles: Challenge Pricing, CFD Trading Simulator, SVG Charting,
 * Dashboard sync, Profit Calculator, and FAQ accordion.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Lucide Icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // ==========================================================================
  // 3D HERO PARTICLES & 3D MOUSE PARALLAX TILT
  // ==========================================================================
  const heroSection = document.getElementById("hero");
  const heroCanvas = document.getElementById("hero-particles");
  const heroContent = document.querySelector(".hero-container-centered");

  if (heroSection && heroCanvas && heroContent) {
    const ctx = heroCanvas.getContext("2d");
    let width = (heroCanvas.width = heroSection.offsetWidth);
    let height = (heroCanvas.height = heroSection.offsetHeight);

    // Track dimensions on resize
    window.addEventListener("resize", () => {
      width = heroCanvas.width = heroSection.offsetWidth;
      height = heroCanvas.height = heroSection.offsetHeight;
    });

    const numParticles = 45;
    const particles = [];
    const maxDistance = 140;
    const fov = 350;

    // Mouse coordinates relative to center
    let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    window.addEventListener("mousemove", (e) => {
      const rect = heroSection.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      // Track mouse position relative to center
      mouse.targetX = mx - cx;
      mouse.targetY = my - cy;

      // Apply 3D Tilt on hero content container
      const tiltX = (cy - my) / cy * 8; // Max 8 degrees tilt on X
      const tiltY = (mx - cx) / cx * 8; // Max 8 degrees tilt on Y
      heroContent.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-5px)`;
    });

    window.addEventListener("mouseleave", () => {
      mouse.targetX = 0;
      mouse.targetY = 0;
      heroContent.style.transform = "rotateX(0deg) rotateY(0deg) translateY(0px)";
    });

    // Initialize particles in 3D coordinate space
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: (Math.random() - 0.5) * width * 1.2,
        y: (Math.random() - 0.5) * height * 1.2,
        z: Math.random() * fov * 2 - fov,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        vz: (Math.random() - 0.5) * 0.4,
        baseRadius: Math.random() * 2 + 1.5,
        color: i % 2 === 0 ? "rgba(2, 132, 199, 0.4)" : "rgba(179, 134, 43, 0.45)" // Cyan / Gold theme
      });
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);

      // Damp mouse movement for smooth inertial panning
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      const cx = width / 2;
      const cy = height / 2;

      // Slow continuous auto-rotation angles + mouse offset
      const angleY = 0.00015 + mouse.x * 0.0000025;
      const angleX = 0.0001 + mouse.y * 0.0000025;

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      const projected = [];

      particles.forEach((p) => {
        // Move particle
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        // Wrap around boundaries in 3D space
        const rangeX = width * 0.7;
        const rangeY = height * 0.7;
        const rangeZ = fov;

        if (p.x < -rangeX) p.x = rangeX;
        if (p.x > rangeX) p.x = -rangeX;
        if (p.y < -rangeY) p.y = rangeY;
        if (p.y > rangeY) p.y = -rangeY;
        if (p.z < -rangeZ) p.z = rangeZ;
        if (p.z > rangeZ) p.z = -rangeZ;

        // 3D Rotations
        // 1. Rotate Y
        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.z * cosY + p.x * sinY;

        // 2. Rotate X
        let y1 = p.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + p.y * sinX;

        // 3D Perspective Projection
        const scale = fov / (fov + z2);
        const projX = x1 * scale + cx;
        const projY = y1 * scale + cy;

        projected.push({
          x: projX,
          y: projY,
          z: z2,
          radius: p.baseRadius * scale,
          color: p.color
        });
      });

      // Draw connections first
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const p1 = projected[i];
          const p2 = projected[j];

          // Don't draw if behind camera
          if (p1.z < -fov || p2.z < -fov) continue;

          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.15 * (1 - Math.max(p1.z, p2.z) / fov);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(2, 132, 199, ${alpha})`;
            ctx.lineWidth = 0.8 * (p1.radius / p1.baseRadius);
            ctx.stroke();
          }
        }
      }

      // Draw projected nodes
      projected.forEach((p) => {
        if (p.z < -fov) return;

        // Draw particle body
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        // Draw glowing aura
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 2.2, 0, Math.PI * 2);
        const rgbaVal = p.color.includes("2, 132") 
          ? "rgba(2, 132, 199, 0.08)" // Blue
          : "rgba(179, 134, 43, 0.08)"; // Gold
        ctx.fillStyle = rgbaVal;
        ctx.fill();
      });

      requestAnimationFrame(animate);
    }

    animate();
  }

  // ==========================================================================
  // MOBILE NAVIGATION TOGGLE
  // ==========================================================================
  const mobileToggle = document.getElementById("btn-mobile-toggle");
  const navMenu = document.getElementById("nav-menu");
  
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener("click", () => {
      navMenu.classList.toggle("mobile-open");
      const isExpanded = navMenu.classList.contains("mobile-open");
      mobileToggle.innerHTML = isExpanded 
        ? `<i data-lucide="x"></i>` 
        : `<i data-lucide="menu"></i>`;
      lucide.createIcons();
    });
  }

  // Close menu on click of nav links and handle active classes
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      // Remove active from all and add to this one
      navLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");

      if (navMenu && navMenu.classList.contains("mobile-open")) {
        navMenu.classList.remove("mobile-open");
        mobileToggle.innerHTML = `<i data-lucide="menu"></i>`;
        lucide.createIcons();
      }
    });
  });

  // Scroll Spy to highlight active section on scroll
  const spySections = document.querySelectorAll("section[id]");
  window.addEventListener("scroll", () => {
    let currentId = "";
    const scrollPos = window.scrollY + 150; // offset for floating navbar

    spySections.forEach(sec => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      const id = sec.getAttribute("id");

      if (scrollPos >= top && scrollPos < top + height) {
        // Map sections to links
        currentId = id;
      }
    });

    // Special case for hero / top
    if (window.scrollY < 80) {
      currentId = "hero";
    }

    if (currentId) {
      const activeLink = document.querySelector(`.nav-link[href="#${currentId}"]`);
      if (activeLink) {
        navLinks.forEach(l => l.classList.remove("active"));
        activeLink.classList.add("active");
      }
    }
  });

  // ==========================================================================
  // CHALLENGE PLANS & PRICING SELECTOR
  // ==========================================================================
  let selectedSize = 5000; // Default Size model to match screenshot ($5,000)
  let selectedModel = "instant"; // Default Model to match screenshot (Instant)
  let selectedPhase = "Funded"; // Default Phase to match screenshot (Funded)
  let selectedStep = "instant"; // Sync with the dashboard logic

  // Selectors
  const sizeSelectBtns = document.querySelectorAll(".size-select-btn");
  const modelSelectBtns = document.querySelectorAll(".model-select-btn");
  const phasesContainer = document.getElementById("phases-container");

  const detailValTarget = document.getElementById("detail-val-target");
  const detailValDailyLoss = document.getElementById("detail-val-daily-loss");
  const detailValMaxLoss = document.getElementById("detail-val-max-loss");
  const detailValMinDays = document.getElementById("detail-val-min-days");
  const detailValLeverage = document.getElementById("detail-val-leverage");
  const detailValDrawdownType = document.getElementById("detail-val-drawdown-type");

  const challengePriceValue = document.getElementById("challenge-price-value");
  const btnStartChallengeNew = document.getElementById("btn-start-challenge-new");

  function formatCurrency(val) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  }

  function getPlanConfig(model, size, phase) {
    const prices = {
      "instant": { 2500: 49, 5000: 89, 10000: 149, 25000: 279, 50000: 449, 100000: 749 },
      "1-step": { 2500: 49, 5000: 69, 10000: 99, 25000: 189, 50000: 299, 100000: 499 },
      "2-step": { 2500: 39, 5000: 59, 10000: 89, 25000: 169, 50000: 269, 100000: 449 }
    };

    const price = (prices[model] && prices[model][size]) ? prices[model][size] : 0;
    let target = "No limit";
    let dailyLossPercent = 0;
    let maxLossPercent = 0;
    let minDays = "0 Days";
    let leverage = "1:100";
    let drawdownType = "Balance";

    if (model === "instant") {
      dailyLossPercent = 3;
      maxLossPercent = 5;
      minDays = "7 Days";
      leverage = "1:50";
      drawdownType = "Trailing";
    } else if (model === "1-step") {
      dailyLossPercent = 3;
      maxLossPercent = 6;
      drawdownType = "Daily Balance";
      if (phase === "Phase 1") {
        target = `10% (${formatCurrency(size * 0.1)})`;
      }
    } else if (model === "2-step") {
      dailyLossPercent = 5;
      maxLossPercent = 10;
      drawdownType = "Balance";
      if (phase === "Phase 1") {
        target = `8% (${formatCurrency(size * 0.08)})`;
        minDays = "5 Days";
      } else if (phase === "Phase 2") {
        target = `5% (${formatCurrency(size * 0.05)})`;
        minDays = "5 Days";
      } else {
        minDays = "0 Days";
      }
    }

    const dailyLossVal = size * (dailyLossPercent / 100);
    const maxLossVal = size * (maxLossPercent / 100);

    return {
      price,
      target,
      dailyLoss: `${dailyLossPercent}% (${formatCurrency(dailyLossVal)})`,
      maxLoss: `${maxLossPercent}% (${formatCurrency(maxLossVal)})`,
      minDays,
      leverage,
      drawdownType
    };
  }

  function renderPhases() {
    if (!phasesContainer) return;
    phasesContainer.innerHTML = "";

    let phases = [];
    if (selectedModel === "instant") {
      phases = ["Funded"];
    } else if (selectedModel === "1-step") {
      phases = ["Phase 1", "Funded"];
    } else if (selectedModel === "2-step") {
      phases = ["Phase 1", "Phase 2", "Funded"];
    }

    // Adjust selected phase if invalid for current model
    if (!phases.includes(selectedPhase)) {
      selectedPhase = phases[0];
    }

    phases.forEach(ph => {
      const btn = document.createElement("button");
      btn.className = `phase-select-btn${selectedPhase === ph ? ' active' : ''}`;
      btn.textContent = ph;
      btn.setAttribute("data-phase", ph);
      btn.addEventListener("click", () => {
        const btns = phasesContainer.querySelectorAll(".phase-select-btn");
        btns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedPhase = ph;
        updatePricingDisplay();
      });
      phasesContainer.appendChild(btn);
    });
  }

  function updatePricingDisplay() {
    const config = getPlanConfig(selectedModel, selectedSize, selectedPhase);
    if (!config) return;

    // UI Updates
    if (detailValTarget) detailValTarget.textContent = config.target;
    if (detailValDailyLoss) detailValDailyLoss.textContent = config.dailyLoss;
    if (detailValMaxLoss) detailValMaxLoss.textContent = config.maxLoss;
    if (detailValMinDays) detailValMinDays.textContent = config.minDays;
    if (detailValLeverage) detailValLeverage.textContent = config.leverage;
    if (detailValDrawdownType) detailValDrawdownType.textContent = config.drawdownType;

    if (challengePriceValue) {
      challengePriceValue.textContent = `$${config.price.toFixed(2)}`;
    }
  }

  // Size buttons click
  sizeSelectBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      sizeSelectBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedSize = parseInt(btn.getAttribute("data-size"), 10);
      updatePricingDisplay();
    });
  });

  // Model buttons click
  modelSelectBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      modelSelectBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedModel = btn.getAttribute("data-model");
      selectedStep = selectedModel === "instant" ? "instant" : (selectedModel === "1-step" ? 1 : 2);
      renderPhases();
      updatePricingDisplay();
    });
  });

  // Initialize display
  renderPhases();
  updatePricingDisplay();

  // Buy/Start Challenge Button sync
  if (btnStartChallengeNew) {
    btnStartChallengeNew.addEventListener("click", () => {
      const typeText = selectedModel === "instant" ? "Instant Funding" : `${selectedModel} Challenge`;
      alert(`Success! Simulated ${typeText} credentials generated for Account Size ${formatCurrency(selectedSize)}.\nCheck your dashboard below.`);

      // Update the main Dashboard initial capital and type
      const initialCapitalElements = document.querySelectorAll(".dash-account-meta .meta-item:last-child .val");
      initialCapitalElements.forEach(el => el.textContent = formatCurrency(selectedSize));

      const typeBadge = document.querySelector(".dash-status-lbl span");
      if (typeBadge) {
        typeBadge.textContent = selectedModel === "instant" ? "Active Funded (Instant)" : `Active Evaluation (${selectedModel})`;
      }

      // Reset Simulator balance to match the purchased challenge size
      simBalance = selectedSize;
      simEquity = selectedSize;
      activePositions = [];

      // Update dashboard goals
      initialCapital = selectedSize;
      const config = getPlanConfig(selectedModel, selectedSize, selectedPhase);
      
      // Target profit details parsing
      if (selectedModel === "instant") {
        targetProfit = 999999999; // Essentially no target
        dailyLossLimit = selectedSize * 0.03; // 3% daily loss
      } else if (selectedModel === "1-step") {
        targetProfit = selectedSize * 0.10; // 10% target
        dailyLossLimit = selectedSize * 0.03; // 3% daily loss
      } else {
        targetProfit = selectedSize * 0.08; // 8% target
        dailyLossLimit = selectedSize * 0.05; // 5% daily loss
      }

      updatePositionsTable();
      updateSimulatorUI();
      updateDashboardUI();
      
      // Scroll to dashboard
      const dashboardSec = document.getElementById("dashboard");
      if (dashboardSec) {
        dashboardSec.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // ==========================================================================
  // CFD LIVE TRADING SIMULATOR & CHART ENGINE
  // ==========================================================================
  
  // Market simulation states
  const assets = {
    EURUSD: { price: 1.09240, decimal: 5, spread: 0.00010, contract: 100000 },
    BTCUSD: { price: 67420.00, decimal: 2, spread: 5.00, contract: 1 },
    XAUUSD: { price: 2342.50, decimal: 2, spread: 0.25, contract: 100 }
  };

  let activeSymbol = "EURUSD";
  let lotSize = 1.0;
  const leverage = 100;

  // Account balance state
  let simBalance = 50000.00;
  let simEquity = 50000.00;
  let activePositions = [];

  // Generate initial chart data (Brownian motion mock history)
  const chartHistoryLength = 25;
  const priceHistory = {
    EURUSD: [],
    BTCUSD: [],
    XAUUSD: []
  };

  function initChartHistory() {
    Object.keys(assets).forEach(sym => {
      let current = assets[sym].price;
      const dec = assets[sym].decimal;
      const step = current * (sym === "BTCUSD" ? 0.001 : 0.0005);
      
      for (let i = 0; i < chartHistoryLength; i++) {
        // Random walk
        const change = (Math.random() - 0.5) * step;
        current = parseFloat((current + change).toFixed(dec));
        priceHistory[sym].push(current);
      }
      // Set the final one as the current live asset price
      assets[sym].price = current;
    });
  }
  
  initChartHistory();

  // ==========================================================================
  // REAL-TIME MARKET PRICE FETCHING (Free Public APIs)
  // ==========================================================================
  let liveApiEnabled = true;
  let lastApiFetchTime = 0;
  const API_FETCH_INTERVAL = 5000; // Fetch from APIs every 5 seconds

  // Fetch real-time BTC price from Binance (free, no API key)
  async function fetchBTCPrice() {
    try {
      const resp = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
      if (!resp.ok) return null;
      const data = await resp.json();
      return parseFloat(data.price);
    } catch (e) {
      return null;
    }
  }

  // Fetch real-time EUR/USD rate from Frankfurter API (free, no API key)
  async function fetchEURUSDPrice() {
    try {
      const resp = await fetch("https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD");
      if (!resp.ok) return null;
      const data = await resp.json();
      return data.rates && data.rates.USD ? parseFloat(data.rates.USD) : null;
    } catch (e) {
      return null;
    }
  }

  // Fetch real-time Gold (XAU/USD) price from Metal Price API (free tier)
  async function fetchXAUUSDPrice() {
    try {
      // Use the free gold price endpoint from goldapi.io or metals.dev
      const resp = await fetch("https://api.metals.dev/v1/latest?api_key=demo&currency=USD&unit=toz");
      if (!resp.ok) return null;
      const data = await resp.json();
      return data.metals && data.metals.gold ? parseFloat(data.metals.gold) : null;
    } catch (e) {
      return null;
    }
  }

  // Master function to seed prices from real APIs
  async function fetchAllLivePrices() {
    if (!liveApiEnabled) return;

    const [btcPrice, eurPrice, xauPrice] = await Promise.allSettled([
      fetchBTCPrice(),
      fetchEURUSDPrice(),
      fetchXAUUSDPrice()
    ]);

    let updated = false;

    // BTCUSD
    if (btcPrice.status === "fulfilled" && btcPrice.value) {
      assets.BTCUSD.price = parseFloat(btcPrice.value.toFixed(assets.BTCUSD.decimal));
      updated = true;
    }

    // EURUSD
    if (eurPrice.status === "fulfilled" && eurPrice.value) {
      assets.EURUSD.price = parseFloat(eurPrice.value.toFixed(assets.EURUSD.decimal));
      updated = true;
    }

    // XAUUSD
    if (xauPrice.status === "fulfilled" && xauPrice.value) {
      assets.XAUUSD.price = parseFloat(xauPrice.value.toFixed(assets.XAUUSD.decimal));
      updated = true;
    }

    if (updated) {
      // Rebuild chart history around the new real prices
      Object.keys(assets).forEach(sym => {
        const realPrice = assets[sym].price;
        const dec = assets[sym].decimal;
        const step = realPrice * (sym === "BTCUSD" ? 0.0005 : 0.0003);
        
        // Smoothly blend existing history towards new price
        const len = priceHistory[sym].length;
        if (len > 0) {
          // Only update the last few points to trend towards real price
          for (let i = Math.max(0, len - 5); i < len; i++) {
            const blendFactor = (i - (len - 5)) / 5;
            priceHistory[sym][i] = parseFloat(
              (priceHistory[sym][i] * (1 - blendFactor) + realPrice * blendFactor).toFixed(dec)
            );
          }
        }
      });

      // Update sidebar prices and charts
      updateSimulatorUI();
      calculateMargin();
      drawChart();

      // Update sidebar price text elements
      Object.keys(assets).forEach(sym => {
        const el = document.getElementById(`price-${sym.toLowerCase()}`);
        if (el) {
          const dec = assets[sym].decimal;
          el.textContent = assets[sym].price.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
        }
      });

      // Show "LIVE" indicator badge
      const chartBadge = document.querySelector(".chart-badge");
      if (chartBadge && !chartBadge.textContent.includes("LIVE")) {
        chartBadge.textContent = "🟢 LIVE Market Prices";
        chartBadge.style.color = "var(--color-accent-green)";
        chartBadge.style.fontWeight = "700";
      }
    }

    lastApiFetchTime = Date.now();
  }

  // Initial fetch on page load
  fetchAllLivePrices();

  // Periodically refresh from live APIs every 5s
  setInterval(() => {
    fetchAllLivePrices();
  }, API_FETCH_INTERVAL);

  // Elements
  const inputLotSize = document.getElementById("input-lot-size");
  const btnLotMinus = document.getElementById("btn-lot-minus");
  const btnLotPlus = document.getElementById("btn-lot-plus");
  const lotEquivalent = document.getElementById("lot-equivalent");
  const displayMargin = document.getElementById("display-margin");

  const btnSimBuy = document.getElementById("btn-sim-buy");
  const btnSimSell = document.getElementById("btn-sim-sell");
  const simBuyPrice = document.getElementById("sim-buy-price");
  const simSellPrice = document.getElementById("sim-sell-price");
  
  const simValBalance = document.getElementById("sim-val-balance");
  const simValEquity = document.getElementById("sim-val-equity");
  const simValPnl = document.getElementById("sim-val-pnl");
  
  const chartDisplaySymbol = document.getElementById("chart-display-symbol");
  const liveChartSvg = document.getElementById("live-chart-svg");
  const positionsTbody = document.getElementById("positions-tbody");
  const emptyPositionsRow = document.getElementById("empty-positions-row");

  // Format Helpers
  function formatMoney(val) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
  }

  // Update Margin estimation based on current Symbol and Lots
  function calculateMargin() {
    const asset = assets[activeSymbol];
    const lot = parseFloat(inputLotSize.value) || 1.0;
    // Margin = (Lots * Contract Size * CurrentPrice) / Leverage
    const margin = (lot * asset.contract * asset.price) / leverage;
    if (displayMargin) {
      displayMargin.textContent = formatMoney(margin);
    }
  }

  // Lot Adjustments
  if (btnLotMinus && inputLotSize) {
    btnLotMinus.addEventListener("click", () => {
      let val = parseFloat(inputLotSize.value) || 1.0;
      if (val > 0.1) {
        val = parseFloat((val - 0.1).toFixed(1));
        inputLotSize.value = val;
        calculateMargin();
      }
    });
  }

  if (btnLotPlus && inputLotSize) {
    btnLotPlus.addEventListener("click", () => {
      let val = parseFloat(inputLotSize.value) || 1.0;
      if (val < 50.0) {
        val = parseFloat((val + 0.1).toFixed(1));
        inputLotSize.value = val;
        calculateMargin();
      }
    });
  }

  if (inputLotSize) {
    inputLotSize.addEventListener("input", () => {
      let val = parseFloat(inputLotSize.value);
      if (isNaN(val) || val < 0.1) val = 0.1;
      if (val > 50) val = 50;
      inputLotSize.value = val;
      calculateMargin();
    });
  }

  // Switch Active Asset Symbol in Simulator
  const assetPickers = document.querySelectorAll(".asset-tab-btn");
  assetPickers.forEach(picker => {
    picker.addEventListener("click", () => {
      assetPickers.forEach(p => p.classList.remove("active"));
      picker.classList.add("active");
      
      activeSymbol = picker.getAttribute("data-symbol");
      if (chartDisplaySymbol) chartDisplaySymbol.textContent = activeSymbol;

      // Update UI equivalent lot texts
      if (activeSymbol === "EURUSD") {
        lotEquivalent.textContent = "1 Lot = 100,000 EUR";
      } else if (activeSymbol === "BTCUSD") {
        lotEquivalent.textContent = "1 Lot = 1 Bitcoin";
      } else if (activeSymbol === "XAUUSD") {
        lotEquivalent.textContent = "1 Lot = 100 Ounces";
      }

      calculateMargin();
      updateSimulatorUI();
      drawChart();
    });
  });

  // Calculate Unrealized PnL for single position
  function getPositionPnL(pos) {
    const currentPrice = assets[pos.symbol].price;
    const dec = assets[pos.symbol].decimal;
    let diff = 0;
    
    if (pos.type === "BUY") {
      diff = currentPrice - pos.entryPrice;
    } else {
      diff = pos.entryPrice - currentPrice;
    }

    // PnL = LotSize * ContractSize * diff
    return diff * assets[pos.symbol].contract * pos.lots;
  }

  // Execute Buy / Sell Order
  function openPosition(type) {
    const lot = parseFloat(inputLotSize.value) || 1.0;
    const asset = assets[activeSymbol];
    const spreadOffset = (type === "BUY" ? (asset.spread / 2) : -(asset.spread / 2));
    const entryPrice = parseFloat((asset.price + spreadOffset).toFixed(asset.decimal));
    
    // Check if margin is valid
    const requiredMargin = (lot * asset.contract * entryPrice) / leverage;
    if (simEquity < requiredMargin) {
      alert("Insufficient Simulated Margin to execute this trade!");
      return;
    }

    const pos = {
      id: Math.floor(100000 + Math.random() * 900000),
      symbol: activeSymbol,
      type: type,
      lots: lot,
      entryPrice: entryPrice,
      margin: requiredMargin
    };

    activePositions.push(pos);
    updatePositionsTable();
    updateSimulatorUI();
    
    // Smooth scroll positions list into focus for feedback
    const positionsSection = document.getElementById("table-positions");
    if (positionsSection) {
      positionsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  if (btnSimBuy) {
    btnSimBuy.addEventListener("click", () => openPosition("BUY"));
  }
  if (btnSimSell) {
    btnSimSell.addEventListener("click", () => openPosition("SELL"));
  }

  // Update table HTML with active positions
  function updatePositionsTable() {
    if (!positionsTbody) return;
    
    // Clear all
    positionsTbody.innerHTML = "";

    if (activePositions.length === 0) {
      positionsTbody.appendChild(emptyPositionsRow);
      return;
    }

    activePositions.forEach((pos, idx) => {
      const currentPrice = assets[pos.symbol].price;
      const pnl = getPositionPnL(pos);
      const tr = document.createElement("tr");
      
      const pnlClass = pnl >= 0 ? "color-green" : "color-red";
      const pnlSign = pnl >= 0 ? "+" : "";

      tr.innerHTML = `
        <td><strong>${pos.symbol}</strong></td>
        <td><span class="pos-type ${pos.type.toLowerCase()}">${pos.type}</span></td>
        <td>${pos.lots.toFixed(1)}</td>
        <td class="font-mono">${pos.entryPrice.toFixed(assets[pos.symbol].decimal)}</td>
        <td class="font-mono" id="pos-curr-${pos.id}">${currentPrice.toFixed(assets[pos.symbol].decimal)}</td>
        <td class="font-mono ${pnlClass} font-weight-bold" id="pos-pnl-${pos.id}">${pnlSign}${formatMoney(pnl)}</td>
        <td><button class="btn-close-pos" data-pos-id="${pos.id}">CLOSE</button></td>
      `;

      // Event listener for closing
      tr.querySelector(".btn-close-pos").addEventListener("click", () => {
        closePosition(pos.id);
      });

      positionsTbody.appendChild(tr);
    });
  }

  // Close active position
  function closePosition(id) {
    const index = activePositions.findIndex(p => p.id === id);
    if (index === -1) return;
    
    const pos = activePositions[index];
    const pnl = getPositionPnL(pos);
    
    // Realize PnL to balance
    simBalance += pnl;
    
    // Add transaction record to closed trades table in Dashboard
    addClosedTradeToJournal(pos, pnl);
    
    // Remove position
    activePositions.splice(index, 1);
    
    updatePositionsTable();
    updateSimulatorUI();
    updateDashboardUI();
  }

  function addClosedTradeToJournal(pos, finalPnl) {
    const tbody = document.querySelector(".dash-trades-table-wrapper tbody");
    if (!tbody) return;

    const row = document.createElement("tr");
    const asset = assets[pos.symbol];
    const currentPrice = asset.price;
    const isWin = finalPnl >= 0;
    const outcomeText = isWin ? "WIN" : "LOSS";
    const outcomeClass = isWin ? "badge-win" : "badge-loss";
    const pnlSign = finalPnl >= 0 ? "+" : "";
    const pnlClass = finalPnl >= 0 ? "color-green" : "color-red";

    row.innerHTML = `
      <td>#TRD-${pos.id}</td>
      <td><strong>${pos.symbol}</strong></td>
      <td><span class="badge-${pos.type === 'BUY' ? 'long' : 'short'}">${pos.type === 'BUY' ? 'LONG' : 'SHORT'}</span></td>
      <td>${pos.lots.toFixed(1)}</td>
      <td>${pos.entryPrice.toFixed(asset.decimal)}</td>
      <td>${currentPrice.toFixed(asset.decimal)}</td>
      <td><span class="${outcomeClass}">${outcomeText}</span></td>
      <td class="${pnlClass}">${pnlSign}${formatMoney(finalPnl)}</td>
    `;

    // Insert at top of table
    if (tbody.firstChild) {
      tbody.insertBefore(row, tbody.firstChild);
    } else {
      tbody.appendChild(row);
    }

    // Keep only top 8 trades
    while (tbody.children.length > 8) {
      tbody.removeChild(tbody.lastChild);
    }
  }

  // Update simulator pricing boxes, balance, and equity
  function updateSimulatorUI() {
    let totalPnl = 0;
    activePositions.forEach(p => {
      totalPnl += getPositionPnL(p);
    });

    simEquity = simBalance + totalPnl;

    // Display updates
    if (simValBalance) simValBalance.textContent = formatMoney(simBalance);
    if (simValEquity) simValEquity.textContent = formatMoney(simEquity);
    
    if (simValPnl) {
      simValPnl.textContent = (totalPnl >= 0 ? "+" : "") + formatMoney(totalPnl);
      simValPnl.className = "pnl-value " + (totalPnl > 0 ? "positive" : (totalPnl < 0 ? "negative" : "neutral"));
    }

    // Tick bid/ask buttons
    const activeAsset = assets[activeSymbol];
    const buyPrice = parseFloat((activeAsset.price + (activeAsset.spread / 2)).toFixed(activeAsset.decimal));
    const sellPrice = parseFloat((activeAsset.price - (activeAsset.spread / 2)).toFixed(activeAsset.decimal));

    if (simBuyPrice) simBuyPrice.textContent = buyPrice.toFixed(activeAsset.decimal);
    if (simSellPrice) simSellPrice.textContent = sellPrice.toFixed(activeAsset.decimal);

    // Update active positions individual fields dynamically without redrawing table (avoid jitter)
    activePositions.forEach(pos => {
      const pCurr = document.getElementById(`pos-curr-${pos.id}`);
      const pPnl = document.getElementById(`pos-pnl-${pos.id}`);
      if (pCurr && pPnl) {
        const curPrice = assets[pos.symbol].price;
        const pnl = getPositionPnL(pos);
        const pnlSign = pnl >= 0 ? "+" : "";

        pCurr.textContent = curPrice.toFixed(assets[pos.symbol].decimal);
        pPnl.textContent = pnlSign + formatMoney(pnl);
        pPnl.className = "font-mono font-weight-bold " + (pnl >= 0 ? "color-green" : "color-red");
      }
    });

    // Also update the dashboard values
    updateDashboardUI();
  }

  // Live price simulator loop (ticks every 1.5s)
  setInterval(() => {
    // Generate new price for each asset
    Object.keys(assets).forEach(sym => {
      const asset = assets[sym];
      const dec = asset.decimal;
      
      // Calculate random movement percentage
      const walkFactor = sym === "BTCUSD" ? 40 : (sym === "XAUUSD" ? 0.6 : 0.00015);
      const isUp = Math.random() > 0.48; // slight upward bias for visuals
      const delta = (Math.random() * walkFactor) * (isUp ? 1 : -1);
      
      const oldPrice = asset.price;
      const newPrice = parseFloat(Math.max(0.00001, oldPrice + delta).toFixed(dec));
      
      asset.price = newPrice;

      // Update price history array
      priceHistory[sym].push(newPrice);
      if (priceHistory[sym].length > chartHistoryLength) {
        priceHistory[sym].shift();
      }

      // Update asset side picker texts and flash
      const pickerPriceEl = document.getElementById(`price-${sym.toLowerCase()}`);
      if (pickerPriceEl) {
        pickerPriceEl.textContent = newPrice.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
        
        // Flash animation
        const flashClass = isUp ? "tick-up" : "tick-down";
        pickerPriceEl.classList.add(flashClass);
        setTimeout(() => {
          pickerPriceEl.classList.remove("tick-up", "tick-down");
        }, 300);
      }
    });

    // Recalculate margins and PnL
    calculateMargin();
    updateSimulatorUI();
    drawChart();
  }, 1500);

  // Draw chart based on active price history
  function drawChart() {
    if (!liveChartSvg) return;
    
    const history = priceHistory[activeSymbol];
    if (!history || history.length === 0) return;

    // Viewport dimensions
    const width = 800;
    const height = 350;
    const paddingLeft = 30;
    const paddingRight = 80;
    const paddingTop = 30;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Min & Max Price
    const minVal = Math.min(...history);
    const maxVal = Math.max(...history);
    const valRange = maxVal - minVal === 0 ? 1 : maxVal - minVal;
    
    // Add vertical buffer
    const buffer = valRange * 0.1;
    const minWithBuffer = Math.max(0.00001, minVal - buffer);
    const maxWithBuffer = maxVal + buffer;
    const adjustedRange = maxWithBuffer - minWithBuffer;

    // Map coordinates
    const points = history.map((price, idx) => {
      const x = paddingLeft + (idx / (history.length - 1)) * chartWidth;
      const y = paddingTop + (1 - (price - minWithBuffer) / adjustedRange) * chartHeight;
      return { x, y, price };
    });

    // Start rendering SVG elements
    let svgContent = `
      <!-- Definitions for glowing gradient drop-shadows -->
      <defs>
        <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--color-accent-blue)" stop-opacity="0.25" />
          <stop offset="100%" stop-color="var(--color-accent-blue)" stop-opacity="0" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
    `;

    // 1. Gridlines (Horizontal)
    const horizontalGridLinesCount = 4;
    for (let i = 0; i <= horizontalGridLinesCount; i++) {
      const gridY = paddingTop + (i / horizontalGridLinesCount) * chartHeight;
      const gridPrice = maxWithBuffer - (i / horizontalGridLinesCount) * adjustedRange;
      
      svgContent += `
        <line x1="${paddingLeft}" y1="${gridY}" x2="${width - paddingRight}" y2="${gridY}" 
              stroke="rgba(255,255,255,0.05)" stroke-width="1" stroke-dasharray="4 4" />
        <text x="${width - paddingRight + 8}" y="${gridY + 4}" fill="var(--color-text-muted)" 
              font-size="11" font-family="monospace">${gridPrice.toFixed(assets[activeSymbol].decimal)}</text>
      `;
    }

    // 2. Line Chart path strings
    let polylineStr = "";
    let areaStr = `M ${points[0].x} ${height - paddingBottom} `;
    
    points.forEach((p, idx) => {
      if (idx === 0) {
        polylineStr += `M ${p.x} ${p.y} `;
      } else {
        polylineStr += `L ${p.x} ${p.y} `;
      }
      areaStr += `L ${p.x} ${p.y} `;
    });
    
    areaStr += `L ${points[points.length - 1].x} ${height - paddingBottom} Z`;

    // Render gradient filled area
    svgContent += `<path d="${areaStr}" fill="url(#chart-area-grad)" />`;

    // Render glowing stroke line
    svgContent += `<path d="${polylineStr}" fill="none" stroke="var(--color-accent-blue)" stroke-width="2.5" filter="url(#glow)" />`;

    // 3. Last Price dot and label indicator
    const lastPoint = points[points.length - 1];
    svgContent += `
      <circle cx="${lastPoint.x}" cy="${lastPoint.y}" r="6" fill="var(--color-accent-blue)" />
      <circle cx="${lastPoint.x}" cy="${lastPoint.y}" r="12" fill="none" stroke="var(--color-accent-blue)" stroke-width="1.5" opacity="0.5">
        <animate attributeName="r" values="6;18" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.8;0" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <!-- Real-time price tracker horizontal tag -->
      <line x1="${paddingLeft}" y1="${lastPoint.y}" x2="${lastPoint.x}" y2="${lastPoint.y}" stroke="var(--color-accent-blue)" stroke-width="1" stroke-dasharray="2 2" opacity="0.3"/>
    `;

    liveChartSvg.innerHTML = svgContent;
  }

  // Draw chart immediately on init
  drawChart();


  // ==========================================================================
  // MEMBER TRADER DASHBOARD SYNC & PROGRESS RINGS
  // ==========================================================================
  const dashBalanceVal = document.getElementById("dash-balance-val");
  const dashEquityVal = document.getElementById("dash-equity-val");
  
  const targetProgressCircle = document.getElementById("target-progress-ring");
  const drawdownProgressCircle = document.getElementById("drawdown-progress-ring");
  const targetPercentageTxt = document.getElementById("target-percentage-txt");
  const drawdownPercentageTxt = document.getElementById("drawdown-percentage-txt");

  let initialCapital = 50000;
  let targetProfit = 4000; // 8% of $50k
  let dailyLossLimit = 2500; // 5% of $50k

  function updateDashboardUI() {
    if (dashBalanceVal) dashBalanceVal.textContent = formatMoney(simBalance);
    if (dashEquityVal) {
      dashEquityVal.textContent = formatMoney(simEquity);
      dashEquityVal.className = "widget-val " + (simEquity >= simBalance ? "color-green" : "color-red");
    }

    // Profit Target Progress (Max target = initialCapital + targetProfit)
    const currentProfit = simEquity - initialCapital;
    let profitPercentage = 0;
    
    if (selectedStep === "instant") {
      profitPercentage = 100; // instant has no target target
    } else {
      profitPercentage = (currentProfit / targetProfit) * 100;
    }
    
    if (profitPercentage < 0) profitPercentage = 0;
    if (profitPercentage > 100) profitPercentage = 100;

    // Circle Circumference is 2 * PI * r = 2 * 3.1416 * 50 = 314.16
    const circumference = 314.16;
    if (targetProgressCircle) {
      const offset = circumference - (profitPercentage / 100) * circumference;
      targetProgressCircle.style.strokeDashoffset = offset;
    }
    if (targetPercentageTxt) {
      targetPercentageTxt.textContent = selectedStep === "instant" ? "N/A" : `${profitPercentage.toFixed(1)}%`;
    }

    // Dynamic labels details for Target Widget
    const targetDetails = document.querySelectorAll("#dashboard .dash-metrics-grid .dash-metric-widget:nth-child(2) .progress-details .widget-sub");
    if (targetDetails.length >= 2) {
      if (selectedStep === "instant") {
        targetDetails[0].innerHTML = `Target: <strong>N/A (Immediate Payouts)</strong>`;
        targetDetails[1].innerHTML = `Current Profit: <strong class="${currentProfit >= 0 ? 'color-green' : 'color-red'}">${currentProfit >= 0 ? '+' : ''}${formatMoney(currentProfit)}</strong>`;
      } else {
        const targetPercentStr = selectedStep === 1 ? "+10.0%" : "+8.0%";
        targetDetails[0].innerHTML = `Target: <strong>${formatMoney(initialCapital + targetProfit)}</strong> (${targetPercentStr})`;
        targetDetails[1].innerHTML = `Current Profit: <strong class="${currentProfit >= 0 ? 'color-green' : 'color-red'}">${currentProfit >= 0 ? '+' : ''}${formatMoney(currentProfit)}</strong>`;
      }
    }

    // Daily Drawdown limit progress (Limit is dailyLossLimit drawdown)
    const currentDrawdownAmt = Math.max(0, initialCapital - simEquity);
    let drawdownPercentage = (currentDrawdownAmt / dailyLossLimit) * 100;
    if (drawdownPercentage < 0) drawdownPercentage = 0;
    if (drawdownPercentage > 100) drawdownPercentage = 100;

    if (drawdownProgressCircle) {
      const offset = circumference - (drawdownPercentage / 100) * circumference;
      drawdownProgressCircle.style.strokeDashoffset = offset;
    }
    if (drawdownPercentageTxt) {
      drawdownPercentageTxt.textContent = `${drawdownPercentage.toFixed(1)}%`;
      
      // Update gauges color based on warning level
      if (drawdownPercentage > 75) {
        drawdownProgressCircle.style.stroke = "var(--color-accent-red)";
        drawdownPercentageTxt.className = "progress-percentage color-red";
      } else if (drawdownPercentage > 40) {
        drawdownProgressCircle.style.stroke = "var(--color-accent-gold)";
        drawdownPercentageTxt.className = "progress-percentage color-gold";
      } else {
        drawdownProgressCircle.style.stroke = "var(--color-accent-blue)";
        drawdownPercentageTxt.className = "progress-percentage color-blue";
      }
    }

    // Dynamic labels details for Daily Drawdown Widget
    const lossDetails = document.querySelectorAll("#dashboard .dash-metrics-grid .dash-metric-widget:nth-child(3) .progress-details .widget-sub");
    if (lossDetails.length >= 2) {
      lossDetails[0].innerHTML = `Max Daily Loss: <strong>${formatMoney(dailyLossLimit)}</strong>`;
      lossDetails[1].innerHTML = `Current Daily Loss: <strong class="color-red">${currentDrawdownAmt > 0 ? '-' : ''}${formatMoney(currentDrawdownAmt)}</strong>`;
    }
  }

  // Initial dashboard sync
  updateDashboardUI();

  // ==========================================================================
  // PROFIT CALCULATOR CONTROLLER
  // ==========================================================================
  const calcAccountSize = document.getElementById("calc-account-size");
  const calcMonthlyGain = document.getElementById("calc-monthly-gain");
  const calcSplitPct = document.getElementById("calc-split-pct");

  const calcPctVal = document.getElementById("calc-pct-val");
  const calcSplitVal = document.getElementById("calc-split-val");

  const calcTotalProfit = document.getElementById("calc-total-profit");
  const calcTraderSplit = document.getElementById("calc-trader-split");
  const calcPlatformSplit = document.getElementById("calc-platform-split");

  function calculateEarnings() {
    if (!calcAccountSize || !calcMonthlyGain || !calcSplitPct) return;

    const size = parseInt(calcAccountSize.value, 10);
    const monthlyGainPct = parseInt(calcMonthlyGain.value, 10);
    const splitPct = parseInt(calcSplitPct.value, 10);

    // Dynamic Labels
    if (calcPctVal) calcPctVal.textContent = `${monthlyGainPct}%`;
    if (calcSplitVal) calcSplitVal.textContent = `${splitPct}%`;

    // Calculations
    const totalProfit = size * (monthlyGainPct / 100);
    const traderShare = totalProfit * (splitPct / 100);
    const platformShare = totalProfit - traderShare;

    // Display
    if (calcTotalProfit) calcTotalProfit.textContent = formatMoney(totalProfit);
    if (calcTraderSplit) calcTraderSplit.textContent = formatMoney(traderShare);
    if (calcPlatformSplit) calcPlatformSplit.textContent = formatMoney(platformShare);
  }

  if (calcAccountSize) calcAccountSize.addEventListener("change", calculateEarnings);
  if (calcMonthlyGain) calcMonthlyGain.addEventListener("input", calculateEarnings);
  if (calcSplitPct) calcSplitPct.addEventListener("input", calculateEarnings);

  // Initial calculation
  calculateEarnings();


  // ==========================================================================
  // FAQ ACCORDIONS CONTROLLER
  // ==========================================================================
  const faqItems = document.querySelectorAll(".faq-item");

  faqItems.forEach(item => {
    const trigger = item.querySelector(".faq-trigger");
    if (!trigger) return;

    trigger.addEventListener("click", () => {
      const isActive = item.classList.contains("active");

      // Close all other FAQs
      faqItems.forEach(faq => {
        faq.classList.remove("active");
      });

      // Toggle active for this one
      if (!isActive) {
        item.classList.add("active");
      }
    });
  });
  // ==========================================================================
  // PAYOUT CERTIFICATE CAROUSEL
  // ==========================================================================
  const certSlides = document.querySelectorAll(".certificate-slide");
  const certDots = document.querySelectorAll(".carousel-dot");
  const certPrevBtn = document.getElementById("cert-carousel-prev");
  const certNextBtn = document.getElementById("cert-carousel-next");
  let currentCertIndex = 0;

  function showCertSlide(index) {
    if (certSlides.length === 0) return;
    
    // Clamp index
    if (index >= certSlides.length) {
      currentCertIndex = 0;
    } else if (index < 0) {
      currentCertIndex = certSlides.length - 1;
    } else {
      currentCertIndex = index;
    }

    // Hide all
    certSlides.forEach(slide => slide.classList.remove("active"));
    certDots.forEach(dot => dot.classList.remove("active"));

    // Show selected
    certSlides[currentCertIndex].classList.add("active");
    if (certDots[currentCertIndex]) {
      certDots[currentCertIndex].classList.add("active");
    }
  }

  if (certPrevBtn) {
    certPrevBtn.addEventListener("click", () => {
      showCertSlide(currentCertIndex - 1);
    });
  }

  if (certNextBtn) {
    certNextBtn.addEventListener("click", () => {
      showCertSlide(currentCertIndex + 1);
    });
  }

  certDots.forEach((dot, idx) => {
    dot.addEventListener("click", () => {
      showCertSlide(idx);
    });
  });

  // Auto-play certificates every 6 seconds
  setInterval(() => {
    showCertSlide(currentCertIndex + 1);
  }, 6000);

  // ==========================================================================
  // FLOATING PROMO POPUP CLOSE HANDLER
  // ==========================================================================
  const promoPopup = document.getElementById("promo-popup");
  const btnPromoClose = document.getElementById("btn-promo-close");
  if (promoPopup && btnPromoClose) {
    btnPromoClose.addEventListener("click", () => {
      promoPopup.style.transition = "all 0.5s ease";
      promoPopup.style.opacity = "0";
      promoPopup.style.transform = "translateY(20px) scale(0.95)";
      setTimeout(() => {
        promoPopup.style.display = "none";
      }, 500);
    });
  }

  // ==========================================================================
  // STATS COUNTER COUNT-UP ANIMATION
  // ==========================================================================
  const statPayoutsEl = document.getElementById("stat-payouts");
  const statTradersEl = document.getElementById("stat-traders");

  const runCounterAnimation = (el, target, isCurrency = false) => {
    let startTimestamp = null;
    const duration = 2000; // 2 seconds animation
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const currentVal = Math.floor(progress * target);
      
      if (isCurrency) {
        el.textContent = "$" + currentVal.toLocaleString('en-US');
      } else {
        el.textContent = currentVal.toLocaleString('en-US');
      }

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  };

  if (statPayoutsEl && statTradersEl) {
    // Run after a slight delay for aesthetic load
    setTimeout(() => {
      runCounterAnimation(statPayoutsEl, 42851204, true);
      runCounterAnimation(statTradersEl, 18452, false);
    }, 400);
  }

  // ==========================================================================
  // 3D PRELOADER CONTROLLER
  // ==========================================================================
  const preloader = document.getElementById("preloader");
  const preloaderBarFill = document.getElementById("preloader-bar-fill");
  
  if (preloader && preloaderBarFill) {
    let progress = 0;
    const interval = setInterval(() => {
      // Smoothly increment progress up to 90%
      if (progress < 90) {
        progress += Math.random() * 8;
        if (progress > 90) progress = 90;
        preloaderBarFill.style.width = `${progress}%`;
      }
    }, 80);

    // Complete loader and fade out when everything on page loads
    window.addEventListener("load", () => {
      clearInterval(interval);
      preloaderBarFill.style.width = "100%";
      
      setTimeout(() => {
        preloader.classList.add("fade-out");
        document.body.classList.add("loaded");
        
        // Remove from DOM after transition completes to prevent interference
        setTimeout(() => {
          preloader.style.display = "none";
        }, 800);
      }, 300);
    });
  }

});
