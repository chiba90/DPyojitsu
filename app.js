/* ==========================================================================
   2026年度 予実管理システム - コアロジック & データベース連携 (app.js)
   ========================================================================== */

const db = realDB;

// State Manager
let state = {
  currentView: "dashboard", // dashboard, bu_grid, import_sim, config
  useWeek: "this_week", // this_week, last_week
  selectedBU: "all", // "all", "bu_gov", etc.
  highlightChanges: true,
  importProgress: 0,
  isImporting: false
};

// Helper to safely access BU metrics and handle week key fallbacks (robust design)
function getMetricData(bu, metricKey, weekKey) {
  const m = bu.metrics[metricKey];
  if (!m) return Array(12).fill(0);
  if (weekKey === "budget") return m.budget || Array(12).fill(0);
  return m[weekKey] || m.actual_this_week || m.budget || Array(12).fill(0);
}

// Calculate all-company totals
function calculateTotals(weekKey) {
  const monthsCount = db.months.length;
  const totals = {
    volume: { budget: Array(monthsCount).fill(0), actual: Array(monthsCount).fill(0) },
    revenue: { budget: Array(monthsCount).fill(0), actual: Array(monthsCount).fill(0) },
    gp: { budget: Array(monthsCount).fill(0), actual: Array(monthsCount).fill(0) },
    headcount: { budget: Array(monthsCount).fill(0), actual: Array(monthsCount).fill(0) }
  };
  
  db.businessUnits.forEach(bu => {
    const volBud = getMetricData(bu, "volume", "budget");
    const volAct = getMetricData(bu, "volume", weekKey);
    const revBud = getMetricData(bu, "revenue", "budget");
    const revAct = getMetricData(bu, "revenue", weekKey);
    const gpBud = getMetricData(bu, "gp", "budget");
    const gpAct = getMetricData(bu, "gp", weekKey);
    const hcBud = getMetricData(bu, "headcount", "budget");
    const hcAct = getMetricData(bu, "headcount", weekKey);
    
    for (let m = 0; m < monthsCount; m++) {
      totals.volume.budget[m] += volBud[m] || 0;
      totals.volume.actual[m] += volAct[m] || 0;
      
      totals.revenue.budget[m] += revBud[m] || 0;
      totals.revenue.actual[m] += revAct[m] || 0;
      
      totals.gp.budget[m] += gpBud[m] || 0;
      totals.gp.actual[m] += gpAct[m] || 0;
      
      totals.headcount.budget[m] += hcBud[m] || 0;
      totals.headcount.actual[m] += hcAct[m] || 0;
    }
  });
  
  return totals;
}

// Get totals filtered by selected BU or all-company
function getFilteredTotals(weekKey) {
  if (state.selectedBU === "all") {
    return calculateTotals(weekKey);
  }
  
  const bu = db.businessUnits.find(b => b.id === state.selectedBU);
  const totals = {
    volume: { budget: getMetricData(bu, "volume", "budget"), actual: getMetricData(bu, "volume", weekKey) },
    revenue: { budget: getMetricData(bu, "revenue", "budget"), actual: getMetricData(bu, "revenue", weekKey) },
    gp: { budget: getMetricData(bu, "gp", "budget"), actual: getMetricData(bu, "gp", weekKey) },
    headcount: { budget: getMetricData(bu, "headcount", "budget"), actual: getMetricData(bu, "headcount", weekKey) }
  };
  return totals;
}

// Draw Dashboard Chart using dynamic SVG
function drawDashboardChart() {
  const chartContainer = document.getElementById("main-chart");
  if (!chartContainer) return;
  
  const width = chartContainer.clientWidth || 600;
  const height = 240;
  const paddingLeft = 60;
  const paddingRight = 30;
  const paddingTop = 20;
  const paddingBottom = 30;
  
  const weekKey = state.useWeek === "this_week" ? "actual_this_week" : "actual_last_week";
  const totals = getFilteredTotals(weekKey);
  
  // Get max values for scale
  const allValues = [...totals.revenue.budget, ...totals.revenue.actual];
  const maxVal = Math.max(...allValues) * 1.15; // 15% padding
  
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  
  const getX = (idx) => paddingLeft + (idx / 11) * chartWidth;
  const getY = (val) => height - paddingBottom - (val / maxVal) * chartHeight;
  
  let svgContent = `<svg class="chart-svg" width="100%" height="${height}" viewBox="0 0 ${width} ${height}">`;
  
  // Y-axis Grid Lines & labels (4 steps)
  for (let i = 0; i <= 4; i++) {
    const val = (maxVal * i) / 4;
    const y = getY(val);
    svgContent += `
      <line class="chart-grid-line" x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" />
      <text class="chart-text" x="${paddingLeft - 10}" y="${y + 4}" text-anchor="end">${Math.round(val / 1000).toLocaleString()}M</text>
    `;
  }
  
  // X-axis Month labels
  db.months.forEach((m, idx) => {
    const x = getX(idx);
    svgContent += `
      <text class="chart-text" x="${x}" y="${height - 10}" text-anchor="middle">${m.name.split("/")[1]}月</text>
    `;
  });
  
  // Draw Budget Line
  let budgetPath = `M ${getX(0)} ${getY(totals.revenue.budget[0])}`;
  for (let i = 1; i < 12; i++) {
    budgetPath += ` L ${getX(i)} ${getY(totals.revenue.budget[i])}`;
  }
  svgContent += `<path class="chart-line-budget" d="${budgetPath}" />`;
  
  // Draw Actual/Forecast Line
  let actualPath = `M ${getX(0)} ${getY(totals.revenue.actual[0])}`;
  // Up to confirmedMonth is actual (solid line), then forecast (dashed line)
  const confIdx = db.confirmedMonth; // April (Index 6)
  
  for (let i = 1; i <= confIdx; i++) {
    actualPath += ` L ${getX(i)} ${getY(totals.revenue.actual[i])}`;
  }
  svgContent += `<path class="chart-line" d="${actualPath}" />`;
  
  let forecastPath = `M ${getX(confIdx)} ${getY(totals.revenue.actual[confIdx])}`;
  for (let i = confIdx + 1; i < 12; i++) {
    forecastPath += ` L ${getX(i)} ${getY(totals.revenue.actual[i])}`;
  }
  svgContent += `<path class="chart-line-forecast" d="${forecastPath}" />`;
  
  // Dots for points
  totals.revenue.actual.forEach((val, i) => {
    const x = getX(i);
    const y = getY(val);
    svgContent += `
      <circle class="chart-dot" cx="${x}" cy="${y}" r="5" data-month="${db.months[i].name}" data-value="${Math.round(val).toLocaleString()}" />
    `;
  });
  
  svgContent += `</svg>`;
  chartContainer.innerHTML = svgContent;
  bindChartTooltips();
}

// Draw Productivity Chart (一人あたり粗利)
function drawProductivityChart() {
  const chartContainer = document.getElementById("productivity-chart");
  if (!chartContainer) return;
  
  const width = chartContainer.clientWidth || 300;
  const height = 240;
  const paddingLeft = 50;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;
  
  const weekKey = state.useWeek === "this_week" ? "actual_this_week" : "actual_last_week";
  const totals = getFilteredTotals(weekKey);
  
  // calculate Productivity: 全社粗利 / 全社社員数
  const prodActual = [];
  const prodBudget = [];
  
  for (let i = 0; i < 12; i++) {
    prodActual.push(totals.gp.actual[i] / (totals.headcount.actual[i] || 1));
    prodBudget.push(totals.gp.budget[i] / (totals.headcount.budget[i] || 1));
  }
  
  const maxVal = Math.max(...prodActual, ...prodBudget) * 1.15;
  
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  
  const getX = (idx) => paddingLeft + (idx / 11) * chartWidth;
  const getY = (val) => height - paddingBottom - (val / maxVal) * chartHeight;
  
  let svgContent = `<svg class="chart-svg" width="100%" height="${height}" viewBox="0 0 ${width} ${height}">`;
  
  // Grid Lines
  for (let i = 0; i <= 3; i++) {
    const val = (maxVal * i) / 3;
    const y = getY(val);
    svgContent += `
      <line class="chart-grid-line" x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" />
      <text class="chart-text" x="${paddingLeft - 10}" y="${y + 4}" text-anchor="end">${Math.round(val).toLocaleString()}</text>
    `;
  }
  
  // Draw Line
  let path = `M ${getX(0)} ${getY(prodActual[0])}`;
  for (let i = 1; i < 12; i++) {
    path += ` L ${getX(i)} ${getY(prodActual[i])}`;
  }
  svgContent += `<path class="chart-line" style="stroke: var(--accent-purple);" d="${path}" />`;
  
  // Draw Dots for Productivity
  prodActual.forEach((val, i) => {
    const x = getX(i);
    const y = getY(val);
    svgContent += `
      <circle class="chart-dot" style="fill: var(--accent-purple);" cx="${x}" cy="${y}" r="5" data-month="${db.months[i].name}" data-value="${val.toFixed(1)}" data-type="productivity" />
    `;
  });
  
  // Labels
  db.months.forEach((m, idx) => {
    if (idx % 2 === 0) {
      const x = getX(idx);
      svgContent += `
        <text class="chart-text" x="${x}" y="${height - 10}" text-anchor="middle">${m.name.split("/")[1]}月</text>
      `;
    }
  });
  
  svgContent += `</svg>`;
  chartContainer.innerHTML = svgContent;
  bindChartTooltips();
}

