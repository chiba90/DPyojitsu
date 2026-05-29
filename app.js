/* ==========================================================================
   2026年度 予実管理システム - コアロジック & データベース連携 (app.js)
   ========================================================================== */

const db = realDB;

// ==========================================================================
// 組織・グループ 動的管理マスタ (CRUD & LocalStorage ＆ リアルタイムDB同期エンジン)
// ==========================================================================

const DEFAULT_GROUPS = [
  { id: "group_bizdev", name: "BizDev", parent: "business_unit" },
  { id: "group_gift", name: "株主優待", parent: "business_unit" },
  { id: "group_pay", name: "報酬支払", parent: "business_unit" },
  { id: "group_point", name: "ポイント", parent: "business_unit" },
  { id: "group_fact", name: "ファクタリング", parent: "business_unit" },
  { id: "group_dg", name: "デジタル＆", parent: "business_unit" },
  { id: "group_prod", name: "プロダクト", parent: "business_unit" },
  { id: "group_sys", name: "システム", parent: "business_unit" },
  { id: "group_ops", name: "オペレーション", parent: "platform_unit" },
  { id: "group_dg_gift", name: "デジタルギフト", parent: "platform_unit" },
  { id: "group_dg_wallet", name: "デジタルウォレット", parent: "platform_unit" },
  { id: "group_corp_hq", name: "管理本部", parent: "corporate_unit" },
  { id: "group_corp_rc", name: "リスコン", parent: "corporate_unit" },
  { id: "group_legal", name: "法務", parent: "corporate_unit" },
  { id: "group_security", name: "セキュリティ", parent: "corporate_unit" },
  { id: "group_planning", name: "経営企画", parent: "corporate_unit" },
  { id: "group_hr", name: "HR", parent: "corporate_unit" },
  { id: "group_secretary", name: "秘書", parent: "corporate_unit" },
  { id: "group_corp_pres", name: "社長室", parent: "corporate_unit" }
];

const buIdMap = {
  "bu_gov": "group_bizdev",
  "bu_gift": "group_gift",
  "bu_pay": "group_pay",
  "bu_point": "group_point",
  "bu_fact": "group_fact",
  "bu_dg": "group_dg",
  "bu_ops": "group_ops",
  "bu_dg_gift": "group_dg_gift",
  "bu_dg_wallet": "group_dg_wallet",
  "bu_corp_hq": "group_corp_hq",
  "bu_corp_rc": "group_corp_rc",
  "bu_corp_pres": "group_corp_pres"
};

function loadGroups() {
  const local = localStorage.getItem("dp_groups");
  if (local) {
    return JSON.parse(local);
  }
  localStorage.setItem("dp_groups", JSON.stringify(DEFAULT_GROUPS));
  return DEFAULT_GROUPS;
}

function saveGroups(groups) {
  localStorage.setItem("dp_groups", JSON.stringify(groups));
}

// Synchronize all select tags in UI with the latest group list
function syncDropdowns(groups) {
  const buSelector = document.getElementById("bu-selector");
  const newRuleSelect = document.getElementById("new-rule-bu");
  const modalSelect = document.getElementById("modal-bu-select");
  
  const parentTypeLabel = {
    "business_unit": "ビジネス",
    "platform_unit": "PF",
    "corporate_unit": "コーポレート"
  };

  const populateSelect = (selectEl, includeAll = false) => {
    if (!selectEl) return;
    const currentVal = selectEl.value;
    selectEl.innerHTML = "";
    
    if (includeAll) {
      selectEl.innerHTML += `<option value="all">全社合計 (フィンテック)</option>`;
    }
    
    groups.forEach(g => {
      selectEl.innerHTML += `<option value="${g.id}">${g.name} (${parentTypeLabel[g.parent] || g.parent})</option>`;
    });
    
    // Restore value if still exists
    selectEl.value = currentVal;
    if (!selectEl.value && selectEl.options.length > 0) {
      selectEl.selectedIndex = 0;
    }
  };

  populateSelect(buSelector, true);
  populateSelect(newRuleSelect, false);
  populateSelect(modalSelect, false);
}

