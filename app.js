(function () {
  "use strict";

  const STORAGE_KEY = "expenseTrackerAIState";
  const THEME_KEY = "expenseTrackerAITheme";
  const categories = [
    "Food",
    "Transport",
    "Utilities",
    "Shopping",
    "Entertainment",
    "Healthcare",
    "Education",
    "Travel",
    "Subscription",
    "Other"
  ];

  const currencyRates = {
    INR: 1,
    USD: 0.012,
    EUR: 0.011,
    GBP: 0.0094,
    AED: 0.044
  };

  const chartPalette = ["#2dd4bf", "#38bdf8", "#f59e0b", "#fb7185", "#a78bfa", "#22c55e", "#f97316", "#06b6d4", "#eab308", "#94a3b8"];
  const chartInstances = {};
  let state = null;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const page = document.body.dataset.page;

  document.addEventListener("DOMContentLoaded", () => {
    state = loadState();
    initTheme();
    initNavigation();
    populateCategorySelects();
    initExports();

    const pageInit = {
      landing: initLanding,
      login: initLogin,
      signup: initSignup,
      dashboard: initDashboard,
      expenses: initExpenses,
      insights: initInsights,
      settings: initSettings
    };

    if (pageInit[page]) {
      pageInit[page]();
    }
  });

  function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      const seeded = createSeedData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }

    try {
      const parsed = JSON.parse(saved);
      return normalizeState(parsed);
    } catch (error) {
      const seeded = createSeedData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
  }

  function normalizeState(input) {
    const seeded = createSeedData();
    return {
      ...seeded,
      ...input,
      profile: { ...seeded.profile, ...(input.profile || {}) },
      expenses: Array.isArray(input.expenses) ? input.expenses : seeded.expenses,
      budgets: { ...seeded.budgets, ...(input.budgets || {}) },
      goals: Array.isArray(input.goals) ? input.goals : seeded.goals,
      subscriptions: Array.isArray(input.subscriptions) ? input.subscriptions : seeded.subscriptions,
      admin: { ...seeded.admin, ...(input.admin || {}) }
    };
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function createSeedData() {
    const expense = (monthOffset, day, merchant, description, category, amount, method = "UPI") => ({
      id: uid(),
      date: dateFor(monthOffset, day),
      merchant,
      description,
      category,
      amount,
      method,
      tax: Math.round(amount * 0.05),
      lineItems: []
    });

    return {
      profile: {
        name: "Aditya Kumar",
        email: "aditya@example.com",
        currency: "INR",
        income: 95000,
        balance: 235000
      },
      expenses: [
        expense(0, 2, "Big Basket", "Monthly groceries", "Food", 6240),
        expense(0, 4, "Uber", "Office commute", "Transport", 1420),
        expense(0, 5, "Netflix", "Family streaming plan", "Subscription", 649, "Credit Card"),
        expense(0, 7, "Apollo Pharmacy", "Medicines and vitamins", "Healthcare", 2180, "Debit Card"),
        expense(0, 10, "Amazon", "Desk accessories", "Shopping", 4890, "Credit Card"),
        expense(0, 12, "BSES Power", "Electricity bill", "Utilities", 3860, "Net Banking"),
        expense(0, 15, "PVR Cinemas", "Weekend movie", "Entertainment", 1760, "UPI"),
        expense(0, 18, "Coursera", "Cloud computing course", "Education", 3299, "Credit Card"),
        expense(-1, 3, "Swiggy", "Team dinner", "Food", 2840),
        expense(-1, 6, "Delhi Metro", "Metro card recharge", "Transport", 1200),
        expense(-1, 9, "Airtel Fiber", "Internet bill", "Utilities", 1499, "Credit Card"),
        expense(-1, 13, "Myntra", "Shoes and clothing", "Shopping", 5290, "Credit Card"),
        expense(-1, 17, "Goibibo", "Jaipur trip booking", "Travel", 11800, "Credit Card"),
        expense(-1, 23, "Spotify", "Music subscription", "Subscription", 119),
        expense(-2, 2, "Reliance Fresh", "Groceries", "Food", 5125),
        expense(-2, 8, "Rapido", "Local rides", "Transport", 840),
        expense(-2, 11, "Prime Video", "Video subscription", "Subscription", 299),
        expense(-2, 16, "Max Healthcare", "Doctor consultation", "Healthcare", 1500, "Debit Card"),
        expense(-2, 20, "MakeMyTrip", "Flight booking", "Travel", 16800, "Credit Card"),
        expense(-3, 4, "Zomato", "Food delivery", "Food", 2380),
        expense(-3, 12, "Udemy", "JavaScript course", "Education", 899, "Credit Card"),
        expense(-3, 19, "Lifestyle", "Formal wear", "Shopping", 6400, "Credit Card"),
        expense(-4, 7, "HP Gas", "Gas cylinder", "Utilities", 1120, "UPI"),
        expense(-4, 17, "BookMyShow", "Concert tickets", "Entertainment", 4200, "UPI"),
        expense(-5, 5, "Indigo", "College fest travel", "Travel", 9200, "Credit Card"),
        expense(-5, 15, "MedPlus", "Health supplies", "Healthcare", 980, "Debit Card")
      ],
      budgets: {
        Food: 14000,
        Transport: 7000,
        Utilities: 8000,
        Shopping: 12000,
        Entertainment: 6000,
        Healthcare: 5500,
        Education: 7000,
        Travel: 18000,
        Subscription: 3000,
        Other: 5000
      },
      goals: [
        { id: uid(), name: "Emergency Fund", target: 250000, saved: 148000, createdAt: dateFor(-4, 1) },
        { id: uid(), name: "Laptop Upgrade", target: 120000, saved: 42000, createdAt: dateFor(-2, 10) }
      ],
      subscriptions: [
        { id: uid(), name: "Netflix", amount: 649, category: "Subscription", renewal: dateFor(0, 25), cycle: "Monthly" },
        { id: uid(), name: "Spotify", amount: 119, category: "Subscription", renewal: dateFor(0, 21), cycle: "Monthly" },
        { id: uid(), name: "Airtel Fiber", amount: 1499, category: "Utilities", renewal: dateFor(0, 28), cycle: "Monthly" },
        { id: uid(), name: "Coursera Plus", amount: 3299, category: "Education", renewal: dateFor(1, 6), cycle: "Monthly" }
      ],
      admin: {
        users: 2480,
        retention: 91,
        newUsers: [220, 310, 420, 530, 645, 710],
        activeUsers: [1200, 1390, 1575, 1760, 1985, 2210]
      }
    };
  }

  function uid() {
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function dateFor(monthOffset, day) {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const maxDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    const safeDay = Math.min(day, maxDay);
    return `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(safeDay)}`;
  }

  function pad(number) {
    return String(number).padStart(2, "0");
  }

  function currentMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  }

  function getMonthKey(date) {
    return date.slice(0, 7);
  }

  function getMonthLabel(monthKey) {
    const [year, month] = monthKey.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
  }

  function lastMonths(count, includeNext = false) {
    const result = [];
    const now = new Date();
    const start = includeNext ? count - 2 : count - 1;
    for (let index = start; index >= 0; index -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
      result.push(`${date.getFullYear()}-${pad(date.getMonth() + 1)}`);
    }
    return result;
  }

  function formatDate(dateString) {
    return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  function rate(currency = state.profile.currency) {
    return currencyRates[currency] || 1;
  }

  function fromBase(amount, currency = state.profile.currency) {
    return Number(amount || 0) * rate(currency);
  }

  function toBase(amount, currency = state.profile.currency) {
    return Number(amount || 0) / rate(currency);
  }

  function money(amount, options = {}) {
    const currency = options.currency || state.profile.currency;
    const display = fromBase(amount, currency);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "INR" ? 0 : 2
    }).format(display);
  }

  function numericDisplay(amount, currency = state.profile.currency) {
    return Number(fromBase(amount, currency).toFixed(currency === "INR" ? 0 : 2));
  }

  function monthlyExpense(monthKey = currentMonthKey()) {
    return state.expenses
      .filter((expense) => getMonthKey(expense.date) === monthKey)
      .reduce((sum, expense) => sum + Number(expense.amount), 0);
  }

  function monthlySubscriptionTotal() {
    return state.subscriptions.reduce((sum, subscription) => sum + Number(subscription.amount), 0);
  }

  function currentSavings() {
    return state.profile.income - monthlyExpense();
  }

  function groupExpensesByCategory(monthKey = currentMonthKey()) {
    return categories.reduce((accumulator, category) => {
      accumulator[category] = state.expenses
        .filter((expense) => expense.category === category && getMonthKey(expense.date) === monthKey)
        .reduce((sum, expense) => sum + Number(expense.amount), 0);
      return accumulator;
    }, {});
  }

  function initTheme() {
    const storedTheme = localStorage.getItem(THEME_KEY);
    const preferredTheme = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    applyTheme(storedTheme || preferredTheme);

    $$(".theme-toggle").forEach((button) => {
      button.addEventListener("click", () => {
        const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        applyTheme(next);
        showToast(`${capitalize(next)} mode enabled`, "success");
      });
    });
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
    $$(".theme-toggle").forEach((button) => {
      button.textContent = theme === "dark" ? "Light" : "Dark";
    });
  }

  function initNavigation() {
    const nav = $(".nav");
    const toggle = $(".nav-toggle");
    if (!nav || !toggle) return;

    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  function populateCategorySelects() {
    $$("[data-category-select]").forEach((select) => {
      select.innerHTML = categories.map((category) => `<option value="${category}">${category}</option>`).join("");
    });

    const categoryFilter = $("#categoryFilter");
    if (categoryFilter) {
      categoryFilter.innerHTML = `<option value="All">All Categories</option>${categories.map((category) => `<option value="${category}">${category}</option>`).join("")}`;
    }
  }

  function initExports() {
    $$("[data-export]").forEach((button) => {
      button.addEventListener("click", () => {
        const type = button.dataset.export;
        if (type === "csv") exportCSV();
        if (type === "pdf") exportPDF();
      });
    });
  }

  function initLanding() {
    const expense = monthlyExpense();
    const savings = currentSavings();
    const forecast = calculateForecast();
    setText("[data-home-balance]", money(state.profile.balance + savings));
    setText("[data-home-income]", money(state.profile.income));
    setText("[data-home-expense]", money(expense));
    setText("[data-home-savings]", money(savings));
    setText("[data-home-forecast]", money(forecast));
  }

  function initLogin() {
    const form = $("#loginForm");
    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      state.profile.email = formData.get("email") || state.profile.email;
      saveState();
      showToast("Login successful. Opening dashboard...", "success");
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 650);
    });
  }

  function initSignup() {
    const form = $("#signupForm");
    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const currency = formData.get("currency") || "INR";
      state.profile.name = formData.get("name") || state.profile.name;
      state.profile.email = formData.get("email") || state.profile.email;
      state.profile.currency = currency;
      state.profile.income = toBase(formData.get("income"), currency);
      saveState();
      showToast("Account created. Your dashboard is ready.", "success");
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 650);
    });
  }

  function initDashboard() {
    renderDashboardMetrics();
    renderBudgetList("#budgetList");
    renderGoals("#goalSummary", false);
    renderAdminStats();
    renderDashboardCharts();
  }

  function renderDashboardMetrics() {
    const expense = monthlyExpense();
    const savings = currentSavings();
    setText("#totalBalance", money(state.profile.balance + savings));
    setText("#monthlyIncome", money(state.profile.income));
    setText("#monthlyExpense", money(expense));
    setText("#monthlySavings", money(savings));
  }

  function renderDashboardCharts() {
    const months = lastMonths(6);
    const incomeData = months.map(() => numericDisplay(state.profile.income));
    const expenseData = months.map((month) => numericDisplay(monthlyExpense(month)));
    const savingsData = months.map((month) => numericDisplay(state.profile.income - monthlyExpense(month)));
    const categoryData = groupExpensesByCategory();
    const activeCategoryLabels = categories.filter((category) => categoryData[category] > 0);

    createChart("monthlyTrendChart", {
      type: "line",
      data: {
        labels: months.map(getMonthLabel),
        datasets: [
          { label: "Income", data: incomeData, borderColor: "#2dd4bf", backgroundColor: "rgba(45, 212, 191, 0.14)", tension: 0.35, fill: true },
          { label: "Expense", data: expenseData, borderColor: "#fb7185", backgroundColor: "rgba(251, 113, 133, 0.12)", tension: 0.35, fill: true },
          { label: "Savings", data: savingsData, borderColor: "#38bdf8", backgroundColor: "rgba(56, 189, 248, 0.1)", tension: 0.35, fill: true }
        ]
      },
      options: chartOptions()
    });

    createChart("categoryPieChart", {
      type: "doughnut",
      data: {
        labels: activeCategoryLabels,
        datasets: [{
          data: activeCategoryLabels.map((category) => numericDisplay(categoryData[category])),
          backgroundColor: chartPalette,
          borderWidth: 0
        }]
      },
      options: chartOptions({ cutout: "64%" })
    });

    createChart("incomeExpenseChart", {
      type: "bar",
      data: {
        labels: months.map(getMonthLabel),
        datasets: [
          { label: "Income", data: incomeData, backgroundColor: "#2dd4bf", borderRadius: 8 },
          { label: "Expense", data: expenseData, backgroundColor: "#f59e0b", borderRadius: 8 }
        ]
      },
      options: chartOptions()
    });

    createChart("adminChart", {
      type: "bar",
      data: {
        labels: months.map(getMonthLabel),
        datasets: [
          { label: "New Users", data: state.admin.newUsers, backgroundColor: "#38bdf8", borderRadius: 8 },
          { label: "Active Users", data: state.admin.activeUsers, backgroundColor: "#2dd4bf", borderRadius: 8 }
        ]
      },
      options: chartOptions()
    });
  }

  function initExpenses() {
    const form = $("#expenseForm");
    if (form) {
      form.date.value = dateFor(0, new Date().getDate());
      form.addEventListener("submit", handleExpenseSubmit);
    }

    $("#resetExpenseForm")?.addEventListener("click", resetExpenseForm);
    ["#expenseSearch", "#categoryFilter", "#monthFilter"].forEach((selector) => {
      $(selector)?.addEventListener("input", renderExpenseTable);
      $(selector)?.addEventListener("change", renderExpenseTable);
    });

    initReceiptScanner();
    renderMonthFilter();
    renderExpenseTable();
    renderSubscriptions("#subscriptionList", false);
    renderBudgetList("#expenseBudgetAlerts");
  }

  function handleExpenseSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const id = formData.get("id");
    const payload = {
      merchant: String(formData.get("merchant") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      amount: toBase(formData.get("amount")),
      date: formData.get("date"),
      category: formData.get("category"),
      method: formData.get("method"),
      tax: Math.round(toBase(formData.get("amount")) * 0.05),
      lineItems: []
    };

    if (!payload.merchant || !payload.amount || !payload.date) {
      showToast("Please add merchant, amount, and date.", "error");
      return;
    }

    if (id) {
      state.expenses = state.expenses.map((expense) => expense.id === id ? { ...expense, ...payload } : expense);
      showToast("Expense updated successfully.", "success");
    } else {
      state.expenses.unshift({ id: uid(), ...payload });
      showToast("Expense added successfully.", "success");
    }

    saveState();
    resetExpenseForm();
    renderMonthFilter();
    renderExpenseTable();
    renderBudgetList("#expenseBudgetAlerts");
  }

  function resetExpenseForm() {
    const form = $("#expenseForm");
    if (!form) return;
    form.reset();
    form.id.value = "";
    form.date.value = dateFor(0, new Date().getDate());
    setText("#expenseFormTitle", "Add Expense");
  }

  function renderMonthFilter() {
    const filter = $("#monthFilter");
    if (!filter) return;

    const months = Array.from(new Set(state.expenses.map((expense) => getMonthKey(expense.date)))).sort().reverse();
    const selected = filter.value || "All";
    filter.innerHTML = `<option value="All">All Months</option>${months.map((month) => `<option value="${month}">${getMonthLabel(month)}</option>`).join("")}`;
    filter.value = months.includes(selected) ? selected : "All";
  }

  function renderExpenseTable() {
    const body = $("#expenseTableBody");
    if (!body) return;

    const query = ($("#expenseSearch")?.value || "").toLowerCase();
    const category = $("#categoryFilter")?.value || "All";
    const month = $("#monthFilter")?.value || "All";
    const filtered = state.expenses.filter((expense) => {
      const matchesQuery = `${expense.merchant} ${expense.description}`.toLowerCase().includes(query);
      const matchesCategory = category === "All" || expense.category === category;
      const matchesMonth = month === "All" || getMonthKey(expense.date) === month;
      return matchesQuery && matchesCategory && matchesMonth;
    });

    if (!filtered.length) {
      body.innerHTML = `<tr><td colspan="6">No expenses match the current filters.</td></tr>`;
      return;
    }

    body.innerHTML = filtered.map((expense) => `
      <tr>
        <td>${formatDate(expense.date)}</td>
        <td><strong>${escapeHTML(expense.merchant)}</strong><br><small>${escapeHTML(expense.description || "No description")}</small></td>
        <td>${expense.category}</td>
        <td><strong>${money(expense.amount)}</strong></td>
        <td>${expense.method || "UPI"}</td>
        <td>
          <div class="action-buttons">
            <button class="icon-btn" type="button" data-edit-expense="${expense.id}">Edit</button>
            <button class="icon-btn" type="button" data-delete-expense="${expense.id}">Delete</button>
          </div>
        </td>
      </tr>
    `).join("");

    $$("[data-edit-expense]").forEach((button) => {
      button.addEventListener("click", () => editExpense(button.dataset.editExpense));
    });

    $$("[data-delete-expense]").forEach((button) => {
      button.addEventListener("click", () => deleteExpense(button.dataset.deleteExpense));
    });
  }

  function editExpense(id) {
    const expense = state.expenses.find((item) => item.id === id);
    const form = $("#expenseForm");
    if (!expense || !form) return;

    form.id.value = expense.id;
    form.merchant.value = expense.merchant;
    form.description.value = expense.description || "";
    form.amount.value = numericDisplay(expense.amount);
    form.date.value = expense.date;
    form.category.value = expense.category;
    form.method.value = expense.method || "UPI";
    setText("#expenseFormTitle", "Edit Expense");
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function deleteExpense(id) {
    const expense = state.expenses.find((item) => item.id === id);
    if (!expense) return;
    if (!window.confirm(`Delete ${expense.merchant} expense?`)) return;

    state.expenses = state.expenses.filter((item) => item.id !== id);
    saveState();
    renderMonthFilter();
    renderExpenseTable();
    renderBudgetList("#expenseBudgetAlerts");
    showToast("Expense deleted.", "warning");
  }

  function initReceiptScanner() {
    const drop = $("#receiptDrop");
    const input = $("#receiptInput");
    const ocrForm = $("#ocrForm");
    if (!drop || !input || !ocrForm) return;

    drop.addEventListener("click", () => input.click());
    drop.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") input.click();
    });

    ["dragenter", "dragover"].forEach((eventName) => {
      drop.addEventListener(eventName, (event) => {
        event.preventDefault();
        drop.classList.add("drag-over");
      });
    });

    ["dragleave", "drop"].forEach((eventName) => {
      drop.addEventListener(eventName, (event) => {
        event.preventDefault();
        drop.classList.remove("drag-over");
      });
    });

    drop.addEventListener("drop", (event) => {
      const file = event.dataTransfer.files[0];
      if (file) fillReceiptFields(file.name);
    });

    input.addEventListener("change", () => {
      const file = input.files[0];
      if (file) fillReceiptFields(file.name);
    });

    $("#addOcrExpense")?.addEventListener("click", () => {
      const formData = new FormData(ocrForm);
      const merchant = String(formData.get("merchant") || "").trim();
      const amount = Number(formData.get("amount") || 0);
      if (!merchant || !amount) {
        showToast("Extracted merchant and amount are required.", "error");
        return;
      }

      const description = String(formData.get("items") || "").split("\n").filter(Boolean).slice(0, 2).join(", ");
      state.expenses.unshift({
        id: uid(),
        merchant,
        description: description || "Receipt scan",
        amount: toBase(amount),
        date: formData.get("date") || dateFor(0, new Date().getDate()),
        category: predictCategory(merchant, description).category,
        method: "UPI",
        tax: toBase(formData.get("tax")),
        lineItems: String(formData.get("items") || "").split("\n").filter(Boolean)
      });
      saveState();
      renderMonthFilter();
      renderExpenseTable();
      renderBudgetList("#expenseBudgetAlerts");
      showToast("Receipt expense added from extracted fields.", "success");
    });
  }

  function fillReceiptFields(fileName) {
    const samples = [
      { merchant: "Big Basket", amount: 2845, tax: 142, items: "Rice - 980\nMilk - 144\nFruits - 620\nSnacks - 1101" },
      { merchant: "Apollo Pharmacy", amount: 1630, tax: 82, items: "Vitamin D - 620\nThermometer - 780\nBandage - 230" },
      { merchant: "Uber", amount: 540, tax: 27, items: "Airport ride - 540" },
      { merchant: "Cafe Coffee Day", amount: 760, tax: 38, items: "Coffee - 320\nSandwich - 280\nBrownie - 160" }
    ];
    const sample = samples[Math.abs(fileName.length) % samples.length];
    const form = $("#ocrForm");
    if (!form) return;

    form.merchant.value = sample.merchant;
    form.date.value = dateFor(0, new Date().getDate());
    form.amount.value = numericDisplay(sample.amount);
    form.tax.value = numericDisplay(sample.tax);
    form.items.value = sample.items;
    showToast("Receipt scanned. Review editable fields before adding.", "success");
  }

  function initInsights() {
    $("#categorizerForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const result = predictCategory(formData.get("merchant"), formData.get("description"));
      const output = $("#categoryPrediction");
      if (output) {
        output.innerHTML = `
          <span>Predicted Category</span>
          <strong>${result.category}</strong>
          <small>${result.confidence}% confidence based on merchant and description keywords.</small>
        `;
      }
      showToast(`Predicted category: ${result.category}`, "success");
    });

    $("#goalForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const formData = new FormData(form);
      state.goals.push({
        id: uid(),
        name: String(formData.get("name")).trim(),
        target: toBase(formData.get("target")),
        saved: toBase(formData.get("saved")),
        createdAt: dateFor(0, new Date().getDate())
      });
      saveState();
      form.reset();
      renderGoals("#goalsList", true);
      showToast("Savings goal added.", "success");
    });

    renderForecast();
    renderSuggestions();
    renderGoals("#goalsList", true);
    renderForecastChart();
  }

  function predictCategory(merchant = "", description = "") {
    const text = `${merchant} ${description}`.toLowerCase();
    const rules = [
      ["Food", ["food", "grocery", "basket", "swiggy", "zomato", "restaurant", "cafe", "coffee", "milk", "bread"]],
      ["Transport", ["uber", "ola", "metro", "rapido", "fuel", "cab", "ride", "bus", "train"]],
      ["Utilities", ["electricity", "power", "water", "gas", "fiber", "internet", "mobile", "airtel", "jio"]],
      ["Shopping", ["amazon", "myntra", "shopping", "clothing", "shoes", "accessories", "lifestyle"]],
      ["Entertainment", ["movie", "cinema", "pvr", "bookmyshow", "concert", "game"]],
      ["Healthcare", ["pharmacy", "apollo", "medplus", "doctor", "hospital", "medicine", "health"]],
      ["Education", ["course", "udemy", "coursera", "book", "tuition", "college", "exam"]],
      ["Travel", ["flight", "hotel", "travel", "goibibo", "makemytrip", "indigo", "booking"]],
      ["Subscription", ["subscription", "netflix", "spotify", "prime", "plan", "renewal"]]
    ];

    for (const [category, keywords] of rules) {
      if (keywords.some((keyword) => text.includes(keyword))) {
        return { category, confidence: 88 + Math.floor(Math.random() * 8) };
      }
    }

    return { category: "Other", confidence: 72 };
  }

  function renderForecast() {
    const forecast = calculateForecast();
    setText("#forecastAmount", money(forecast));

    const incomeRatio = forecast / state.profile.income;
    const narrative = incomeRatio > 0.8
      ? "Projected spending is high compared with income. Review flexible categories before next month starts."
      : "Projection is within a manageable range. Keep tracking subscriptions and food spending.";
    setText("#forecastNarrative", narrative);

    const alerts = buildAlerts(forecast);
    const alertList = $("#alertList");
    if (alertList) {
      alertList.innerHTML = alerts.map((alert) => `
        <div class="alert-item ${alert.type}">
          <strong>${alert.title}</strong>
          <p>${alert.message}</p>
        </div>
      `).join("");
    }
  }

  function calculateForecast() {
    const months = lastMonths(3);
    const values = months.map((month) => monthlyExpense(month));
    const average = values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
    const growth = values.length > 1 ? (values[values.length - 1] - values[0]) * 0.25 : 0;
    return Math.max(0, Math.round(average + Math.max(growth, 0) + monthlySubscriptionTotal() * 0.35));
  }

  function buildAlerts(forecast) {
    const grouped = groupExpensesByCategory();
    const overspent = categories
      .filter((category) => grouped[category] > state.budgets[category])
      .map((category) => `${category} exceeded by ${money(grouped[category] - state.budgets[category])}`);
    const alerts = [];

    if (forecast > state.profile.income * 0.8) {
      alerts.push({
        type: "error",
        title: "Overspending risk",
        message: `Forecasted expense may use ${Math.round((forecast / state.profile.income) * 100)}% of income.`
      });
    } else {
      alerts.push({
        type: "success",
        title: "Healthy forecast",
        message: "Next month is projected below the high-risk spending threshold."
      });
    }

    if (overspent.length) {
      alerts.push({
        type: "warning",
        title: "Budget alerts",
        message: overspent.slice(0, 3).join(". ")
      });
    } else {
      alerts.push({
        type: "success",
        title: "Budgets under control",
        message: "No active category has crossed its monthly budget."
      });
    }

    alerts.push({
      type: "warning",
      title: "Recurring charges",
      message: `${money(monthlySubscriptionTotal())} is committed to monthly subscriptions.`
    });

    return alerts;
  }

  function renderSuggestions() {
    const grouped = groupExpensesByCategory();
    const topCategory = categories.reduce((top, category) => grouped[category] > grouped[top] ? category : top, categories[0]);
    const suggestions = [
      `Trim ${topCategory} spending by 10% to free up about ${money(grouped[topCategory] * 0.1)} this month.`,
      `Review ${state.subscriptions.length} active subscriptions before renewal dates.`,
      `Auto-transfer ${money(Math.max(currentSavings() * 0.25, 1500))} to your highest-priority savings goal.`,
      "Use the receipt scanner for cash purchases so category insights stay complete."
    ];

    const container = $("#suggestionList");
    if (!container) return;
    container.innerHTML = suggestions.map((suggestion) => `
      <div class="list-item">
        <div class="list-top"><strong>Suggestion</strong><span class="positive">AI</span></div>
        <p>${suggestion}</p>
      </div>
    `).join("");
  }

  function renderForecastChart() {
    const months = lastMonths(6);
    const labels = months.map(getMonthLabel).concat("Next");
    const values = months.map((month) => numericDisplay(monthlyExpense(month))).concat(numericDisplay(calculateForecast()));

    createChart("forecastChart", {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Expense Forecast",
          data: values,
          borderColor: "#fb7185",
          backgroundColor: "rgba(251, 113, 133, 0.14)",
          pointBackgroundColor: labels.map((_, index) => index === labels.length - 1 ? "#f59e0b" : "#fb7185"),
          tension: 0.35,
          fill: true
        }]
      },
      options: chartOptions()
    });
  }

  function initSettings() {
    const form = $("#settingsForm");
    if (form) {
      fillSettingsForm(form);
      form.currency.addEventListener("change", () => {
        state.profile.currency = form.currency.value;
        saveState();
        fillSettingsForm(form);
        renderBudgetForm();
        renderSubscriptions("#settingsSubscriptionList", true);
        showToast(`Currency changed to ${state.profile.currency}.`, "success");
      });

      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        state.profile.name = String(formData.get("name") || state.profile.name).trim();
        state.profile.email = String(formData.get("email") || state.profile.email).trim();
        state.profile.currency = formData.get("currency") || state.profile.currency;
        state.profile.income = toBase(formData.get("income"));
        state.profile.balance = toBase(formData.get("balance"));
        saveState();
        fillSettingsForm(form);
        showToast("Settings saved successfully.", "success");
      });
    }

    renderBudgetForm();
    initSubscriptionForm();
    renderSubscriptions("#settingsSubscriptionList", true);

    $$("[data-toast-demo]").forEach((button) => {
      button.addEventListener("click", () => {
        const type = button.dataset.toastDemo;
        const messages = {
          success: "Success notification preview.",
          warning: "Warning notification preview.",
          error: "Error notification preview."
        };
        showToast(messages[type], type);
      });
    });

    $("#budgetNotifications")?.addEventListener("change", (event) => {
      showToast(event.target.checked ? "Budget reminders enabled." : "Budget reminders disabled.", "success");
    });

    $("#resetDemoData")?.addEventListener("click", () => {
      if (!window.confirm("Reset all demo data?")) return;
      state = createSeedData();
      saveState();
      fillSettingsForm($("#settingsForm"));
      renderBudgetForm();
      renderSubscriptions("#settingsSubscriptionList", true);
      showToast("Demo data reset.", "warning");
    });
  }

  function fillSettingsForm(form) {
    if (!form) return;
    form.name.value = state.profile.name;
    form.email.value = state.profile.email;
    form.currency.value = state.profile.currency;
    form.income.value = numericDisplay(state.profile.income);
    form.balance.value = numericDisplay(state.profile.balance);
  }

  function renderBudgetForm() {
    const form = $("#budgetForm");
    if (!form) return;

    form.innerHTML = categories.map((category) => `
      <label class="budget-control">
        ${category}
        <input type="number" name="${category}" min="0" step="100" value="${numericDisplay(state.budgets[category])}">
      </label>
    `).join("") + `<button class="btn btn-primary" type="submit">Save Budgets</button>`;

    form.onsubmit = handleBudgetSubmit;
  }

  function handleBudgetSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    categories.forEach((category) => {
      state.budgets[category] = toBase(formData.get(category));
    });
    saveState();
    renderBudgetForm();
    showToast("Budgets updated.", "success");
  }

  function initSubscriptionForm() {
    const form = $("#subscriptionForm");
    if (!form) return;
    form.renewal.value = dateFor(0, new Date().getDate());
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      state.subscriptions.push({
        id: uid(),
        name: String(formData.get("name") || "").trim(),
        amount: toBase(formData.get("amount")),
        renewal: formData.get("renewal"),
        category: formData.get("category") || "Subscription",
        cycle: "Monthly"
      });
      saveState();
      form.reset();
      form.renewal.value = dateFor(0, new Date().getDate());
      renderSubscriptions("#settingsSubscriptionList", true);
      showToast("Subscription added.", "success");
    });
  }

  function renderBudgetList(selector) {
    const container = $(selector);
    if (!container) return;
    const grouped = groupExpensesByCategory();

    container.innerHTML = categories.map((category) => {
      const spent = grouped[category] || 0;
      const budget = state.budgets[category] || 1;
      const percent = Math.round((spent / budget) * 100);
      const statusClass = percent >= 100 ? "danger" : percent >= 80 ? "warning" : "";
      const label = percent >= 100 ? "Over budget" : percent >= 80 ? "Near limit" : "On track";

      return `
        <div class="budget-item">
          <div class="budget-top">
            <strong>${category}</strong>
            <span class="${statusClass || "positive"}">${label}</span>
          </div>
          <div class="progress ${statusClass}" aria-label="${category} budget progress">
            <span style="--value: ${Math.min(percent, 100)}%"></span>
          </div>
          <small>${money(spent)} of ${money(budget)} used (${percent}%)</small>
        </div>
      `;
    }).join("");
  }

  function renderGoals(selector, editable) {
    const container = $(selector);
    if (!container) return;
    if (!state.goals.length) {
      container.innerHTML = `<div class="list-item"><p>No savings goals yet.</p></div>`;
      return;
    }

    const monthlyContribution = Math.max(currentSavings() * 0.25, 1000);
    container.innerHTML = state.goals.map((goal) => {
      const percent = Math.min(100, Math.round((goal.saved / goal.target) * 100));
      const remaining = Math.max(goal.target - goal.saved, 0);
      const months = remaining === 0 ? 0 : Math.ceil(remaining / monthlyContribution);
      return `
        <div class="list-item">
          <div class="list-top">
            <strong>${escapeHTML(goal.name)}</strong>
            <span>${percent}%</span>
          </div>
          <div class="progress"><span style="--value: ${percent}%"></span></div>
          <p>${money(goal.saved)} saved of ${money(goal.target)}. Completion prediction: ${months === 0 ? "completed" : `${months} month${months > 1 ? "s" : ""}`}.</p>
          ${editable ? `<button class="icon-btn" type="button" data-delete-goal="${goal.id}">Delete</button>` : ""}
        </div>
      `;
    }).join("");

    $$("[data-delete-goal]", container).forEach((button) => {
      button.addEventListener("click", () => {
        state.goals = state.goals.filter((goal) => goal.id !== button.dataset.deleteGoal);
        saveState();
        renderGoals(selector, editable);
        showToast("Savings goal deleted.", "warning");
      });
    });
  }

  function renderSubscriptions(selector, editable) {
    const container = $(selector);
    if (!container) return;
    if (!state.subscriptions.length) {
      container.innerHTML = `<div class="list-item"><p>No subscriptions tracked yet.</p></div>`;
      return;
    }

    container.innerHTML = state.subscriptions.map((subscription) => `
      <div class="list-item">
        <div class="list-top">
          <strong>${escapeHTML(subscription.name)}</strong>
          <span>${money(subscription.amount)}</span>
        </div>
        <p>${subscription.category} renewal on ${formatDate(subscription.renewal)}. ${daysUntil(subscription.renewal)} day${daysUntil(subscription.renewal) === 1 ? "" : "s"} left.</p>
        ${editable ? `<button class="icon-btn" type="button" data-delete-subscription="${subscription.id}">Delete</button>` : ""}
      </div>
    `).join("");

    $$("[data-delete-subscription]", container).forEach((button) => {
      button.addEventListener("click", () => {
        state.subscriptions = state.subscriptions.filter((subscription) => subscription.id !== button.dataset.deleteSubscription);
        saveState();
        renderSubscriptions(selector, editable);
        showToast("Subscription deleted.", "warning");
      });
    });
  }

  function daysUntil(dateString) {
    const today = new Date();
    const target = new Date(`${dateString}T00:00:00`);
    const diff = target - new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return Math.max(0, Math.ceil(diff / 86400000));
  }

  function renderAdminStats() {
    setText("#adminUsers", state.admin.users.toLocaleString("en-IN"));
    setText("#adminTransactions", state.expenses.length.toLocaleString("en-IN"));
    setText("#adminRetention", `${state.admin.retention}%`);
  }

  function createChart(id, config) {
    const canvas = document.getElementById(id);
    if (!canvas) return;

    if (!window.Chart) {
      const wrap = canvas.parentElement;
      if (wrap) {
        wrap.innerHTML = `<div class="list-item"><p>Chart.js could not load. Check your internet connection for CDN assets.</p></div>`;
      }
      return;
    }

    if (chartInstances[id]) {
      chartInstances[id].destroy();
    }

    chartInstances[id] = new Chart(canvas, config);
  }

  function chartOptions(extra = {}) {
    const textColor = getComputedStyle(document.documentElement).getPropertyValue("--muted").trim();
    const lineColor = getComputedStyle(document.documentElement).getPropertyValue("--line").trim();
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: textColor, usePointStyle: true, boxWidth: 8 }
        }
      },
      scales: extra.cutout ? undefined : {
        x: { ticks: { color: textColor }, grid: { color: lineColor } },
        y: { ticks: { color: textColor }, grid: { color: lineColor } }
      },
      ...extra
    };
  }

  function exportCSV() {
    const rows = [
      ["Date", "Merchant", "Description", "Category", "Amount", "Currency", "Payment Method"],
      ...state.expenses.map((expense) => [
        expense.date,
        expense.merchant,
        expense.description || "",
        expense.category,
        numericDisplay(expense.amount),
        state.profile.currency,
        expense.method || "UPI"
      ])
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadFile("expense-tracker-ai-report.csv", csv, "text/csv;charset=utf-8");
    showToast("CSV export downloaded.", "success");
  }

  function exportPDF() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      showToast("PDF export needs the jsPDF CDN. Try again when online.", "warning");
      return;
    }

    const doc = new window.jspdf.jsPDF();
    const expense = monthlyExpense();
    const savings = currentSavings();
    let y = 18;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Expense Tracker AI Report", 14, y);
    y += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Profile: ${state.profile.name} (${state.profile.currency})`, 14, y);
    y += 8;
    doc.text(`Income: ${money(state.profile.income)} | Expense: ${money(expense)} | Savings: ${money(savings)}`, 14, y);
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Recent Expenses", 14, y);
    y += 8;
    doc.setFont("helvetica", "normal");

    state.expenses.slice(0, 16).forEach((expenseItem) => {
      const line = `${expenseItem.date} - ${expenseItem.merchant} - ${expenseItem.category} - ${money(expenseItem.amount)}`;
      doc.text(line.slice(0, 92), 14, y);
      y += 7;
      if (y > 280) {
        doc.addPage();
        y = 18;
      }
    });

    doc.save("expense-tracker-ai-report.pdf");
    showToast("PDF export downloaded.", "success");
  }

  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function showToast(message, type = "success") {
    const stack = $(".toast-stack");
    if (!stack) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    stack.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(18px)";
      setTimeout(() => toast.remove(), 220);
    }, 3200);
  }

  function setText(selector, value) {
    const element = $(selector);
    if (element) element.textContent = value;
  }

  function capitalize(value) {
    return String(value).charAt(0).toUpperCase() + String(value).slice(1);
  }

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