// Format Yen numbers to human-readable strings
function formatYen(value) {
  if (Math.abs(value) >= 100000) {
    return (value / 100000).toFixed(1) + " 億円";
  } else if (Math.abs(value) >= 10) {
    return (value / 10).toFixed(0) + " 万円";
  } else {
    return Math.round(value * 1000).toLocaleString() + " 円";
  }
}

// Update a single KPI card's change comparison badge
function updateKPIChange(id, pct, label = "前週比") {
  const el = document.getElementById(id);
  if (!el) return;
  const changeEl = el.nextElementSibling;
  if (!changeEl) return;
  
  const rounded = pct.toFixed(1);
  let sign = "";
  let icon = "";
  let colorClass = "change-neutral";
  
  if (pct > 0.01) {
    sign = "+";
    icon = `<i class="fa-solid fa-caret-up"></i> `;
    colorClass = "change-up";
  } else if (pct < -0.01) {
    icon = `<i class="fa-solid fa-caret-down"></i> `;
    colorClass = "change-down";
  } else {
    icon = `<i class="fa-solid fa-minus"></i> `;
    colorClass = "change-neutral";
  }
  
  changeEl.className = `kpi-change ${colorClass}`;
  changeEl.innerHTML = `${icon}<span>${sign}${rounded}% (${label})</span>`;
}

// Update all Dashboard KPI Cards dynamically
function updateKPICards() {
  const weekKey = state.useWeek === "this_week" ? "actual_this_week" : "actual_last_week";
  const prevWeekKey = "actual_last_week";
  
  const totals = getFilteredTotals(weekKey);
  const prevTotals = getFilteredTotals(prevWeekKey);
  
  // 1. Calculate values
  const totalVol = totals.volume.actual.reduce((a,b) => a+b, 0);
  const totalRev = totals.revenue.actual.reduce((a,b) => a+b, 0);
  const totalGP = totals.gp.actual.reduce((a,b) => a+b, 0);
  const totalHC = totals.headcount.actual.reduce((a,b) => a+b, 0);
  const prodVal = totalHC > 0 ? (totalGP / totalHC) / 10 : 0; // 万円/人
  
  // Set KPI values in DOM
  const volEl = document.getElementById("kpi-vol-val");
  const revEl = document.getElementById("kpi-rev-val");
  const gpEl = document.getElementById("kpi-gp-val");
  const prodEl = document.getElementById("kpi-prod-val");
  
  if (volEl) volEl.innerText = formatYen(totalVol);
  if (revEl) revEl.innerText = formatYen(totalRev);
  if (gpEl) gpEl.innerText = formatYen(totalGP);
  if (prodEl) prodEl.innerText = prodVal.toFixed(1) + " 万円/人";
  
  // 2. Calculate comparison percentages
  let volPct = 0, revPct = 0, gpPct = 0, prodPct = 0;
  let compLabel = "前週比";
  
  if (state.useWeek === "this_week") {
    // WoW comparison
    const lastVol = prevTotals.volume.actual.reduce((a,b) => a+b, 0);
    const lastRev = prevTotals.revenue.actual.reduce((a,b) => a+b, 0);
    const lastGP = prevTotals.gp.actual.reduce((a,b) => a+b, 0);
    const lastHC = prevTotals.headcount.actual.reduce((a,b) => a+b, 0);
    const lastProd = lastHC > 0 ? (lastGP / lastHC) / 10 : 0;
    
    volPct = lastVol > 0 ? ((totalVol - lastVol) / lastVol) * 100 : 0;
    revPct = lastRev > 0 ? ((totalRev - lastRev) / lastRev) * 100 : 0;
    gpPct = lastGP > 0 ? ((totalGP - lastGP) / lastGP) * 100 : 0;
    prodPct = lastProd > 0 ? ((prodVal - lastProd) / lastProd) * 100 : 0;
    compLabel = "前週比";
  } else {
    // Budget comparison
    const budVol = totals.volume.budget.reduce((a,b) => a+b, 0);
    const budRev = totals.revenue.budget.reduce((a,b) => a+b, 0);
    const budGP = totals.gp.budget.reduce((a,b) => a+b, 0);
    const budHC = totals.headcount.budget.reduce((a,b) => a+b, 0);
    const budProd = budHC > 0 ? (budGP / budHC) / 10 : 0;
    
    volPct = budVol > 0 ? ((totalVol - budVol) / budVol) * 100 : 0;
    revPct = budRev > 0 ? ((totalRev - budRev) / budRev) * 100 : 0;
    gpPct = budGP > 0 ? ((totalGP - budGP) / budGP) * 100 : 0;
    prodPct = budProd > 0 ? ((prodVal - budProd) / budProd) * 100 : 0;
    compLabel = "予算比";
  }
  
  updateKPIChange("kpi-vol-val", volPct, compLabel);
  updateKPIChange("kpi-rev-val", revPct, compLabel);
  updateKPIChange("kpi-gp-val", gpPct, compLabel);
  updateKPIChange("kpi-prod-val", prodPct, compLabel === "前週比" ? "生産性向上" : "予算比");
}

// Generate CFO dynamic natural language insights
function generateDynamicInsights() {
  const insightContainer = document.getElementById("dynamic-insight-content");
  if (!insightContainer) return;
  
  // If a specific BU is selected, tailor the comments for that BU
  if (state.selectedBU !== "all") {
    const bu = db.businessUnits.find(b => b.id === state.selectedBU);
    let buComment = "";
    
    // Analyze this BU
    const totalGPThis = bu.metrics.gp.actual_this_week.reduce((a,b) => a+b, 0);
    const totalGPLast = bu.metrics.gp.actual_last_week.reduce((a,b) => a+b, 0);
    const totalGPBudget = bu.metrics.gp.budget.reduce((a,b) => a+b, 0);
    const gpDiff = totalGPThis - totalGPLast;
    
    buComment += `<strong>${bu.name}</strong> の分析レポート：<br/>`;
    buComment += `通期の粗利着地ヨミは現在 <strong>${Math.round(totalGPThis).toLocaleString()} 千円</strong> です。`;
    
    if (gpDiff > 0.01) {
      buComment += ` 今週のアップデートにより、前週ヨミから <strong>+${Math.round(gpDiff).toLocaleString()} 千円良化</strong> しました。`;
    } else if (gpDiff < -0.01) {
      buComment += ` 今週のアップデートにより、前週ヨミから <strong>${Math.round(gpDiff).toLocaleString()} 千円下方修正</strong> されました。`;
    } else {
      buComment += ` 前週からの数値変動はありません。`;
    }
    
    const varBudget = totalGPThis - totalGPBudget;
    const achieveRate = totalGPBudget > 0 ? (totalGPThis / totalGPBudget) * 100 : 100;
    buComment += `<br/>通期予算に対する達成率は <strong>${achieveRate.toFixed(1)}%</strong> であり、`;
    if (varBudget >= 0) {
      buComment += `予算比で <strong>+${Math.round(varBudget).toLocaleString()} 千円のプラス乖離</strong> で推移しています。`;
    } else {
      buComment += `予算比で <strong>${Math.round(varBudget).toLocaleString()} 千円のマイナス乖離</strong> となっています。`;
    }
    
    insightContainer.innerHTML = buComment;
    return;
  }
  
  // All-company analysis (Fintech)
  const changes = [];
  db.businessUnits.forEach(bu => {
    let gpDiffSum = 0;
    let volDiffSum = 0;
    
    for (let m = 0; m < 12; m++) {
      gpDiffSum += bu.metrics.gp.actual_this_week[m] - bu.metrics.gp.actual_last_week[m];
      volDiffSum += bu.metrics.volume.actual_this_week[m] - bu.metrics.volume.actual_last_week[m];
    }
    
    if (Math.abs(gpDiffSum) > 0.1 || Math.abs(volDiffSum) > 0.1) {
      changes.push({
        buName: bu.name,
        gpDiff: gpDiffSum,
        volDiff: volDiffSum
      });
    }
  });
  
  // Let's compute overall company impact
  const weekKey = state.useWeek === "this_week" ? "actual_this_week" : "actual_last_week";
  const prevWeekKey = "actual_last_week";
  
  const thisTotals = calculateTotals(weekKey);
  const prevTotals = calculateTotals(prevWeekKey);
  
  const totalGPThis = thisTotals.gp.actual.reduce((a,b) => a+b, 0);
  const totalGPLast = prevTotals.gp.actual.reduce((a,b) => a+b, 0);
  const totalGPBudget = thisTotals.gp.budget.reduce((a,b) => a+b, 0);
  
  const netDiff = totalGPThis - totalGPLast;
  const achieveRate = totalGPBudget > 0 ? (totalGPThis / totalGPBudget) * 100 : 100;
  
  let insightHTML = "";
  
  if (changes.length === 0) {
    insightHTML = `全グループを通じて、前週比での着地ヨミの変更はありません。現在、フィンテック事業部合計の通期売上総利益は <strong>${Math.round(totalGPThis).toLocaleString()} 千円</strong> （予算達成率 <strong>${achieveRate.toFixed(1)}%</strong>）を見込んでいます。`;
  } else {
    insightHTML += `<strong>今週の主な着地ヨミ変動分析（前週比）：</strong><br/>`;
    
    // Sort changes to show biggest positive or negative
    changes.forEach(c => {
      if (Math.abs(c.gpDiff) > 0.1 || Math.abs(c.volDiff) > 10) {
        let details = [];
        if (Math.abs(c.volDiff) > 10) {
          details.push(`流通総額: ${c.volDiff > 0 ? "+" : ""}${Math.round(c.volDiff).toLocaleString()} 千円`);
        }
        if (Math.abs(c.gpDiff) > 0.1) {
          details.push(`粗利: ${c.gpDiff > 0 ? "+" : ""}${Math.round(c.gpDiff).toLocaleString()} 千円`);
        }
        
        const typeClass = c.gpDiff >= 0 ? "variance-pos" : "variance-neg";
        insightHTML += `・<strong>${c.buName}</strong>: <span class="${typeClass}">${details.join("、")}</span><br/>`;
      }
    });
    
    insightHTML += `<br/><strong>全体影響：</strong><br/>`;
    insightHTML += `フィンテック事業部合計の通期売上総利益は、前週比で <strong>`;
    if (netDiff >= 0) {
      insightHTML += `<span class="variance-pos">+${Math.round(netDiff).toLocaleString()} 千円</span> の良化着地</strong>`;
    } else {
      insightHTML += `<span class="variance-neg">${Math.round(netDiff).toLocaleString()} 千円</span> の下方着地</strong>`;
    }
    insightHTML += `となる見込みです（通期予算達成率: <strong>${achieveRate.toFixed(1)}%</strong>）。`;
  }
  
  insightContainer.innerHTML = insightHTML;
}

