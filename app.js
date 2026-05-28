/* ==========================================================================
   2026年度 予実管理システム - コアロジック & モックデータベース (app.js)
   ========================================================================== */

// Mock Database containing real budget numbers from HTML format
const db = {
  activeWeek: "0601",
  previousWeek: "0525",
  confirmedMonth: 4, // Up to April (Month 4) is actuals
  
  // 12 Months mapping (2026年度: Oct 2026 to Sep 2027)
  months: [
    { name: "2026/10", key: "Oct", isActual: true },
    { name: "2026/11", key: "Nov", isActual: true },
    { name: "2026/12", key: "Dec", isActual: true },
    { name: "2027/01", key: "Jan", isActual: true },
    { name: "2027/02", key: "Feb", isActual: true },
    { name: "2027/03", key: "Mar", isActual: true },
    { name: "2027/04", key: "Apr", isActual: true }, // Current month
    { name: "2027/05", key: "May", isActual: false }, // Forecast
    { name: "2027/06", key: "Jun", isActual: false },
    { name: "2027/07", key: "Jul", isActual: false },
    { name: "2027/08", key: "Aug", isActual: false },
    { name: "2027/09", key: "Sep", isActual: false }
  ],
  
  businessUnits: [
    {
      id: "bu_gov",
      name: "BizDevG(給付金)",
      parent: "business_unit",
      metrics: {
        volume: {
          budget: [393000, 633000, 1704000, 1393000, 1563000, 2644000, 1973000, 2193000, 4584000, 1868000, 2188000, 3864000],
          actual_last_week: [549870.4, 993179.4, 2330140.1, 2398174.1, 1335868.9, 1281284.7, 1548348.3, 2189170.0, 3461472.3, 7855997.7, 3040564.2, 2112567.1],
          actual_this_week: [549870.4, 993179.4, 2330140.1, 2398174.1, 1335868.9, 1281284.7, 1550350.7, 2277928.1, 4662500.4, 7257368.5, 2742391.9, 1813976.0]
        },
        revenue: {
          budget: [22000, 37000, 80000, 62000, 72000, 137000, 94000, 108000, 252000, 87000, 107000, 277000],
          actual_last_week: [65346.2, 66205.2, 32556.7, 68010.6, 57733.9, 77856.0, 54727.5, 97979.6, 71061.7, 246435.1, 143827.6, 83354.4],
          actual_this_week: [65346.2, 66205.2, 32556.7, 68010.6, 57733.9, 77856.0, 60459.2, 97412.2, 72081.2, 246296.8, 145329.1, 83354.4]
        },
        gp: {
          budget: [19600, 34300, 77000, 58800, 68500, 133200, 89800, 103600, 247100, 81900, 101500, 270500],
          actual_last_week: [60913.3, 59107.4, 30498.0, 58385.2, 46785.9, 59982.9, 33767.9, 78011.2, 50404.3, 106022.8, 104856.9, 54587.6],
          actual_this_week: [60913.3, 59107.4, 30498.0, 58385.2, 46785.9, 59982.9, 37740.6, 82447.4, 51423.8, 105884.4, 106358.4, 54587.6]
        },
        headcount: {
          budget: [10, 10, 11, 11, 11, 11, 12, 12, 12, 12, 12, 12],
          actual_this_week: [10, 10, 11, 11, 11, 11, 12, 12, 12, 12, 12, 12]
        }
      }
    },
    {
      id: "bu_gift",
      name: "株主優待G",
      parent: "business_unit",
      metrics: {
        volume: {
          budget: [46250, 250, 250, 250, 250, 1019164, 1019164, 1019164, 1019164, 1019164, 1019164, 1019164],
          actual_last_week: [41781.2, 37790.4, 41934.9, 35236.8, 42106.7, 42006.3, 51504.9, 62510.0, 58000, 58000, 58000, 58000],
          actual_this_week: [41781.2, 37790.4, 41934.9, 35236.8, 42106.7, 42006.3, 51504.9, 62429.0, 58000, 58000, 58000, 58000]
        },
        revenue: {
          budget: [3529, 3123, 3123, 3123, 3123, 17289, 17289, 15172, 15172, 15172, 15172, 15172],
          actual_last_week: [2025.5, 2507.5, 2034.0, 1546.0, 1829.4, 2224.6, 2249.5, 2249.5, 11760.0, 2249.5, 2249.5, 3189.5],
          actual_this_week: [2025.5, 2507.5, 2034.0, 1546.0, 1829.4, 2224.6, 2063.3, 2802.3, 11760.0, 2700.0, 2700.0, 3640.0]
        },
        gp: {
          budget: [2118, 1712, 1712, 1712, 1712, 10757, 10757, 9810, 10049, 10049, 10049, 10049],
          actual_last_week: [688.8, 569.9, 497.0, 109.4, 588.9, 904.3, 650.3, 650.3, 9710.3, 650.3, 650.3, 1590.3],
          actual_this_week: [688.8, 569.9, 497.0, 109.4, 588.9, 904.3, 510.7, 760.5, 9800.0, 740.0, 740.0, 1680.0]
        },
        headcount: {
          budget: [5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 7],
          actual_this_week: [5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6]
        }
      }
    },
    {
      id: "bu_pay",
      name: "報酬支払G",
      parent: "business_unit",
      metrics: {
        volume: {
          budget: [42000, 42000, 42000, 42000, 42000, 42000, 42000, 42000, 42000, 42000, 42000, 42000],
          actual_last_week: [51456.2, 51368.5, 47806.7, 31541.7, 34578.2, 50686.6, 36891.3, 42000, 42000, 42000, 42000, 42000],
          actual_this_week: [51456.2, 51368.5, 47806.7, 31541.7, 34578.2, 50686.6, 38705.2, 42000, 42000, 42000, 42000, 42000]
        },
        revenue: {
          budget: [1260, 1260, 1260, 1260, 1260, 1260, 1260, 1260, 1260, 1260, 1260, 1260],
          actual_last_week: [0, 0, 0, 0, 0, 0, 1136.7, 1136.7, 1136.7, 1136.7, 1136.7, 1136.7],
          actual_this_week: [0, 0, 0, 0, 0, 0, 0, 1136.7, 1136.7, 1136.7, 1136.7, 1136.7]
        },
        gp: {
          budget: [927, 927, 927, 927, 927, 927, 927, 927, 927, 927, 927, 927],
          actual_last_week: [0, 0, 0, 0, 0, 0, 906.7, 906.7, 906.7, 906.7, 906.7, 906.7],
          actual_this_week: [0, 0, 0, 0, 0, 0, 0, 906.7, 906.7, 906.7, 906.7, 906.7]
        },
        headcount: {
          budget: [3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4],
          actual_this_week: [3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4]
        }
      }
    },
    {
      id: "bu_point",
      name: "ポイントG",
      parent: "business_unit",
      metrics: {
        volume: {
          budget: [140000, 290000, 340000, 240000, 80000, 980000, 80000, 80000, 240000, 240000, 240000, 240000],
          actual_last_week: [133870, 298330, 266439.0, 107470, 104356.3, 680975, 165000, 0, 160000, 160000, 0, 160000],
          actual_this_week: [133870, 298330, 266439.0, 107470, 104356.3, 680975, 165000, 0, 160000, 160000, 0, 160000]
        },
        revenue: {
          budget: [25677, 29004, 34220, 33417, 34011, 30440, 23544, 24362, 24316, 35886, 40510, 39439],
          actual_last_week: [25196.0, 28552.8, 38073.4, 34574.5, 30107.2, 49132.4, 53135.5, 18706.1, 11105.5, 22772.6, 16002.1, 9596.6],
          actual_this_week: [25196.0, 28552.8, 38073.4, 34574.5, 30107.2, 49132.4, 56233.0, 18706.1, 11105.5, 22772.6, 16002.1, 9596.6]
        },
        gp: {
          budget: [25677, 29004, 34220, 33417, 34011, 30440, 23544, 24362, 24316, 35886, 40510, 39439],
          actual_last_week: [25196.0, 28552.8, 38073.4, 34574.5, 30107.2, 49132.4, 53135.5, 18706.1, 11105.5, 22772.6, 16002.1, 9596.6],
          actual_this_week: [25196.0, 28552.8, 38073.4, 34574.5, 30107.2, 49132.4, 56233.0, 18706.1, 11105.5, 22772.6, 16002.1, 9596.6]
        },
        headcount: {
          budget: [4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5],
          actual_this_week: [4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5]
        }
      }
    },
    {
      id: "bu_fact",
      name: "ファクタリングG",
      parent: "business_unit",
      metrics: {
        volume: {
          budget: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          actual_last_week: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          actual_this_week: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        revenue: {
          budget: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          actual_last_week: [5.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          actual_this_week: [5.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        gp: {
          budget: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          actual_last_week: [5.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          actual_this_week: [5.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        headcount: {
          budget: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
          actual_this_week: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        }
      }
    },
    {
      id: "bu_dg",
      name: "デジタル＆",
      parent: "business_unit",
      metrics: {
        volume: {
          budget: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          actual_last_week: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          actual_this_week: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        revenue: {
          budget: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          actual_last_week: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          actual_this_week: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        gp: {
          budget: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          actual_last_week: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          actual_this_week: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        headcount: {
          budget: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
          actual_this_week: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
        }
      }
    },
    {
      id: "bu_ops",
      name: "オペレーションG",
      parent: "platform_unit",
      metrics: {
        volume: {
          budget: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          actual_last_week: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          actual_this_week: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        revenue: {
          budget: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          actual_last_week: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          actual_this_week: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        gp: {
          budget: [-10658, -12354, -11142, -10792, -10822, -2743, -2212, -3189, -3201, -3000, -2921, -3280],
          actual_last_week: [-1324.3, -11882.7, -7828.4, -10616.3, -10829.0, -10128.8, -8569.7, -7571.1, -3631.5, -8552.5, -8657.5, -7817.5],
          actual_this_week: [-1324.3, -11882.7, -7828.4, -10616.3, -10829.0, -10128.8, -8569.7, -7571.1, -3631.5, -8552.5, -8657.5, -7817.5]
        },
        headcount: {
          budget: [8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 9],
          actual_this_week: [8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 9]
        }
      }
    }
  ]
};

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
function generateBUGrid() {
  const tableContainer = document.getElementById("bu-grid-table-container");
  if (!tableContainer) return;
  
  const weekKey = state.useWeek === "this_week" ? "actual_this_week" : "actual_last_week";
  const prevWeekKey = "actual_last_week";
  
  let html = `
    <table class="data-table">
      <thead>
        <tr class="header-row">
          <th style="min-width: 150px;">指標 / 部門・グループ</th>
          <th>区分</th>
          <th>通期</th>
          ${db.months.map(m => `<th>${m.name.split("/")[1]}月${m.isActual ? '<span style="font-size:0.6rem;color:var(--accent-blue);display:block;">実績</span>' : '<span style="font-size:0.6rem;color:var(--text-muted);display:block;">ヨミ</span>'}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
  `;
  
  // Render BU Blocks
  db.businessUnits.forEach(bu => {
    const keys = ["volume", "revenue", "gp", "headcount", "productivity"];
    
    // Group Header Row
    html += `
      <tr class="bu-header">
        <td colspan="15">${bu.name}</td>
      </tr>
    `;
    
    const labelMapping = {
      volume: "流通総額",
      revenue: "売上高",
      gp: "売上総利益(粗利)",
      headcount: "直雇用社員数",
      productivity: "一人あたり粗利"
    };
    
    keys.forEach(k => {
      // For each metric, we render: Budget, Actual, Variance, WoW
      const metricLabel = labelMapping[k];
      
      const renderRow = (typeLabel, rowClass, valFunc, formatFunc) => {
        // Annual Total
        let annualVal = 0;
        if (k === "productivity") {
          const revSum = getMetricData(bu, "gp", weekKey).reduce((a,b) => a+b, 0);
          const hcAvg = getMetricData(bu, "headcount", weekKey).reduce((a,b) => a+b, 0) / 12;
          annualVal = hcAvg > 0 ? revSum / hcAvg : 0;
        } else if (k === "headcount") {
          // Average for headcount
          annualVal = getMetricData(bu, "headcount", weekKey).reduce((a,b) => a+b, 0) / 12;
        } else {
          // Sum
          const dataSrc = typeLabel === "予算" ? getMetricData(bu, k, "budget") : getMetricData(bu, k, weekKey);
          annualVal = dataSrc.reduce((a,b) => a+b, 0);
        }
        
        let monthTds = "";
        for (let m = 0; m < 12; m++) {
          const val = valFunc(m);
          
          // Check if value changed compared to last week (WoW check)
          let changedClass = "";
          if (state.highlightChanges && typeLabel === "実績" && m >= db.confirmedMonth) {
            const thisWeekVal = getMetricData(bu, k, weekKey)[m];
            const lastWeekVal = getMetricData(bu, k, prevWeekKey)[m];
            if (thisWeekVal !== lastWeekVal) {
              changedClass = "cell-highlight-changed";
            }
          }
          
          monthTds += `<td class="numeric ${rowClass} ${changedClass}">${formatFunc(val)}</td>`;
        }
        
        return `
          <tr class="metric-row">
            <td style="padding-left: 1.5rem; color: var(--text-secondary);">${metricLabel}</td>
            <td style="font-size: 0.75rem; color: var(--text-muted);">${typeLabel}</td>
            <td class="numeric ${rowClass}" style="font-weight:600;">${formatFunc(annualVal)}</td>
            ${monthTds}
          </tr>
        `;
      };
      
      // 1. Budget Row
      html += renderRow("予算", "budget-cell", (m) => {
        if (k === "productivity") {
          const gp = getMetricData(bu, "gp", "budget")[m];
          const hc = getMetricData(bu, "headcount", "budget")[m];
          return gp / (hc || 1);
        }
        return getMetricData(bu, k, "budget")[m];
      }, (v) => k === "headcount" ? v.toFixed(0) : Math.round(v).toLocaleString());
      
      // 2. Actual Row
      html += renderRow("実績", "actual-cell", (m) => {
        if (k === "productivity") {
          const gp = getMetricData(bu, "gp", weekKey)[m];
          const hc = getMetricData(bu, "headcount", weekKey)[m];
          return gp / (hc || 1);
        }
        return getMetricData(bu, k, weekKey)[m];
      }, (v) => k === "headcount" ? v.toFixed(0) : Math.round(v).toLocaleString());
      
      // 3. Variance Row (予算 vs 実績)
      const varFormat = (v) => {
        const rounded = Math.round(v);
        if (rounded > 0) return `<span class="variance-pos">+${rounded.toLocaleString()}</span>`;
        if (rounded < 0) return `<span class="variance-neg">${rounded.toLocaleString()}</span>`;
        return `0`;
      };
      html += renderRow("差額", "variance-cell", (m) => {
        if (k === "productivity") {
          const actGp = getMetricData(bu, "gp", weekKey)[m];
          const actHc = getMetricData(bu, "headcount", weekKey)[m];
          const act = actGp / (actHc || 1);
          
          const budGp = getMetricData(bu, "gp", "budget")[m];
          const budHc = getMetricData(bu, "headcount", "budget")[m];
          const bud = budGp / (budHc || 1);
          return act - bud;
        }
        return getMetricData(bu, k, weekKey)[m] - getMetricData(bu, k, "budget")[m];
      }, varFormat);
      
      // 4. WoW Change Row (前週比)
      html += renderRow("前週比", "wow-cell", (m) => {
        if (k === "productivity") {
          const actThisGp = getMetricData(bu, "gp", weekKey)[m];
          const actThisHc = getMetricData(bu, "headcount", weekKey)[m];
          const actThis = actThisGp / (actThisHc || 1);
          
          const actLastGp = getMetricData(bu, "gp", prevWeekKey)[m];
          const actLastHc = getMetricData(bu, "headcount", prevWeekKey)[m];
          const actLast = actLastGp / (actLastHc || 1);
          return actThis - actLast;
        }
        return getMetricData(bu, k, weekKey)[m] - getMetricData(bu, k, prevWeekKey)[m];
      }, varFormat);
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
  let csvContent = "\uFEFF"; // UTF-8 BOM
  
  // Header row
  csvContent += "指標 / 部門・グループ,区分,通期,10月,11月,12月,1月,2月,3月,4月,5月,6月,7月,8月,9月\n";
  
  const labelMapping = {
    volume: "流通総額",
    revenue: "売上高",
    gp: "売上総利益(粗利)",
    headcount: "直雇用社員数",
    productivity: "一人あたり粗利"
  };
  
  db.businessUnits.forEach(bu => {
    const keys = ["volume", "revenue", "gp", "headcount", "productivity"];
    
    // BU Header row
    csvContent += `"${bu.name}",,, , , , , , , , , , , , \n`;
    
    keys.forEach(k => {
      const metricLabel = labelMapping[k];
      
      const getRowData = (typeLabel, valFunc) => {
        let row = `"${metricLabel}","${typeLabel}"`;
        
        // Annual Total
        let annualVal = 0;
        if (k === "productivity") {
          const revSum = getMetricData(bu, "gp", weekKey).reduce((a,b) => a+b, 0);
          const hcAvg = getMetricData(bu, "headcount", weekKey).reduce((a,b) => a+b, 0) / 12;
          annualVal = hcAvg > 0 ? revSum / hcAvg : 0;
        } else if (k === "headcount") {
          annualVal = getMetricData(bu, "headcount", weekKey).reduce((a,b) => a+b, 0) / 12;
        } else {
          const dataSrc = typeLabel === "予算" ? getMetricData(bu, k, "budget") : getMetricData(bu, k, weekKey);
          annualVal = dataSrc.reduce((a,b) => a+b, 0);
        }
        row += `,${Math.round(annualVal)}`;
        
        for (let m = 0; m < 12; m++) {
          row += `,${Math.round(valFunc(m))}`;
        }
        return row + "\n";
      };
      
      // 1. Budget
      csvContent += getRowData("予算", (m) => {
        if (k === "productivity") {
          const gp = getMetricData(bu, "gp", "budget")[m];
          const hc = getMetricData(bu, "headcount", "budget")[m];
          return gp / (hc || 1);
        }
        return getMetricData(bu, k, "budget")[m];
      });
      
      // 2. Actual
      csvContent += getRowData("実績", (m) => {
        if (k === "productivity") {
          const gp = getMetricData(bu, "gp", weekKey)[m];
          const hc = getMetricData(bu, "headcount", weekKey)[m];
          return gp / (hc || 1);
        }
        return getMetricData(bu, k, weekKey)[m];
      });
      
      // 3. Variance
      csvContent += getRowData("差額", (m) => {
        if (k === "productivity") {
          const actGp = getMetricData(bu, "gp", weekKey)[m];
          const actHc = getMetricData(bu, "headcount", weekKey)[m];
          const act = actGp / (actHc || 1);
          const budGp = getMetricData(bu, "gp", "budget")[m];
          const budHc = getMetricData(bu, "headcount", "budget")[m];
          const bud = budGp / (budHc || 1);
          return act - bud;
        }
        return getMetricData(bu, k, weekKey)[m] - getMetricData(bu, k, "budget")[m];
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