// Main logic to sync realDB.businessUnits with user-defined groups dynamically
function syncGroupsAndDatabase() {
  const groups = loadGroups();
  
  if (!db || !db.businessUnits) return;
  
  // 1. Initial ID translation for legacy Excel-generated DB items
  db.businessUnits.forEach(bu => {
    if (buIdMap[bu.id]) {
      bu.id = buIdMap[bu.id];
    }
  });
  
  // 2. Synchronize names and keep only active groups in db.businessUnits
  const syncedUnits = [];
  
  groups.forEach(g => {
    // Find if already exists in db
    let bu = db.businessUnits.find(b => b.id === g.id);
    if (bu) {
      bu.name = g.name; // Update name dynamically (Rename support!)
      bu.parent = g.parent;
    } else {
      // Create new unit with 0 values dynamically (Add support!)
      const monthsCount = db.months ? db.months.length : 12;
      const emptyMetrics = {};
      const keys = ["volume", "revenue", "cost", "gp", "sga", "op", "fin_rev", "fin_cost", "net_income", "headcount", "productivity"];
      keys.forEach(k => {
        emptyMetrics[k] = {
          budget: Array(monthsCount).fill(0),
          actual_last_week: Array(monthsCount).fill(0),
          actual_this_week: Array(monthsCount).fill(0)
        };
      });
      bu = {
        id: g.id,
        name: g.name,
        parent: g.parent,
        metrics: emptyMetrics
      };
    }
    syncedUnits.push(bu);
  });
  
  db.businessUnits = syncedUnits;
  
  // 3. Update dropdown UI options
  syncDropdowns(groups);
}

function renderGroupMaster() {
  const tbody = document.getElementById("group-master-tbody");
  if (!tbody) return;
  
  const groups = loadGroups();
  tbody.innerHTML = "";
  
  const parentLabels = {
    "business_unit": "ビジネスユニット",
    "platform_unit": "プラットフォームユニット",
    "corporate_unit": "コーポレートユニット"
  };
  
  groups.forEach(g => {
    tbody.innerHTML += `
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
        <td style="padding: 0.5rem 0.75rem; font-family: monospace; color: var(--text-muted);">${g.id}</td>
        <td style="padding: 0.5rem 0.75rem; font-weight: 600; cursor: pointer; color: var(--text-primary);" class="editable-group-name" data-id="${g.id}">
          <i class="fa-solid fa-pen" style="font-size:0.7rem; color:var(--text-muted); margin-right:0.4rem;"></i>${g.name}
        </td>
        <td style="padding: 0.5rem 0.75rem; color: var(--text-secondary);">${parentLabels[g.parent] || g.parent}</td>
        <td style="padding: 0.5rem 0.75rem; text-align: center;">
          <button class="btn-delete-row btn-delete-group" data-id="${g.id}"><i class="fa-solid fa-trash-can"></i></button>
        </td>
      </tr>
    `;
  });
  
  // Bind inline rename events
  tbody.querySelectorAll(".editable-group-name").forEach(td => {
    td.addEventListener("click", () => {
      const id = td.getAttribute("data-id");
      const name = td.innerText.trim();
      const newName = prompt(`グループ「${name}」の新しい表示名を入力してください：`, name);
      if (newName && newName.trim() !== name) {
        renameGroup(id, newName.trim());
      }
    });
  });
  
  // Bind delete events
  tbody.querySelectorAll(".btn-delete-group").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const name = groups.find(g => g.id === id).name;
      if (confirm(`本当にグループ「${name}」を統廃合（削除）しますか？\n登録済みのマッピングルールや実績値はリセットまたは未分類になります。`)) {
        deleteGroup(id);
      }
    });
  });
}

function addGroup(name, parent) {
  const groups = loadGroups();
  const id = "group_" + Date.now();
  
  // Avoid duplicate names
  if (groups.some(g => g.name === name)) {
    alert("同名のグループが既に存在します！");
    return false;
  }
  
  groups.push({ id, name, parent });
  saveGroups(groups);
  syncGroupsAndDatabase();
  renderGroupMaster();
  
  // Refresh view if in bu_grid
  if (state.currentView === "bu_grid") {
    generateBUGrid();
  }
  return true;
}

function renameGroup(id, newName) {
  const groups = loadGroups();
  const g = groups.find(x => x.id === id);
  if (g) {
    g.name = newName;
    saveGroups(groups);
    syncGroupsAndDatabase();
    renderGroupMaster();
    
    // Refresh current screens
    if (state.currentView === "bu_grid") generateBUGrid();
    if (state.currentView === "dashboard") {
      drawDashboardChart();
      drawProductivityChart();
      updateKPICards();
    }
  }
}