// Bind Chart hover tooltips
function bindChartTooltips() {
  const tooltip = document.getElementById("chart-tooltip");
  if (!tooltip) return;
  
  const dots = document.querySelectorAll(".chart-dot");
  dots.forEach(dot => {
    // Avoid double bindings
    dot.removeEventListener("mouseenter", handleDotEnter);
    dot.removeEventListener("mousemove", handleDotMove);
    dot.removeEventListener("mouseleave", handleDotLeave);
    
    dot.addEventListener("mouseenter", handleDotEnter);
    dot.addEventListener("mousemove", handleDotMove);
    dot.addEventListener("mouseleave", handleDotLeave);
  });
}

function handleDotEnter(e) {
  const tooltip = document.getElementById("chart-tooltip");
  if (!tooltip) return;
  const dot = e.target;
  const month = dot.getAttribute("data-month");
  const val = dot.getAttribute("data-value");
  const type = dot.getAttribute("data-type");
  
  tooltip.style.opacity = "1";
  if (type === "productivity") {
    tooltip.innerHTML = `<strong>${month}</strong><br/>一人あたり粗利: ${val} 万円/人`;
  } else {
    tooltip.innerHTML = `<strong>${month}</strong><br/>売上高: ${parseFloat(val.replace(/,/g, '')).toLocaleString()} 千円`;
  }
}

function handleDotMove(e) {
  const tooltip = document.getElementById("chart-tooltip");
  if (!tooltip) return;
  tooltip.style.left = (e.pageX - tooltip.clientWidth / 2) + "px";
  tooltip.style.top = (e.pageY - tooltip.clientHeight - 15) + "px";
}

function handleDotLeave() {
  const tooltip = document.getElementById("chart-tooltip");
  if (!tooltip) return;
  tooltip.style.opacity = "0";
}

// Generate the beautiful BU Grid table HTML
// Helper to dynamically get metric arrays for individual BUs or All-Company totals (with formulas)
function getMetricArray(buId, metricKey, weekKey) {
  const monthsCount = db.months.length;
  
  // Safe helper to extract raw week actuals or budgets
  const getRawData = (id, key) => {
    const bu = db.businessUnits.find(b => b.id === id);
    if (!bu || !bu.metrics[key]) return Array(monthsCount).fill(0);
    if (weekKey === "budget") return bu.metrics[key].budget || Array(monthsCount).fill(0);
    
    const wk = weekKey === "this_week" ? "actual_this_week" : (weekKey === "last_week" ? "actual_last_week" : weekKey);
    return bu.metrics[key][wk] 
           || bu.metrics[key].actual_this_week 
           || bu.metrics[key].budget 
           || Array(monthsCount).fill(0);
  };

  // 1. All-Company total dynamic calculations
  if (buId === "all") {
    // Total Volume
    if (metricKey === "volume") {
      const arr = Array(monthsCount).fill(0);
      db.businessUnits.filter(b => b.parent === "business_unit").forEach(b => {
        const buVals = getMetricArray(b.id, "volume", weekKey);
        for (let i = 0; i < monthsCount; i++) arr[i] += buVals[i];
      });
      return arr;
    }
    // Total Revenue
    if (metricKey === "revenue") {
      const arr = Array(monthsCount).fill(0);
      db.businessUnits.filter(b => b.parent === "business_unit").forEach(b => {
        const buVals = getMetricArray(b.id, "revenue", weekKey);
        for (let i = 0; i < monthsCount; i++) arr[i] += buVals[i];
      });
      return arr;
    }
    // Total Cost
    if (metricKey === "cost") {
      const arr = Array(monthsCount).fill(0);
      db.businessUnits.filter(b => b.parent === "business_unit").forEach(b => {
        const buVals = getMetricArray(b.id, "cost", weekKey);
        for (let i = 0; i < monthsCount; i++) arr[i] += buVals[i];
      });
      return arr;
    }
    // Total GP = Revenue - Cost
    if (metricKey === "gp") {
      const rev = getMetricArray("all", "revenue", weekKey);
      const cost = getMetricArray("all", "cost", weekKey);
      return rev.map((r, i) => r - cost[i]);
    }
    // Total SGA
    if (metricKey === "sga") {
      const arr = Array(monthsCount).fill(0);
      db.businessUnits.forEach(b => {
        const buVals = getMetricArray(b.id, "sga", weekKey);
        for (let i = 0; i < monthsCount; i++) arr[i] += buVals[i];
      });
      return arr;
    }
    // Total OP = GP - SGA
    if (metricKey === "op") {
      const gp = getMetricArray("all", "gp", weekKey);
      const sga = getMetricArray("all", "sga", weekKey);
      return gp.map((g, i) => g - sga[i]);
    }
    // Total Fin Rev
    if (metricKey === "fin_rev") {
      const arr = Array(monthsCount).fill(0);
      db.businessUnits.forEach(b => {
        const buVals = getMetricArray(b.id, "fin_rev", weekKey);
        for (let i = 0; i < monthsCount; i++) arr[i] += buVals[i];
      });
      return arr;
    }
    // Total Fin Cost
    if (metricKey === "fin_cost") {
      const arr = Array(monthsCount).fill(0);
      db.businessUnits.forEach(b => {
        const buVals = getMetricArray(b.id, "fin_cost", weekKey);
        for (let i = 0; i < monthsCount; i++) arr[i] += buVals[i];
      });
      return arr;
    }
    // Total Net Income = OP + Fin Rev - Fin Cost
    if (metricKey === "net_income") {
      const op = getMetricArray("all", "op", weekKey);
      const finRev = getMetricArray("all", "fin_rev", weekKey);
      const finCost = getMetricArray("all", "fin_cost", weekKey);
      return op.map((o, i) => o + finRev[i] - finCost[i]);
    }
    // Total Headcount
    if (metricKey === "headcount") {
      const arr = Array(monthsCount).fill(0);
      db.businessUnits.forEach(b => {
        const buVals = getRawData(b.id, "headcount");
        for (let i = 0; i < monthsCount; i++) arr[i] += buVals[i];
      });
      return arr;
    }
    // Total Productivity = GP / Headcount
    if (metricKey === "productivity") {
      const gp = getMetricArray("all", "gp", weekKey);
      const hc = getMetricArray("all", "headcount", weekKey);
      return gp.map((g, i) => g / (hc[i] || 1));
    }
  }

  // 2. Individual sub-unit dynamic calculations
  // Cost = Revenue - GP
  if (metricKey === "cost") {
    const rev = getRawData(buId, "revenue");
    const gp = getRawData(buId, "gp");
    return rev.map((r, i) => r - gp[i]);
  }
  // OP = GP - SGA
  if (metricKey === "op") {
    const gp = getRawData(buId, "gp");
    const sga = getRawData(buId, "sga");
    return gp.map((g, i) => g - sga[i]);
  }
  // Net Income = OP + Fin Rev - Fin Cost
  if (metricKey === "net_income") {
    const op = getMetricArray(buId, "op", weekKey);
    const finRev = getRawData(buId, "fin_rev");
    const finCost = getRawData(buId, "fin_cost");
    return op.map((o, i) => o + finRev[i] - finCost[i]);
  }
  // Productivity = GP / Headcount
  if (metricKey === "productivity") {
    const gp = getRawData(buId, "gp");
    const hc = getRawData(buId, "headcount");
    return gp.map((g, i) => g / (hc[i] || 1));
  }

  // 3. Return raw metric array (Volume, Revenue, GP, SGA, Fin Rev, Fin Cost, Headcount)
  return getRawData(buId, metricKey);
}

function generateBUGrid() {
  const tableContainer = document.getElementById("bu-grid-table-container");
  if (!tableContainer) return;
  
  const weekKey = state.useWeek === "this_week" ? "actual_this_week" : "actual_last_week";
  const prevWeekKey = "actual_last_week";
  
  let html = `
    <table class="data-table">
      <thead>
        <tr class="header-row">
          <th style="min-width: 180px; position: sticky; left: 0; z-index: 20; background: rgba(15, 22, 42, 0.95);">指標 / 部門・グループ</th>
          <th style="min-width: 80px; position: sticky; left: 180px; z-index: 20; background: rgba(15, 22, 42, 0.95);">区分</th>
          <th>通期</th>
          ${db.months.map(m => `<th>${m.name.split("/")[1]}月${m.isActual ? '<span style="font-size:0.6rem;color:var(--accent-blue);display:block;">実績</span>' : '<span style="font-size:0.6rem;color:var(--text-muted);display:block;">ヨミ</span>'}</th>`).join("")}
          <th>1Q</th>
          <th>2Q</th>
          <th>3Q</th>
          <th>4Q</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  const buItems = [
    { id: "all", name: "全社合計" },
    { id: "bu_gov", name: "BizDevG(給付金)" },
    { id: "bu_gift", name: "株主優待G" },
    { id: "bu_pay", name: "報酬支払G" },
    { id: "bu_point", name: "ポイントG" },
    { id: "bu_fact", name: "ファクタリングG" },
    { id: "bu_dg", name: "デジタル＆" }
  ];

  const fullItems = [
    { id: "all", name: "全社合計" },
    { id: "bu_gov", name: "BizDevG(給付金)" },
    { id: "bu_gift", name: "株主優待G" },
    { id: "bu_pay", name: "報酬支払G" },
    { id: "bu_point", name: "ポイントG" },
    { id: "bu_fact", name: "ファクタリングG" },
    { id: "bu_dg", name: "デジタル＆" },
    { id: "bu_ops", name: "オペレーションG" },
    { id: "bu_dg_gift", name: "デジタルギフト" },
    { id: "bu_dg_wallet", name: "デジタルウォレット" },
    { id: "bu_corp_hq", name: "管理本部" },
    { id: "bu_corp_rc", name: "リスコン" },
    { id: "bu_corp_pres", name: "社長室" }
  ];

  const categories = [
    { name: "流通総額", key: "volume", items: buItems },
    { name: "売上高", key: "revenue", items: buItems },
    { name: "売上原価", key: "cost", items: buItems },
    { name: "売上総利益", key: "gp", items: buItems },
    { name: "販管費", key: "sga", items: fullItems },
    { name: "営業利益", key: "op", items: fullItems },
    { name: "金融収益", key: "fin_rev", items: fullItems },
    { name: "金融費用", key: "fin_cost", items: fullItems },
    { name: "税前純利益", key: "net_income", items: fullItems },
    { name: "【参考】直雇用社員数", key: "headcount", items: fullItems },
    { name: "【参考】一人あたり粗利", key: "productivity", items: buItems }
  ];

  categories.forEach(cat => {
    // Header for each category
    html += `
      <tr class="bu-header" style="background: rgba(0, 180, 216, 0.08); border-top: 2px solid rgba(0, 180, 216, 0.25);">
        <td colspan="19" style="font-weight: 700; color: #fff; font-size: 0.95rem; letter-spacing: 0.5px;">
          <i class="fa-solid fa-folder-open" style="margin-right:0.5rem; color:var(--accent-blue);"></i>${cat.name}
        </td>
      </tr>
    `;

    cat.items.forEach(item => {
      const isTotalRow = item.id === "all";
      const itemRowClass = isTotalRow ? "total-row" : "";
      
      const renderRow = (typeLabel, rowClass, valFunc, formatFunc) => {
        // Calculate dynamic summary metrics
        let annualVal = 0;
        let q1Val = 0, q2Val = 0, q3Val = 0, q4Val = 0;

        if (cat.key === "productivity") {
          // Productivity = GP sum / Headcount average
          const gpArr = typeLabel === "予算" ? getMetricArray(item.id, "gp", "budget") : getMetricArray(item.id, weekKey);
          const hcArr = typeLabel === "予算" ? getMetricArray(item.id, "headcount", "budget") : getMetricArray(item.id, weekKey);
          
          const getProdForRange = (start, end) => {
            let gpSum = 0, hcSum = 0;
            for (let i = start; i <= end; i++) {
              gpSum += gpArr[i];
              hcSum += hcArr[i];
            }
            const hcAvg = hcSum / (end - start + 1);
            return hcAvg > 0 ? gpSum / hcAvg : 0;
          };

          annualVal = getProdForRange(0, 11);
          q1Val = getProdForRange(0, 2);
          q2Val = getProdForRange(3, 5);
          q3Val = getProdForRange(6, 8);
          q4Val = getProdForRange(9, 11);
        } 
        else if (cat.key === "headcount") {
          // Average for headcount
          const hcArr = typeLabel === "予算" ? getMetricArray(item.id, "headcount", "budget") : getMetricArray(item.id, weekKey);
          
          const getAvgForRange = (start, end) => {
            let sum = 0;
            for (let i = start; i <= end; i++) {
              sum += hcArr[i];
            }
            return sum / (end - start + 1);
          };

          annualVal = getAvgForRange(0, 11);
          q1Val = getAvgForRange(0, 2);
          q2Val = getAvgForRange(3, 5);
          q3Val = getAvgForRange(6, 8);
          q4Val = getAvgForRange(9, 11);
        } 
        else {
          // Sum for volume, revenue, gp, cost, sga, op, fin_rev, fin_cost, net_income
          const arr = typeLabel === "予算" ? getMetricArray(item.id, cat.key, "budget") : getMetricArray(item.id, cat.key, weekKey);
          
          const getSumForRange = (start, end) => {
            let sum = 0;
            for (let i = start; i <= end; i++) {
              sum += arr[i] || 0;
            }
            return sum;
          };

          annualVal = getSumForRange(0, 11);
          q1Val = getSumForRange(0, 2);
          q2Val = getSumForRange(3, 5);
          q3Val = getSumForRange(6, 8);
          q4Val = getSumForRange(9, 11);
        }

        let monthTds = "";
        for (let m = 0; m < 12; m++) {
          const val = valFunc(m);
          
          let changedClass = "";
          if (state.highlightChanges && typeLabel === "実績" && m >= db.confirmedMonth) {
            const thisWeekVal = getMetricArray(item.id, cat.key, weekKey)[m];
            const lastWeekVal = getMetricArray(item.id, cat.key, prevWeekKey)[m];
            if (thisWeekVal !== lastWeekVal) {
              changedClass = "cell-highlight-changed";
            }
          }
          
          monthTds += `<td class="numeric ${rowClass} ${changedClass}">${formatFunc(val)}</td>`;
        }

        const indentStyle = isTotalRow ? "font-weight:700; color:var(--text-primary);" : "padding-left: 2rem; color: var(--text-secondary);";
        const totalWeight = isTotalRow ? "font-weight:700;" : "";
        
        return `
          <tr class="metric-row ${itemRowClass}">
            <td style="${indentStyle}; position: sticky; left: 0; z-index: 5; background: rgba(10, 14, 26, 0.95);">${item.name}</td>
            <td style="font-size: 0.75rem; color: var(--text-muted); position: sticky; left: 180px; z-index: 5; background: rgba(10, 14, 26, 0.95);">${typeLabel}</td>
            <td class="numeric ${rowClass}" style="${totalWeight}">${formatFunc(annualVal)}</td>
            ${monthTds}
            <td class="numeric ${rowClass}" style="${totalWeight}">${formatFunc(q1Val)}</td>
            <td class="numeric ${rowClass}" style="${totalWeight}">${formatFunc(q2Val)}</td>
            <td class="numeric ${rowClass}" style="${totalWeight}">${formatFunc(q3Val)}</td>
            <td class="numeric ${rowClass}" style="${totalWeight}">${formatFunc(q4Val)}</td>
          </tr>
        `;
      };

      const formatNormal = (v) => cat.key === "headcount" ? v.toFixed(1) : cat.key === "productivity" ? v.toFixed(1) : Math.round(v).toLocaleString();
      
      const formatVariance = (v) => {
        const rounded = cat.key === "headcount" || cat.key === "productivity" ? v : Math.round(v);
        if (rounded > 0.01) return `<span class="variance-pos">+${formatNormal(rounded)}</span>`;
        if (rounded < -0.01) return `<span class="variance-neg">${formatNormal(rounded)}</span>`;
        return `0`;
      };

      // 1. Budget Row
      html += renderRow("予算", "budget-cell", (m) => {
        if (cat.key === "productivity") {
          const gp = getMetricArray(item.id, "gp", "budget")[m];
          const hc = getMetricArray(item.id, "headcount", "budget")[m];
          return gp / (hc || 1);
        }
        return getMetricArray(item.id, cat.key, "budget")[m];
      }, formatNormal);

      // 2. Actual Row
      html += renderRow("実績", "actual-cell", (m) => {
        if (cat.key === "productivity") {
          const gp = getMetricArray(item.id, "gp", weekKey)[m];
          const hc = getMetricArray(item.id, "headcount", weekKey)[m];
          return gp / (hc || 1);
        }
        return getMetricArray(item.id, cat.key, weekKey)[m];
      }, formatNormal);

      // 3. Variance Row
      html += renderRow("差額", "variance-cell", (m) => {
        if (cat.key === "productivity") {
          const actGp = getMetricArray(item.id, "gp", weekKey)[m];
          const actHc = getMetricArray(item.id, "headcount", weekKey)[m];
          const act = actGp / (actHc || 1);
          
          const budGp = getMetricArray(item.id, "gp", "budget")[m];
          const budHc = getMetricArray(item.id, "headcount", "budget")[m];
          const bud = budGp / (budHc || 1);
          return act - bud;
        }
        return getMetricArray(item.id, cat.key, weekKey)[m] - getMetricArray(item.id, cat.key, "budget")[m];
      }, formatVariance);

      // 4. WoW Change Row
      html += renderRow("前週比", "wow-cell", (m) => {
        if (cat.key === "productivity") {
          const actThisGp = getMetricArray(item.id, "gp", weekKey)[m];
          const actThisHc = getMetricArray(item.id, "headcount", weekKey)[m];
          const actThis = actThisGp / (actThisHc || 1);
          
          const actLastGp = getMetricArray(item.id, "gp", prevWeekKey)[m];
          const actLastHc = getMetricArray(item.id, "headcount", prevWeekKey)[m];
          const actLast = actLastGp / (actLastHc || 1);
          return actThis - actLast;
        }
        return getMetricArray(item.id, cat.key, weekKey)[m] - getMetricArray(item.id, cat.key, prevWeekKey)[m];
      }, formatVariance);
    });
  });

  html += `
      </tbody>
    </table>
  `;
  
  tableContainer.innerHTML = html;
}


// ==========================================================================
// 5. 取引領域マッピングマスタ (動的CRUD & localStorage連動)
// ==========================================================================

const DEFAULT_MAPPING_RULES = [
  { id: "rule_1", account: "5301", partnerCode: "100006188", partnerName: "サーバー費(給付金)", targetBU: "bu_gov" },
  { id: "rule_2", account: "5206", partnerCode: "300000550", partnerName: "優待カード配送費", targetBU: "bu_gift" },
  { id: "rule_3", account: "4113", partnerCode: "100001122", partnerName: "報酬支払手数料", targetBU: "bu_pay" },
  { id: "rule_4", account: "5206", partnerCode: "300001438", partnerName: "ポイント追加手数料", targetBU: "bu_point" },
  { id: "rule_5", account: "6226", partnerCode: "300001393", partnerName: "ファクタリング回収費", targetBU: "bu_fact" },
  { id: "rule_6", account: "6226", partnerCode: "300001450", partnerName: "デジタル広告宣伝費", targetBU: "bu_dg" },
  { id: "rule_7", account: "4110", partnerCode: "100007519", partnerName: "管掌人件費", targetBU: "bu_ops" }
];

function loadMappingRules() {
  const local = localStorage.getItem("dp_mapping_rules");
  if (local) {
    return JSON.parse(local);
  }
  localStorage.setItem("dp_mapping_rules", JSON.stringify(DEFAULT_MAPPING_RULES));
  return DEFAULT_MAPPING_RULES;
}

function saveMappingRules(rules) {
  localStorage.setItem("dp_mapping_rules", JSON.stringify(rules));
}

function renderMappingMaster() {
  const tbody = document.getElementById("mapping-master-tbody");
  if (!tbody) return;
  
  const rules = loadMappingRules();
  tbody.innerHTML = "";
  
  const buNameMap = {
    "bu_gov": "BizDevG(給付金)",
    "bu_gift": "株主優待G",
    "bu_pay": "報酬支払G",
    "bu_point": "ポイントG",
    "bu_fact": "ファクタリングG",
    "bu_dg": "デジタル＆",
    "bu_ops": "オペレーションG"
  };
  
  rules.forEach(rule => {
    const buName = buNameMap[rule.targetBU] || rule.targetBU;
    tbody.innerHTML += `
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
        <td style="padding: 0.5rem 0.75rem;">${rule.account}</td>
        <td style="padding: 0.5rem 0.75rem;">${rule.partnerCode}</td>
        <td style="padding: 0.5rem 0.75rem; color: var(--text-secondary);">${rule.partnerName}</td>
        <td style="padding: 0.5rem 0.75rem; color: var(--accent-blue); font-weight: 500;">${buName}</td>
        <td style="padding: 0.5rem 0.75rem; text-align: center;">
          <button class="btn-delete-row" data-id="${rule.id}"><i class="fa-solid fa-trash-can"></i></button>
        </td>
      </tr>
    `;
  });
  
  // Bind delete events
  tbody.querySelectorAll(".btn-delete-row").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      deleteMappingRule(id);
    });
  });
}

function addMappingRule(account, partnerCode, partnerName, targetBU) {
  const rules = loadMappingRules();
  // Check if exists
  const exists = rules.some(r => r.account === account && r.partnerCode === partnerCode);
  if (exists) {
    alert("この【勘定科目×取引先コード】のルールは既に登録されています！");
    return false;
  }
  
  const newRule = {
    id: "rule_" + Date.now(),
    account: account,
    partnerCode: partnerCode,
    partnerName: partnerName,
    targetBU: targetBU
  };
  rules.push(newRule);
  saveMappingRules(rules);
  renderMappingMaster();
  return true;
}

function deleteMappingRule(id) {
  let rules = loadMappingRules();
  rules = rules.filter(r => r.id !== id);
  saveMappingRules(rules);
  renderMappingMaster();
}

// ==========================================================================
// 6. 実績インポート ＆ 自動按分仕分けシミュレーション
// ==========================================================================

const MOCK_RAW_TRANSACTIONS = [
  { row: 120, name: "デジタルプラス広告経費", partnerCode: "300001450", account: "6226", value: 50000 },
  { row: 121, name: "給付金サーバー構築費用", partnerCode: "100006188", account: "5301", value: 140023 },
  { row: 122, name: "ファクタリング回収手数料", partnerCode: "300001393", account: "6226", value: 23174 },
  { row: 123, name: "株主優待販促費(共通分)", partnerCode: "300000594", account: "5206", value: 300000 }, // Needs 50:50 allocation split!
  { row: 124, name: "ドマネポイント追加手数料", partnerCode: "300001438", account: "5206", value: 4789 },
  { row: 125, name: "オペレーションG共通人件費", partnerCode: "100007519", account: "4110", value: 1320000 },
  { row: 126, name: "未分類の新規システム発注費", partnerCode: "999999999", account: "5301", value: 450000 } // Unallocated rule alert!
];

let unallocatedTransactions = [];
let activeAllocationRow = null;

function startImportSimulation() {
  if (state.isImporting) return;
  
  state.isImporting = true;
  state.importProgress = 0;
  
  const btn = document.getElementById("import-trigger-btn");
  const progressText = document.getElementById("import-progress-text");
  const rawList = document.getElementById("sim-raw-list");
  const processList = document.getElementById("sim-process-list");
  
  if (btn) btn.disabled = true;
  rawList.innerHTML = "";
  processList.innerHTML = "";
  
  // Show raw inputs (A, C, I columns empty)
  MOCK_RAW_TRANSACTIONS.forEach(item => {
    rawList.innerHTML += `
      <div class="sim-item">
        <span>Row ${item.row} : ${item.name}</span>
        <span style="color: var(--text-muted);">Partner:${item.partnerCode} | Acc:${item.account} | Val: ¥${item.value.toLocaleString()}</span>
      </div>
    `;
  });
  
  const rules = loadMappingRules();
  
  const interval = setInterval(() => {
    state.importProgress += 20;
    progressText.innerText = `自動仕分け処理中: ${state.importProgress}%`;
    
    if (state.importProgress === 20) {
      processList.innerHTML += `<div class="sim-item processed">取引先マスタデータベースの結合スキャンを開始しました...</div>`;
    } 
    else if (state.importProgress === 40) {
      // Direct Allocated items
      MOCK_RAW_TRANSACTIONS.forEach(tx => {
        if (tx.partnerCode === "300000594") return; // split
        
        const match = rules.find(r => r.account === tx.account && r.partnerCode === tx.partnerCode);
        if (match) {
          const buNameMap = { "bu_gov":"給付金G", "bu_gift":"優待G", "bu_pay":"報酬支払G", "bu_point":"ポイントG", "bu_fact":"ファクタG", "bu_dg":"デジタル＆", "bu_ops":"オペG" };
          processList.innerHTML += `
            <div class="sim-item processed badge-allocated" style="margin-bottom:0.25rem;">
              <span>Row ${tx.row} 自動判定 ➔ ${buNameMap[match.targetBU]}</span>
              <span>¥${tx.value.toLocaleString()}</span>
            </div>
          `;
        }
      });
    } 
    else if (state.importProgress === 60) {
      // Allocation Splits (e.g. Row 123)
      const splitTx = MOCK_RAW_TRANSACTIONS.find(tx => tx.partnerCode === "300000594");
      if (splitTx) {
        processList.innerHTML += `
          <div class="sim-item processed badge-split" style="margin-bottom:0.25rem;">
            <span>Row ${splitTx.row} 共通費 ➔ [株主優待G 50% / オペレーションG 50%] 自動配賦定義を適用</span>
            <span>¥${splitTx.value.toLocaleString()}</span>
          </div>
        `;
        processList.innerHTML += `<div class="sim-item allocated" style="margin-left:1.5rem; border-left-color:var(--accent-purple); font-size:0.75rem;">➔ [株主優待G] へ ¥${(splitTx.value * 0.5).toLocaleString()} 自動配賦</div>`;
        processList.innerHTML += `<div class="sim-item allocated" style="margin-left:1.5rem; border-left-color:var(--accent-purple); font-size:0.75rem;">➔ [オペレーションG] へ ¥${(splitTx.value * 0.5).toLocaleString()} 自動配賦</div>`;
      }
    } 
    else if (state.importProgress === 80) {
      // Find unallocated transactions (errors/missing)
      unallocatedTransactions = [];
      MOCK_RAW_TRANSACTIONS.forEach(tx => {
        if (tx.partnerCode === "300000594") return; // split
        
        const match = rules.find(r => r.account === tx.account && r.partnerCode === tx.partnerCode);
        if (!match) {
          unallocatedTransactions.push(tx);
          processList.innerHTML += `
            <div class="sim-item processed badge-unallocated" style="margin-bottom:0.25rem; align-items:center;" id="unallocated-row-${tx.row}">
              <span style="display:flex; flex-direction:column; text-align:left;">
                <strong>Row ${tx.row} 未分類アラート! [マスタ未登録]</strong>
                <span style="font-size:0.7rem; color:rgba(255,255,255,0.6);">Code: ${tx.partnerCode} | Acc: ${tx.account} (${tx.name})</span>
              </span>
              <button class="btn-action-sm" onclick="openInstantAllocationModal(${tx.row})">
                <i class="fa-solid fa-link"></i> 領域を割り振る
              </button>
            </div>
          `;
        }
      });
      
      if (unallocatedTransactions.length === 0) {
        processList.innerHTML += `<div class="sim-item processed badge-allocated" style="font-weight:600; justify-content:center;">すべての仕分け対象取引がマスタに適合しました！</div>`;
      } else {
        processList.innerHTML += `<div class="sim-item processed badge-unallocated" style="font-weight:600; justify-content:center;">警告: 未登録の取引が ${unallocatedTransactions.length} 件検出されました。画面から割り振ってください。</div>`;
      }
    } 
    else if (state.importProgress === 100) {
      clearInterval(interval);
      state.isImporting = false;
      if (btn) btn.disabled = false;
      
      if (unallocatedTransactions.length > 0) {
        progressText.innerHTML = `<span style="color:var(--color-warning);"><i class="fa-solid fa-triangle-exclamation"></i> 未分類取引の解決をお待ちしています（領域を割り振ってください）</span>`;
      } else {
        completeImportProcess();
      }
    }
  }, 800);
}

function openInstantAllocationModal(row) {
  const tx = MOCK_RAW_TRANSACTIONS.find(t => t.row === row);
  if (!tx) return;
  
  activeAllocationRow = row;
  
  document.getElementById("modal-tx-name").innerText = tx.name;
  document.getElementById("modal-tx-partner").innerText = tx.partnerCode;
  document.getElementById("modal-tx-account").innerText = tx.account;
  document.getElementById("modal-tx-value").innerText = "¥" + tx.value.toLocaleString();
  
  document.getElementById("mapping-modal").classList.add("active");
}

// Bind to window to allow HTML inline onclick execution
window.openInstantAllocationModal = openInstantAllocationModal;

function closeAllocationModal() {
  document.getElementById("mapping-modal").classList.remove("active");
  activeAllocationRow = null;
}

function handleModalSubmit(e) {
  e.preventDefault();
  if (!activeAllocationRow) return;
  
  const select = document.getElementById("modal-bu-select");
  const targetBU = select.value;
  
  const tx = MOCK_RAW_TRANSACTIONS.find(t => t.row === activeAllocationRow);
  if (tx) {
    // Add to mapping rules database
    const success = addMappingRule(tx.account, tx.partnerCode, tx.name, targetBU);
    if (success) {
      // Remove from unallocated list
      unallocatedTransactions = unallocatedTransactions.filter(t => t.row !== activeAllocationRow);
      
      // Update UI in simulation log
      const logItem = document.getElementById(`unallocated-row-${tx.row}`);
      if (logItem) {
        const buNameMap = { "bu_gov":"給付金G", "bu_gift":"優待G", "bu_pay":"報酬支払G", "bu_point":"ポイントG", "bu_fact":"ファクタG", "bu_dg":"デジタル＆", "bu_ops":"オペG" };
        logItem.className = "sim-item processed badge-allocated";
        logItem.innerHTML = `
          <span>Row ${tx.row} 手動定義完了 ➔ ${buNameMap[targetBU]} [マスタへ追加]</span>
          <span>¥${tx.value.toLocaleString()}</span>
        `;
      }
      
      closeAllocationModal();
      
      // Check if all unallocated transactions have been solved
      const progressText = document.getElementById("import-progress-text");
      if (unallocatedTransactions.length === 0) {
        const processList = document.getElementById("sim-process-list");
        processList.innerHTML += `<div class="sim-item processed badge-allocated" style="font-weight:600; justify-content:center; margin-top:0.5rem;">未分類取引がすべて解消されました！</div>`;
        completeImportProcess();
      } else if (progressText) {
        progressText.innerHTML = `<span style="color:var(--color-warning);"><i class="fa-solid fa-triangle-exclamation"></i> あと ${unallocatedTransactions.length} 件の未分類取引の割り当てが必要です</span>`;
      }
    }
  }
}

function completeImportProcess() {
  const progressText = document.getElementById("import-progress-text");
  if (progressText) {
    progressText.innerText = "すべての取引の仕分け・自動按分がノーエラーで完了しました！";
  }
  
  // Real dynamic integration to active databases:
  // Convert yen back to Thousands of Yen and add to month 4 (April) actuals
  // 1. Digital & Advertising (Row 120) -> 50,000 Yen = 50.0 Thousand Yen
  db.businessUnits[5].metrics.volume.actual_this_week[4] += 50.0;
  
  // 2. BizDevG Servers (Row 121) -> 140,023 Yen = 140.0 Thousand Yen
  db.businessUnits[0].metrics.volume.actual_this_week[4] += 140.0;
  
  // 3. Factoring Fee (Row 122) -> 23,174 Yen = 23.2 Thousand Yen
  db.businessUnits[4].metrics.volume.actual_this_week[4] += 23.2;
  
  // 4. Split Shared 優待 (Row 123) -> 300,000 split 50:50 = 150,000 Yen = 150.0 Thousand Yen each
  db.businessUnits[1].metrics.volume.actual_this_week[4] += 150.0; // Gift volume
  db.businessUnits[6].metrics.gp.actual_this_week[4] -= 150.0;     // Ops G cost (reduces GP)
  
  // 5. Point Fee (Row 124) -> 4,789 Yen = 4.8 Thousand Yen
  db.businessUnits[3].metrics.volume.actual_this_week[4] += 4.8;
  
  // 6. Ops Human cost (Row 125) -> 1,320,000 Yen = 1320.0 Thousand Yen
  db.businessUnits[6].metrics.gp.actual_this_week[4] -= 1320.0;    // Ops G cost
  
  // 7. Newly mapped system cost (Row 126) -> 450,000 Yen = 450.0 Thousand Yen
  // Find which BU was chosen
  const rules = loadMappingRules();
  const tx126Rule = rules.find(r => r.account === "5301" && r.partnerCode === "999999999");
  if (tx126Rule) {
    const targetBUObj = db.businessUnits.find(b => b.id === tx126Rule.targetBU);
    if (targetBUObj) {
      if (tx126Rule.targetBU === "bu_ops") {
        targetBUObj.metrics.gp.actual_this_week[4] -= 450.0; // reduces GP
      } else {
        targetBUObj.metrics.volume.actual_this_week[4] += 450.0; // adds volume
      }
    }
  }
  
  // Refresh live views & charts!
  drawDashboardChart();
  drawProductivityChart();
  updateKPICards();
  generateDynamicInsights();
  if (state.currentView === "bu_grid") {
    generateBUGrid();
  }
  
  alert("取引のインポート、マスタ自動照合、共通費按分、および未分類仕訳のマスタ新規登録がすべて正常に実行されました！\n最新の実績データおよび一人あたり粗利がダッシュボードへ反映されました。");
}

// Export BU Grid data to CSV dynamically (with UTF-8 BOM to prevent Excel encoding issues)
function exportBUGridToCSV() {
  const weekKey = state.useWeek === "this_week" ? "actual_this_week" : "actual_last_week";
  const prevWeekKey = "actual_last_week";
  let csvContent = "\uFEFF"; // UTF-8 BOM to prevent Excel encoding issues
  
  // Header row
  csvContent += "指標 / 部門・グループ,区分,通期,10月,11月,12月,1月,2月,3月,4月,5月,6月,7月,8月,9月,1Q,2Q,3Q,4Q\n";
  
  const buItems = [
    { id: "all", name: "全社合計" },
    { id: "bu_gov", name: "BizDevG(給付金)" },
    { id: "bu_gift", name: "株主優待G" },
    { id: "bu_pay", name: "報酬支払G" },
    { id: "bu_point", name: "ポイントG" },
    { id: "bu_fact", name: "ファクタリングG" },
    { id: "bu_dg", name: "デジタル＆" }
  ];

  const fullItems = [
    { id: "all", name: "全社合計" },
    { id: "bu_gov", name: "BizDevG(給付金)" },
    { id: "bu_gift", name: "株主優待G" },
    { id: "bu_pay", name: "報酬支払G" },
    { id: "bu_point", name: "ポイントG" },
    { id: "bu_fact", name: "ファクタリングG" },
    { id: "bu_dg", name: "デジタル＆" },
    { id: "bu_ops", name: "オペレーションG" },
    { id: "bu_dg_gift", name: "デジタルギフト" },
    { id: "bu_dg_wallet", name: "デジタルウォレット" },
    { id: "bu_corp_hq", name: "管理本部" },
    { id: "bu_corp_rc", name: "リスコン" },
    { id: "bu_corp_pres", name: "社長室" }
  ];

  const categories = [
    { name: "流通総額", key: "volume", items: buItems },
    { name: "売上高", key: "revenue", items: buItems },
    { name: "売上原価", key: "cost", items: buItems },
    { name: "売上総利益", key: "gp", items: buItems },
    { name: "販管費", key: "sga", items: fullItems },
    { name: "営業利益", key: "op", items: fullItems },
    { name: "金融収益", key: "fin_rev", items: fullItems },
    { name: "金融費用", key: "fin_cost", items: fullItems },
    { name: "税前純利益", key: "net_income", items: fullItems },
    { name: "【参考】直雇用社員数", key: "headcount", items: fullItems },
    { name: "【参考】一人あたり粗利", key: "productivity", items: buItems }
  ];

  categories.forEach(cat => {
    // Category Header row
    csvContent += `"${cat.name}",,,,,,,,,,,,,,,,,,\n`;
    
    cat.items.forEach(item => {
      const getRowCsv = (typeLabel, valFunc) => {
        let row = `"${item.name}","${typeLabel}"`;
        
        // Calculate dynamic summary metrics for CSV
        let annualVal = 0;
        let q1Val = 0, q2Val = 0, q3Val = 0, q4Val = 0;

        if (cat.key === "productivity") {
          const gpArr = typeLabel === "予算" ? getMetricArray(item.id, "gp", "budget") : getMetricArray(item.id, weekKey);
          const hcArr = typeLabel === "予算" ? getMetricArray(item.id, "headcount", "budget") : getMetricArray(item.id, weekKey);
          
          const getProdForRange = (start, end) => {
            let gpSum = 0, hcSum = 0;
            for (let i = start; i <= end; i++) {
              gpSum += gpArr[i];
              hcSum += hcArr[i];
            }
            const hcAvg = hcSum / (end - start + 1);
            return hcAvg > 0 ? gpSum / hcAvg : 0;
          };

          annualVal = getProdForRange(0, 11);
          q1Val = getProdForRange(0, 2);
          q2Val = getProdForRange(3, 5);
          q3Val = getProdForRange(6, 8);
          q4Val = getProdForRange(9, 11);
        } 
        else if (cat.key === "headcount") {
          const hcArr = typeLabel === "予算" ? getMetricArray(item.id, "headcount", "budget") : getMetricArray(item.id, weekKey);
          
          const getAvgForRange = (start, end) => {
            let sum = 0;
            for (let i = start; i <= end; i++) {
              sum += hcArr[i];
            }
            return sum / (end - start + 1);
          };

          annualVal = getAvgForRange(0, 11);
          q1Val = getAvgForRange(0, 2);
          q2Val = getAvgForRange(3, 5);
          q3Val = getAvgForRange(6, 8);
          q4Val = getAvgForRange(9, 11);
        } 
        else {
          const arr = typeLabel === "予算" ? getMetricArray(item.id, cat.key, "budget") : getMetricArray(item.id, cat.key, weekKey);
          
          const getSumForRange = (start, end) => {
            let sum = 0;
            for (let i = start; i <= end; i++) {
              sum += arr[i] || 0;
            }
            return sum;
          };

          annualVal = getSumForRange(0, 11);
          q1Val = getSumForRange(0, 2);
          q2Val = getSumForRange(3, 5);
          q3Val = getSumForRange(6, 8);
          q4Val = getSumForRange(9, 11);
        }

        // Add annual total
        row += `,${cat.key === "headcount" || cat.key === "productivity" ? annualVal.toFixed(1) : Math.round(annualVal)}`;
        
        // Add monthly columns
        for (let m = 0; m < 12; m++) {
          const val = valFunc(m);
          row += `,${cat.key === "headcount" || cat.key === "productivity" ? val.toFixed(1) : Math.round(val)}`;
        }
        
        // Add quarter columns
        row += `,${cat.key === "headcount" || cat.key === "productivity" ? q1Val.toFixed(1) : Math.round(q1Val)}`;
        row += `,${cat.key === "headcount" || cat.key === "productivity" ? q2Val.toFixed(1) : Math.round(q2Val)}`;
        row += `,${cat.key === "headcount" || cat.key === "productivity" ? q3Val.toFixed(1) : Math.round(q3Val)}`;
        row += `,${cat.key === "headcount" || cat.key === "productivity" ? q4Val.toFixed(1) : Math.round(q4Val)}`;
        
        return row + "\n";
      };

      // 1. Budget Row
      csvContent += getRowCsv("予算", (m) => {
        if (cat.key === "productivity") {
          const gp = getMetricArray(item.id, "gp", "budget")[m];
          const hc = getMetricArray(item.id, "headcount", "budget")[m];
          return gp / (hc || 1);
        }
        return getMetricArray(item.id, cat.key, "budget")[m];
      });

      // 2. Actual Row
      csvContent += getRowCsv("実績", (m) => {
        if (cat.key === "productivity") {
          const gp = getMetricArray(item.id, "gp", weekKey)[m];
          const hc = getMetricArray(item.id, "headcount", weekKey)[m];
          return gp / (hc || 1);
        }
        return getMetricArray(item.id, cat.key, weekKey)[m];
      });

      // 3. Variance Row
      csvContent += getRowCsv("差額", (m) => {
        if (cat.key === "productivity") {
          const actGp = getMetricArray(item.id, "gp", weekKey)[m];
          const actHc = getMetricArray(item.id, "headcount", weekKey)[m];
          const act = actGp / (actHc || 1);
          const budGp = getMetricArray(item.id, "gp", "budget")[m];
          const budHc = getMetricArray(item.id, "headcount", "budget")[m];
          const bud = budGp / (budHc || 1);
          return act - bud;
        }
        return getMetricArray(item.id, cat.key, weekKey)[m] - getMetricArray(item.id, cat.key, "budget")[m];
      });

      // 4. WoW Change Row
      csvContent += getRowCsv("前週比", (m) => {
        if (cat.key === "productivity") {
          const actThisGp = getMetricArray(item.id, "gp", weekKey)[m];
          const actThisHc = getMetricArray(item.id, "headcount", weekKey)[m];
          const actThis = actThisGp / (actThisHc || 1);
          const actLastGp = getMetricArray(item.id, "gp", prevWeekKey)[m];
          const actLastHc = getMetricArray(item.id, "headcount", prevWeekKey)[m];
          const actLast = actLastGp / (actLastHc || 1);
          return actThis - actLast;
        }
        return getMetricArray(item.id, cat.key, weekKey)[m] - getMetricArray(item.id, cat.key, prevWeekKey)[m];
      });
    });
  });
  
  // Download action
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `2026年度_予実管理表_${state.useWeek === "this_week" ? "0601" : "0525"}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Navigation & Screen Switcher
function switchView(viewName) {
  state.currentView = viewName;
  
  // Toggle Side Nav active class
  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.remove("active");
    if (item.getAttribute("data-target") === viewName) {
      item.classList.add("active");
    }
  });
  
  // Toggle sections active class
  document.querySelectorAll(".view-section").forEach(sec => {
    sec.classList.remove("active");
  });
  
  const activeSec = document.getElementById(`section-${viewName}`);
  if (activeSec) activeSec.classList.add("active");
  
  // Draw Charts or Tables if needed
  if (viewName === "dashboard") {
    drawDashboardChart();
    drawProductivityChart();
    updateKPICards();
    generateDynamicInsights();
  } else if (viewName === "bu_grid") {
    generateBUGrid();
  } else if (viewName === "config") {
    renderMappingMaster();
  }
}