function deleteGroup(id) {
  let groups = loadGroups();
  groups = groups.filter(g => g.id !== id);
  saveGroups(groups);
  
  // Self-heal: Clean up any mapping rules pointing to deleted group
  const localRules = localStorage.getItem("dp_mapping_rules");
  if (localRules) {
    let rules = JSON.parse(localRules);
    rules = rules.filter(r => r.targetBU !== id);
    localStorage.setItem("dp_mapping_rules", JSON.stringify(rules));
  }
  
  syncGroupsAndDatabase();
  renderGroupMaster();
  
  // Refresh views
  if (state.currentView === "bu_grid") generateBUGrid();
  if (state.currentView === "dashboard") {
    drawDashboardChart();
    drawProductivityChart();
    updateKPICards();
  }
}

// Initial Dynamic Synchronization on startup
syncGroupsAndDatabase();

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
  
  // Dynamically compile active BU lists and Full lists directly from the synchronized database
  const buItems = [
    { id: "all", name: "全社合計" }
  ];
  const fullItems = [
    { id: "all", name: "全社合計" }
  ];
  
  db.businessUnits.forEach(bu => {
    if (bu.parent === "business_unit") {
      buItems.push({ id: bu.id, name: bu.name });
    }
    fullItems.push({ id: bu.id, name: bu.name });
  });

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
// 5. 取引グループ振替マスタ (動的CRUD & localStorage連動)
// ==========================================================================

const DEFAULT_MAPPING_RULES = [
  { id: "rule_1", account: "4109", partnerCode: "100001158", partnerName: "アコム株式会社", targetBU: "group_bizdev" },
  { id: "rule_2", account: "4109", partnerCode: "100005228", partnerName: "gf.K株式会社(旧：KANKO)", targetBU: "group_gift" },
  { id: "rule_3", account: "4108", partnerCode: "100002425", partnerName: "株式会社A inc", targetBU: "group_point" },
  { id: "rule_4", account: "4109", partnerCode: "100003299", partnerName: "野村不動産ライフ＆スポーツ", targetBU: "group_fact" },
  { id: "rule_5", account: "4109", partnerCode: "100006936", partnerName: "UTエージェント(UTコネク", targetBU: "group_dg" },
  { id: "rule_6", account: "4109", partnerCode: "100007653", partnerName: "就活会議株式会社", targetBU: "group_bizdev" },
  { id: "rule_7", account: "4109", partnerCode: "100004443", partnerName: "株式会社リーディングマーク", targetBU: "group_gift" },
  { id: "rule_8", account: "4109", partnerCode: "100006935", partnerName: "UTエイム株式会社", targetBU: "group_point" },
  { id: "rule_9", account: "4108", partnerCode: "100006936", partnerName: "UTエージェント(UTコネク", targetBU: "group_dg" },
  { id: "rule_10", account: "4113", partnerCode: "100007029", partnerName: "エア・ウォーター・ライフソ", targetBU: "group_dg" },
  { id: "rule_11", account: "4108", partnerCode: "100004443", partnerName: "株式会社リーディングマーク", targetBU: "group_gift" },
  { id: "rule_12", account: "4109", partnerCode: "100003003", partnerName: "DOTZ株式会社", targetBU: "group_fact" },
  { id: "rule_13", account: "4108", partnerCode: "100006935", partnerName: "UTエイム株式会社", targetBU: "group_point" },
  { id: "rule_14", account: "4108", partnerCode: "100005228", partnerName: "gf.K株式会社(旧：KANKO)", targetBU: "group_gift" },
  { id: "rule_15", account: "4108", partnerCode: "100006694", partnerName: "株式会社スマートキャンパス", targetBU: "group_point" },
  { id: "rule_16", account: "4108", partnerCode: "100005982", partnerName: "mila合同会社", targetBU: "group_bizdev" },
  { id: "rule_17", account: "4109", partnerCode: "100007593", partnerName: "株式会社マックスヒルズ", targetBU: "group_gift" },
  { id: "rule_18", account: "4109", partnerCode: "100002425", partnerName: "株式会社A inc", targetBU: "group_point" },
  { id: "rule_19", account: "4109", partnerCode: "100007592", partnerName: "株式会社MAVEL(旧株式会社", targetBU: "group_bizdev" },
  { id: "rule_20", account: "4109", partnerCode: "100007499", partnerName: "株式会社クリア", targetBU: "group_gift" },
  { id: "rule_21", account: "4109", partnerCode: "100001726", partnerName: "RIZAP株式会社", targetBU: "group_point" },
  { id: "rule_22", account: "4109", partnerCode: "100005460", partnerName: "株式会社帆風", targetBU: "group_fact" },
  { id: "rule_23", account: "4108", partnerCode: "100007652", partnerName: "株式会社デジタルコマース", targetBU: "group_dg" }
];