// Roll forward forecast (月次実績確定シミュレータ)
function simulateRollForward() {
  const monthInput = prompt("実績を確定させる（ヨミを削除して実績に切り替える）月を入力してください（例: 5）", "5");
  if (!monthInput) return;
  
  const mVal = parseInt(monthInput, 10);
  if (isNaN(mVal) || mVal < 1 || mVal > 12) {
    alert("エラー: 有効な月（1〜12）を入力してください。");
    return;
  }
  
  // Determine index in array
  let monthIdx = -1;
  db.months.forEach((m, idx) => {
    if (parseInt(m.name.split("/")[1], 10) === mVal) {
      monthIdx = idx;
    }
  });
  
  if (monthIdx === -1) {
    alert("指定された月が見つかりませんでした。");
    return;
  }
  
  const confirmAction = confirm(`シート内の「${mVal}月」の『ヨミ予測数値』をクリアし、管理部から届いた確定実績データに上書きします。よろしいですか？`);
  if (!confirmAction) return;
  
  // 1. Simulate Clearing Forecast
  db.businessUnits.forEach(bu => {
    bu.metrics.volume.actual_this_week[monthIdx] = 0; // Clear
  });
  generateBUGrid();
  alert(`${mVal}月のヨミ予測データをクリアしました。`);
  
  // 2. Simulate Inserting Confirmed Actuals
  setTimeout(() => {
    db.businessUnits.forEach(bu => {
      // Set to slightly different actual numbers
      bu.metrics.volume.actual_this_week[monthIdx] = bu.metrics.volume.budget[monthIdx] * (0.95 + Math.random() * 0.1);
    });
    db.months[monthIdx].isActual = true; // Mark as actual
    db.confirmedMonth = monthIdx;
    
    // Refresh Everything
    generateBUGrid();
    drawDashboardChart();
    drawProductivityChart();
    alert(`管理部から届いた『${mVal}月確定実績詳細データ』の自動流し込み、およびマスタ紐付けがノーエラーで完了しました！`);
  }, 1500);
}

// Week-over-week Switcher Logic
function setupWoWToggle() {
  const btnThis = document.getElementById("toggle-this-week");
  const btnPrev = document.getElementById("toggle-prev-week");
  
  if (!btnThis || !btnPrev) return;
  
  btnThis.addEventListener("click", () => {
    btnThis.classList.add("active");
    btnPrev.classList.remove("active");
    state.useWeek = "this_week";
    
    // Refresh view
    if (state.currentView === "dashboard") {
      drawDashboardChart();
      drawProductivityChart();
    } else if (state.currentView === "bu_grid") {
      generateBUGrid();
    }
    updateKPICards();
    generateDynamicInsights();
  });
  
  btnPrev.addEventListener("click", () => {
    btnPrev.classList.add("active");
    btnThis.classList.remove("active");
    state.useWeek = "last_week";
    
    // Refresh view
    if (state.currentView === "dashboard") {
      drawDashboardChart();
      drawProductivityChart();
    } else if (state.currentView === "bu_grid") {
      generateBUGrid();
    }
    updateKPICards();
    generateDynamicInsights();
  });
}

// App Initialization
window.addEventListener("DOMContentLoaded", () => {
  // Navigation Links Click
  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => {
      const target = item.getAttribute("data-target");
      switchView(target);
    });
  });
  
  // Initialize switches
  setupWoWToggle();
  
  // Setup BU Selector Listener
  const buSelector = document.getElementById("bu-selector");
  if (buSelector) {
    buSelector.addEventListener("change", (e) => {
      state.selectedBU = e.target.value;
      
      // Update page titles dynamically to show active BU!
      const mainTitle = document.getElementById("page-main-title");
      const subTitle = document.getElementById("page-sub-title");
      
      if (state.selectedBU === "all") {
        if (mainTitle) mainTitle.innerText = "予実管理ダッシュボード";
        if (subTitle) subTitle.innerText = "全社の最新予実・着地ヨミ、生産性の推移を俯瞰します";
      } else {
        const bu = db.businessUnits.find(b => b.id === state.selectedBU);
        if (mainTitle) mainTitle.innerText = `${bu.name} 予実分析`;
        if (subTitle) subTitle.innerText = `${bu.name} の最新予実・着地ヨミ、生産性の推移を詳細分析します`;
      }
      
      // Refresh views
      if (state.currentView === "dashboard") {
        drawDashboardChart();
        drawProductivityChart();
      } else if (state.currentView === "bu_grid") {
        generateBUGrid();
      }
      
      updateKPICards();
      generateDynamicInsights();
    });
  }
  
  // Setup Rollforward simulation trigger
  const rollforwardBtn = document.getElementById("rollforward-trigger-btn");
  if (rollforwardBtn) {
    rollforwardBtn.addEventListener("click", simulateRollForward);
  }
  
  // Setup Import trigger
  const importBtn = document.getElementById("import-trigger-btn");
  if (importBtn) {
    importBtn.addEventListener("click", startImportSimulation);
  }
  
  // Setup Dynamic Master CRUD submission
  const newMappingForm = document.getElementById("new-mapping-form");
  if (newMappingForm) {
    newMappingForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const account = document.getElementById("new-rule-account").value.trim();
      const partnerCode = document.getElementById("new-rule-partner").value.trim();
      const partnerName = document.getElementById("new-rule-name").value.trim();
      const targetBU = document.getElementById("new-rule-bu").value;
      
      const success = addMappingRule(account, partnerCode, partnerName, targetBU);
      if (success) {
        newMappingForm.reset();
        alert("新規マッピングルールをマスタデータベースに正常追加しました！");
      }
    });
  }
  
  // Setup Modal bindings
  const modalClose = document.getElementById("modal-close-btn");
  if (modalClose) {
    modalClose.addEventListener("click", closeAllocationModal);
  }
  
  const modalForm = document.getElementById("modal-mapping-form");
  if (modalForm) {
    modalForm.addEventListener("submit", handleModalSubmit);
  }
  
  // Setup CSV Export trigger
  const csvBtn = document.getElementById("csv-export-btn");
  if (csvBtn) {
    csvBtn.addEventListener("click", exportBUGridToCSV);
  }
  
  // Initialize Charts and Grid
  switchView("dashboard");
});