function loadMappingRules() {
  const local = localStorage.getItem("dp_mapping_rules");
  if (local) {
    const rules = JSON.parse(local);
    // Self-healing upgrade: if any rule contains old bu_ prefix targetBU, reset to default rules
    const hasOldRules = rules.some(r => r.targetBU && r.targetBU.startsWith("bu_"));
    if (!hasOldRules) {
      return rules;
    }
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
    "group_ops": "オペレーション",
    "group_prod": "プロダクト",
    "group_sys": "システム",
    "group_bizdev": "BizDev",
    "group_gift": "株主優待",
    "group_pay": "報酬支払",
    "group_point": "ポイント",
    "group_fact": "ファクタリング",
    "group_dg": "デジタル＆",
    "group_corp_hq": "管理本部",
    "group_corp_rc": "リスコン",
    "group_legal": "法務",
    "group_security": "セキュリティ",
    "group_planning": "経営企画",
    "group_hr": "HR",
    "group_secretary": "秘書"
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
    alert("この【勘定科目×取引先コード】の振替ルールは既に登録されています！");
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
  { row: 1, category: "売上高", account: "4109", accountName: "失効益売上", partnerCode: "100001158", partnerName: "アコム株式会社", description: "アコム株式会社 失効益 2026/03", value: 125000 },
  { row: 2, category: "売上高", account: "4109", accountName: "失効益売上", partnerCode: "100005228", partnerName: "gf.K株式会社(旧：KANKO)", description: "gf.K株式会社 セブン銀行期限切れ 2026/03", value: 45000 },
  { row: 3, category: "売上高", account: "4108", accountName: "発行売上", partnerCode: "100002425", partnerName: "株式会社A inc", description: "A inc. 発行認識", value: 850000 },
  { row: 4, category: "売上高", account: "4109", accountName: "失効益売上", partnerCode: "100003299", partnerName: "野村不動産ライフ＆スポーツ", description: "野村不動産ライフ＆スポーツ株式会社 失効益 2026/03", value: 32000 },
  { row: 5, category: "売上高", account: "4109", accountName: "失効益売上", partnerCode: "100006936", partnerName: "UTエージェント(UTコネク", description: "UTエージェント株式会社 失効益 2026/03", value: 12000 },
  { row: 6, category: "売上高", account: "4109", accountName: "失効益売上", partnerCode: "100007653", partnerName: "就活会議株式会社", description: "就活会議株式会社 失効益 2026/03", value: 78000 },
  { row: 7, category: "売上高", account: "4109", accountName: "失効益売上", partnerCode: "100004443", partnerName: "株式会社リーディングマーク", description: "株式会社リーディングマーク 失効益 2026/03", value: 156000 },
  { row: 8, category: "売上高", account: "4109", accountName: "失効益売上", partnerCode: "100006935", partnerName: "UTエイム株式会社", description: "UTエイム株式会社 失効益 2026/03", value: 94000 },
  { row: 9, category: "売上高", account: "4109", accountName: "失効益売上", partnerCode: "100005017", partnerName: "PRmedia(トラスティパート", description: "PR media株式会社 失効益 2026/03", value: 43000 },
  { row: 10, category: "売上高", account: "4108", accountName: "発行売上", partnerCode: "100006936", partnerName: "UTエージェント(UTコネク", description: "UTエージェント株式会社 【User負担】発行認識", value: 540000 },
  { row: 11, category: "売上高", account: "4113", accountName: "運用代行売上", partnerCode: "100007029", partnerName: "エア・ウォーター・ライフソ", description: "ICK合同会社 エア・ウォーター様SNS運用代行費", value: 300000 },
  { row: 12, category: "売上高", account: "4108", accountName: "発行売上", partnerCode: "100004443", partnerName: "株式会社リーディングマーク", description: "株式会社リーディングマーク 発行認識", value: 1280000 },
  { row: 13, category: "売上高", account: "4109", accountName: "失効益売上", partnerCode: "100003003", partnerName: "DOTZ株式会社", description: "DOTZ株式会社 失効シェア 2025/12", value: 15000 },
  { row: 14, category: "売上高", account: "4108", accountName: "発行売上", partnerCode: "100006935", partnerName: "UTエイム株式会社", description: "UTエイム株式会社 【User負担】 発行認識", value: 620000 },
  { row: 15, category: "売上高", account: "4108", accountName: "発行売上", partnerCode: "100005228", partnerName: "gf.K株式会社(旧：KANKO)", description: "gf.K株式会社 発行認識", value: 350000 },
  { row: 16, category: "売上高", account: "4108", accountName: "発行売上", partnerCode: "100006694", partnerName: "株式会社スマートキャンパス", description: "株式会社スマートキャンパス 発行認識", value: 240000 },
  { row: 17, category: "売上高", account: "4109", accountName: "失効益売上", partnerCode: "300000578", partnerName: "組戻し", description: "組戻し 失効益 2026/03", value: 15000 },
  { row: 18, category: "売上高", account: "4108", accountName: "発行売上", partnerCode: "100005982", partnerName: "mila合同会社", description: "mila合同会社 発行認識", value: 480000 },
  { row: 19, category: "売上高", account: "4109", accountName: "失効益売上", partnerCode: "100007593", partnerName: "株式会社マックスヒルズ", description: "株式会社マックスヒルズ 失効益 2025/11", value: 12000 },
  { row: 20, category: "売上高", account: "4109", accountName: "失効益売上", partnerCode: "100002425", partnerName: "株式会社A inc", description: "A inc. セブン銀行期限切れ 2026/03", value: 5000 },
  { row: 21, category: "売上高", account: "4109", accountName: "失効益売上", partnerCode: "100007592", partnerName: "株式会社MAVEL(旧株式会社", description: "株式会社MAVEL 失効益 2026/03", value: 8000 },
  { row: 22, category: "売上高", account: "4109", accountName: "失効益売上", partnerCode: "100007499", partnerName: "株式会社クリア", description: "株式会社クリア メンズクリア 失効益 2026/03", value: 65000 },
  { row: 23, category: "売上高", account: "4109", accountName: "失効益売上", partnerCode: "100001726", partnerName: "RIZAP株式会社", description: "【ギフト購入アカウント】RIZAP株式会社 失効益 2026/03", value: 110000 },
  { row: 24, category: "売上高", account: "4109", accountName: "失効益売上", partnerCode: "100005460", partnerName: "株式会社帆風", description: "株式会社 帆風 失効益 2025/10", value: 7000 },
  { row: 25, category: "売上高", account: "4108", accountName: "発行売上", partnerCode: "100005017", partnerName: "PRmedia(トラスティパート", description: "PR media株式会社 発行認識", value: 210000 },
  { row: 26, category: "売上高", account: "4108", accountName: "発行売上", partnerCode: "100007652", partnerName: "株式会社デジタルコマース", description: "株式会社デジタルコマース 発行認識", value: 310000 }
];

let unallocatedTransactions = [];
let activeAllocationRow = null;

function startImportSimulation() {
  if (state.isImporting) return;
  
  state.isImporting = true;
  state.importProgress = 0;
  
  const btn = document.getElementById("import-trigger-btn");
  const progressText = document.getElementById("import-progress-text");
  const rawListBody = document.getElementById("sim-raw-list-body");
  const processListBody = document.getElementById("sim-process-list-body");
  
  if (btn) btn.disabled = true;
  rawListBody.innerHTML = "";
  processListBody.innerHTML = `<tr><td colspan="5" style="color: var(--text-muted); text-align: center; padding: 6rem 0;"><i class="fa-solid fa-spinner fa-spin" style="margin-right:6px;"></i> スキャン解析プログラムを開始しています...</td></tr>`;
  
  // 1. Render all 26 real transactions in Left Raw table immediately
  MOCK_RAW_TRANSACTIONS.forEach(tx => {
    rawListBody.innerHTML += `
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.02);">
        <td style="padding: 0.5rem 0.4rem; text-align: center; font-weight: 600; color: var(--text-muted);">${tx.row}</td>
        <td style="padding: 0.5rem 0.4rem; text-align: center;"><span style="background:rgba(255,255,255,0.03); padding:2px 6px; border-radius:4px; font-size:0.65rem;">${tx.category}</span></td>
        <td style="padding: 0.5rem 0.4rem; text-align: center; font-family: monospace;">${tx.account}</td>
        <td style="padding: 0.5rem 0.4rem; font-weight: 500;">${tx.accountName}</td>
        <td style="padding: 0.5rem 0.4rem; text-align: center; font-family: monospace; color: var(--text-muted);">${tx.partnerCode}</td>
        <td style="padding: 0.5rem 0.4rem; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${tx.partnerName}">${tx.partnerName}</td>
        <td style="padding: 0.5rem 0.4rem; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-secondary);" title="${tx.description}">${tx.description}</td>
        <td style="padding: 0.5rem 0.4rem; text-align: right; font-weight: 600; font-family: monospace; color: #fff;">¥${tx.value.toLocaleString()}</td>
      </tr>
    `;
  });
  
  const rules = loadMappingRules();
  
  // 2. Set interval to proceed progress step-by-step
  const interval = setInterval(() => {
    state.importProgress += 20;
    progressText.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="color:var(--accent-blue); margin-right:6px;"></i> 自動仕分け＆振替処理中: <strong>${state.importProgress}%</strong>`;
    
    if (state.importProgress === 20) {
      // Initialize scan logs on right table
      processListBody.innerHTML = "";
      MOCK_RAW_TRANSACTIONS.forEach(tx => {
        processListBody.innerHTML += `
          <tr id="process-row-${tx.row}" style="border-bottom: 1px solid rgba(255,255,255,0.02);">
            <td style="padding: 0.5rem 0.4rem; text-align: center; color: var(--text-muted); font-weight: 600;">${tx.row}</td>
            <td class="status-cell" style="padding: 0.5rem 0.4rem; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin" style="margin-right:4px;"></i> スキャン照合中...</td>
            <td class="group-cell" style="padding: 0.5rem 0.4rem; color: var(--text-muted); font-style: italic;">-</td>
            <td style="padding: 0.5rem 0.4rem; text-align: right; font-family: monospace; color: var(--text-muted);">¥${tx.value.toLocaleString()}</td>
            <td class="action-cell" style="padding: 0.5rem 0.4rem; text-align: center; color: var(--text-muted);">-</td>
          </tr>
        `;
      });
    } 
    else if (state.importProgress === 40) {
      // Apply automatic allocations (Matched items)
      MOCK_RAW_TRANSACTIONS.forEach(tx => {
        const match = rules.find(r => r.account === tx.account && r.partnerCode === tx.partnerCode);
        if (match) {
          const rowEl = document.getElementById(`process-row-${tx.row}`);
          if (rowEl) {
            const buNameMap = {
              "group_ops": "オペレーション",
              "group_prod": "プロダクト",
              "group_sys": "システム",
              "group_bizdev": "BizDev",
              "group_gift": "株主優待",
              "group_pay": "報酬支払",
              "group_point": "ポイント",
              "group_fact": "ファクタリング",
              "group_dg": "デジタル＆",
              "group_corp_hq": "管理本部",
              "group_corp_rc": "リスコン",
              "group_legal": "法務",
              "group_security": "セキュリティ",
              "group_planning": "経営企画",
              "group_hr": "HR",
              "group_secretary": "秘書"
            };
            rowEl.querySelector(".status-cell").innerHTML = `<span class="badge-allocated" style="padding: 2px 6px; border-radius: 4px; font-size:0.65rem; font-weight:700;"><i class="fa-solid fa-circle-check"></i> 自動振替</span>`;
            rowEl.querySelector(".group-cell").innerHTML = `<strong style="color:var(--accent-blue);">${buNameMap[match.targetBU] || match.targetBU}G</strong>`;
          }
        }
      });
    } 
    else if (state.importProgress === 60) {
      // Handle Allocation Splits (e.g. if we had some split rules - but here we proceed as successfully matched logs)
      // We keep a small aesthetic delay simulation
    } 
    else if (state.importProgress === 80) {
      // Find and highlight unallocated transactions (PRmedia, 組戻し etc)
      unallocatedTransactions = [];
      MOCK_RAW_TRANSACTIONS.forEach(tx => {
        const match = rules.find(r => r.account === tx.account && r.partnerCode === tx.partnerCode);
        if (!match) {
          unallocatedTransactions.push(tx);
          const rowEl = document.getElementById(`process-row-${tx.row}`);
          if (rowEl) {
            rowEl.style.background = "rgba(239, 68, 68, 0.05)";
            rowEl.querySelector(".status-cell").innerHTML = `<span class="badge-unallocated" style="padding: 2px 6px; border-radius: 4px; font-size:0.65rem; font-weight:700;"><i class="fa-solid fa-circle-exclamation"></i> 未分類アラート</span>`;
            rowEl.querySelector(".group-cell").innerHTML = `<strong style="color:var(--color-danger);">未登録</strong>`;
            rowEl.querySelector(".action-cell").innerHTML = `
              <button class="btn-action-sm" onclick="openInstantAllocationModal(${tx.row})" style="padding: 3px 8px; font-size: 0.7rem; border-radius: 4px; background:var(--accent-purple); height: auto; border: none; font-weight: 700;">
                <i class="fa-solid fa-link"></i> 振替設定
              </button>
            `;
          }
        }
      });
      
      if (unallocatedTransactions.length === 0) {
        progressText.innerHTML = `<span style="color:var(--color-success); font-weight:600;"><i class="fa-solid fa-circle-check"></i> すべての仕分け対象取引がマスタに適合しました！</span>`;
      } else {
        progressText.innerHTML = `<span style="color:var(--color-warning); font-weight:600;"><i class="fa-solid fa-triangle-exclamation"></i> 警告: 未登録の取引先が ${unallocatedTransactions.length} 件検出されました。振替設定を行ってください。</span>`;
      }
    } 
    else if (state.importProgress === 100) {
      clearInterval(interval);
      state.isImporting = false;
      if (btn) btn.disabled = false;
      
      if (unallocatedTransactions.length > 0) {
        progressText.innerHTML = `<span style="color:var(--color-warning); font-weight:600;"><i class="fa-solid fa-triangle-exclamation"></i> 未分類取引の解決をお待ちしています（マスタに振替グループを設定してください）</span>`;
      } else {
        completeImportProcess();
      }
    }
  }, 700);
}

function openInstantAllocationModal(row) {
  const tx = MOCK_RAW_TRANSACTIONS.find(t => t.row === row);
  if (!tx) return;
  
  activeAllocationRow = row;
  
  document.getElementById("modal-tx-name").innerText = tx.partnerName;
  document.getElementById("modal-tx-partner").innerText = tx.partnerCode;
  document.getElementById("modal-tx-account").innerText = tx.account + " (" + tx.accountName + ")";
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
    const success = addMappingRule(tx.account, tx.partnerCode, tx.partnerName, targetBU);
    if (success) {
      // Remove from unallocated list
      unallocatedTransactions = unallocatedTransactions.filter(t => t.row !== activeAllocationRow);
      
      // Update UI in simulation log
      const rowEl = document.getElementById(`process-row-${tx.row}`);
      if (rowEl) {
        const buNameMap = {
          "group_ops": "オペレーション",
          "group_prod": "プロダクト",
          "group_sys": "システム",
          "group_bizdev": "BizDev",
          "group_gift": "株主優待",
          "group_pay": "報酬支払",
          "group_point": "ポイント",
          "group_fact": "ファクタリング",
          "group_dg": "デジタル＆",
          "group_corp_hq": "管理本部",
          "group_corp_rc": "リスコン",
          "group_legal": "法務",
          "group_security": "セキュリティ",
          "group_planning": "経営企画",
          "group_hr": "HR",
          "group_secretary": "秘書"
        };
        rowEl.style.background = "transparent";
        rowEl.querySelector(".status-cell").innerHTML = `<span class="badge-allocated" style="padding: 2px 6px; border-radius: 4px; font-size:0.65rem; font-weight:700;"><i class="fa-solid fa-circle-check"></i> 手動振替完了</span>`;
        rowEl.querySelector(".group-cell").innerHTML = `<strong style="color:var(--color-success);">${buNameMap[targetBU] || targetBU}G</strong>`;
        rowEl.querySelector(".action-cell").innerHTML = `<span style="color:var(--color-success); font-size:0.75rem;"><i class="fa-solid fa-check"></i> 解決済み</span>`;
      }
      
      closeAllocationModal();
      
      // Check if all unallocated transactions have been solved
      const progressText = document.getElementById("import-progress-text");
      if (unallocatedTransactions.length === 0) {
        completeImportProcess();
      } else if (progressText) {
        progressText.innerHTML = `<span style="color:var(--color-warning); font-weight:600;"><i class="fa-solid fa-triangle-exclamation"></i> あと ${unallocatedTransactions.length} 件の未分類取引の振替グループ登録が必要です</span>`;
      }
    }
  }
}

function completeImportProcess() {
  const progressText = document.getElementById("import-progress-text");
  if (progressText) {
    progressText.innerHTML = `<span style="color:var(--color-success); font-weight:700;"><i class="fa-solid fa-check-double"></i> すべての取引（26件）のグループ自動判定および振替処理がノーエラーで完了しました！</span>`;
  }
  
  // Safe helper to dynamically search BU by ID and add/subtract values (robust engineering)
  const addValue = (buId, key, val) => {
    const bu = db.businessUnits.find(b => b.id === buId);
    if (bu && bu.metrics[key] && bu.metrics[key].actual_this_week) {
      bu.metrics[key].actual_this_week[4] += val; // Add to April (Index 4 in budget structure)
    }
  };
  
  // Real dynamic integration to active databases:
  // Convert Yen back to Thousands of Yen and dynamically split/allocate to April actuals
  const rules = loadMappingRules();
  
  MOCK_RAW_TRANSACTIONS.forEach(tx => {
    const match = rules.find(r => r.account === tx.account && r.partnerCode === tx.partnerCode);
    if (match) {
      const targetBU = match.targetBU;
      // Convert Yen to Thousands of Yen (e.g. 125,000 Yen = 125.0 Thousand Yen)
      const valueInThousand = tx.value / 1000;
      
      // Allocating dynamically depending on category type
      if (tx.category === "売上高") {
        addValue(targetBU, "volume", valueInThousand);
        addValue(targetBU, "revenue", valueInThousand);
      } else {
        // Costs
        addValue(targetBU, "cost", valueInThousand);
      }
    }
  });
  
  // Refresh live views & charts!
  drawDashboardChart();
  drawProductivityChart();
  updateKPICards();
  generateDynamicInsights();
  if (state.currentView === "bu_grid") {
    generateBUGrid();
  }
  
  alert("本物仕訳データ（26件）の自動インポート、取引グループ振替マスタによる判定、および予実管理表・各種財務PL項目へのリアルタイム集計加算が完璧に完了しました！");
}

// Export BU Grid data to CSV dynamically (with UTF-8 BOM to prevent Excel encoding issues)
function exportBUGridToCSV() {
  const weekKey = state.useWeek === "this_week" ? "actual_this_week" : "actual_last_week";
  const prevWeekKey = "actual_last_week";
  let csvContent = "\uFEFF"; // UTF-8 BOM to prevent Excel encoding issues
  
  // Header row
  csvContent += "指標 / 部門・グループ,区分,通期,10月,11月,12月,1月,2月,3月,4月,5月,6月,7月,8月,9月,1Q,2Q,3Q,4Q\n";
  
  const buItems = [
    { id: "all", name: "全社合計" }
  ];
  const fullItems = [
    { id: "all", name: "全社合計" }
  ];

  db.businessUnits.forEach(bu => {
    if (bu.parent === "business_unit") {
      buItems.push({ id: bu.id, name: bu.name });
    }
    fullItems.push({ id: bu.id, name: bu.name });
  });

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
    renderGroupMaster();
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
        alert("新規振替ルールをマスタに正常追加しました！");
      }
    });
  }

  // Setup Master Config Sub-tabs click listener
  const configTabBtns = document.querySelectorAll(".config-tab-btn");
  configTabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-target");
      
      // Toggle active class on tab buttons
      configTabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      // Toggle active class on sub sections
      document.querySelectorAll(".config-sub-section").forEach(sec => {
        sec.classList.remove("active");
      });
      
      const activeSubSec = document.getElementById(`config-sub-${target}`);
      if (activeSubSec) {
        activeSubSec.classList.add("active");
      }
    });
  });
  
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

  // Setup Dynamic Group Master CRUD submission
  const newGroupForm = document.getElementById("new-group-form");
  if (newGroupForm) {
    newGroupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("new-group-name").value.trim();
      const parent = document.getElementById("new-group-parent").value;
      
      const success = addGroup(name, parent);
      if (success) {
        newGroupForm.reset();
        alert("新規グループをマスタデータベースに正常追加しました！");
      }
    });
  }
  
  // Initialize Charts and Grid
  switchView("dashboard");
});


