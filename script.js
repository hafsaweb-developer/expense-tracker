/* =========================================
   EXPENSE TRACKER - COMPLETE JAVASCRIPT
========================================= */

/* CONNECT HTML ELEMENTS */
const form = document.getElementById("transactionForm");
const submitButton = form
    ? form.querySelector('button[type="submit"]')
    : null;
const originalSubmitButtonText = submitButton
    ? submitButton.textContent
    : "Add Transaction";

const budgetForm = document.getElementById("budgetForm");
const monthlyBudgetInput = document.getElementById("monthlyBudget");

const balanceDisplay = document.getElementById("balance");
const incomeDisplay = document.getElementById("income");
const expensesDisplay = document.getElementById("expenses");

const budgetStatus = document.getElementById("budgetStatus");
const budgetProgressBar = document.getElementById("budgetProgressBar");
const budgetMessage = document.getElementById("budgetMessage");

const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");

const transactionList = document.getElementById("transactionList");
const searchInput = document.getElementById("searchTransactions");
const typeFilter = document.getElementById("filterType");
const categoryFilter = document.getElementById("filterCategory");

const darkModeToggle = document.getElementById("darkModeToggle");
const downloadReportButton = document.getElementById("downloadReport");

const historyMonthInput = document.getElementById("historyMonth");
const historyTotalDisplay = document.getElementById("historyTotal");
const historyIncomeDisplay = document.getElementById("historyIncome");
const historyDifferenceDisplay = document.getElementById("historyDifference");

const chart = document.getElementById("expenseChart");


/* =========================================
   LOAD SAVED DATA
   Keep the existing storage keys.
========================================= */

function loadTransactions() {
    try {
        const saved = localStorage.getItem("expenseTrackerTransactions");

        if (!saved) {
            return [];
        }

        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Could not read saved transactions:", error);
        alert(
            "Your saved transactions could not be read. " +
            "Please do not clear browser storage."
        );
        return [];
    }
}

let transactions = loadTransactions();
let editingTransactionId = null;

let monthlyBudget = 0;

try {
    monthlyBudget =
        Number(localStorage.getItem("expenseTrackerMonthlyBudget")) || 0;
} catch (error) {
    console.error("Could not read saved budget:", error);
}


/* =========================================
   HELPER FUNCTIONS
========================================= */

function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatMoney(value) {
    const amount = Number(value) || 0;

    return "KSh " + amount.toLocaleString("en-KE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function normalizeCategory(value) {
    const category = String(value || "Other").trim().toLowerCase();

    const knownCategories = {
        food: "Food",
        transport: "Transport",
        rent: "Rent",
        shopping: "Shopping",
        bills: "Bills",
        health: "Health",
        education: "Education",
        salary: "Salary",
        business: "Business",
        other: "Other"
    };

    return knownCategories[category] || String(value || "Other").trim();
}

function saveTransactions() {
    try {
        localStorage.setItem(
            "expenseTrackerTransactions",
            JSON.stringify(transactions)
        );

        return true;
    } catch (error) {
        console.error("Could not save transactions:", error);

        alert(
            "The browser could not save your changes. " +
            "Please check available storage."
        );

        return false;
    }
}


/* =========================================
   SUMMARY CARDS
========================================= */

function updateSummary() {
    const income = transactions
        .filter(item => item.type === "income")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const expenses = transactions
        .filter(item => item.type === "expense")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    if (balanceDisplay) {
        balanceDisplay.textContent = formatMoney(income - expenses);
    }

    if (incomeDisplay) {
        incomeDisplay.textContent = formatMoney(income);
    }

    if (expensesDisplay) {
        expensesDisplay.textContent = formatMoney(expenses);
    }

    updateBudget();
    updateMonthlyHistory();
    drawExpenseChart();
}


/* =========================================
   MONTHLY BUDGET
========================================= */

function updateBudget() {
    if (!budgetStatus || !budgetProgressBar || !budgetMessage) {
        return;
    }

    const currentMonth = getTodayDate().slice(0, 7);

    const monthlyExpenses = transactions
        .filter(item =>
            item.type === "expense" &&
            item.date &&
            item.date.slice(0, 7) === currentMonth
        )
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    if (monthlyBudget <= 0) {
        budgetStatus.textContent = "No budget set yet";
        budgetProgressBar.style.width = "0%";
        budgetProgressBar.style.backgroundColor = "#6d4aff";

        budgetMessage.textContent =
            "Enter your monthly budget to track your spending.";

        return;
    }

    const percentage = (monthlyExpenses / monthlyBudget) * 100;
    const shownPercentage = Math.min(percentage, 100);

    budgetStatus.textContent =
        `${formatMoney(monthlyExpenses)} spent of ${formatMoney(monthlyBudget)}`;

    budgetProgressBar.style.width = `${shownPercentage}%`;

    if (percentage >= 100) {
        budgetProgressBar.style.backgroundColor = "#dc2626";

        budgetMessage.textContent =
            `Budget exceeded by ${formatMoney(monthlyExpenses - monthlyBudget)}.`;

    } else if (percentage >= 80) {
        budgetProgressBar.style.backgroundColor = "#f59e0b";

        budgetMessage.textContent =
            `${percentage.toFixed(1)}% used. You're getting close to your limit!`;

    } else {
        budgetProgressBar.style.backgroundColor = "#16a34a";

        budgetMessage.textContent =
            `${percentage.toFixed(1)}% used. ` +
            `${formatMoney(monthlyBudget - monthlyExpenses)} remaining.`;
    }
}

if (budgetForm) {
    budgetForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const enteredBudget = Number(monthlyBudgetInput.value);

        if (!Number.isFinite(enteredBudget) || enteredBudget <= 0) {
            alert("Please enter a budget greater than zero.");
            return;
        }

        try {
            localStorage.setItem(
                "expenseTrackerMonthlyBudget",
                String(enteredBudget)
            );
        } catch (error) {
            alert("The browser could not save your budget.");
            return;
        }

        monthlyBudget = enteredBudget;
        updateBudget();

        alert("Monthly budget saved successfully!");
    });
}


/* =========================================
   ADD AND UPDATE TRANSACTION
========================================= */

if (form) {
    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const description = descriptionInput.value.trim();
        const amount = Number(amountInput.value);
        const type = typeInput.value;
        const category = normalizeCategory(categoryInput.value);
        const date = dateInput.value || getTodayDate();

        if (!description) {
            alert("Please enter a description.");
            return;
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            alert("Please enter an amount greater than zero.");
            return;
        }

        if (!["income", "expense"].includes(type)) {
            alert("Please select income or expense.");
            return;
        }

        /*
          EDIT MODE:
          Update the existing transaction instead
          of creating a duplicate.
        */

        if (editingTransactionId !== null) {
            const existingTransaction = transactions.find(
                item =>
                    String(item.id) === String(editingTransactionId)
            );

            if (!existingTransaction) {
                alert(
                    "This transaction could not be found. " +
                    "Please try again."
                );

                editingTransactionId = null;

                if (submitButton) {
                    submitButton.textContent = originalSubmitButtonText;
                }

                return;
            }

            const previousTransaction = { ...existingTransaction };

            existingTransaction.description = description;
            existingTransaction.amount = amount;
            existingTransaction.type = type;
            existingTransaction.category = category;
            existingTransaction.date = date;

            if (!saveTransactions()) {
                Object.assign(
                    existingTransaction,
                    previousTransaction
                );

                return;
            }

            editingTransactionId = null;

            if (submitButton) {
                submitButton.textContent = originalSubmitButtonText;
            }

        } else {

            /*
              ADD MODE:
              Create a new transaction as usual.
            */

            const transaction = {
                id: Date.now().toString() +
                    Math.random().toString(16).slice(2),
                description,
                amount,
                type,
                category,
                date
            };

            transactions.push(transaction);

            if (!saveTransactions()) {
                transactions.pop();
                return;
            }
        }

        form.reset();

        if (dateInput) {
            dateInput.value = getTodayDate();
        }

        displayTransactions();
        updateSummary();
    });
}


/* =========================================
   EDIT TRANSACTION
========================================= */

function editTransaction(transaction) {
    editingTransactionId = String(transaction.id);

    descriptionInput.value = transaction.description || "";
    amountInput.value = transaction.amount;
    typeInput.value = transaction.type;
    categoryInput.value = transaction.category || "Other";
    dateInput.value = transaction.date || getTodayDate();

    if (submitButton) {
        submitButton.textContent = "Save Changes";
    }

    form.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    descriptionInput.focus();
}


/* =========================================
   DISPLAY TRANSACTIONS
========================================= */

function displayTransactions() {
    if (!transactionList) {
        return;
    }

    transactionList.replaceChildren();

    const searchText = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    const selectedType = typeFilter ? typeFilter.value : "all";
    const selectedCategory = categoryFilter
        ? categoryFilter.value
        : "all";

    const filtered = transactions.filter(transaction => {
        const description =
            String(transaction.description || "").toLowerCase();

        const category = normalizeCategory(transaction.category);

        const matchesSearch =
            description.includes(searchText) ||
            category.toLowerCase().includes(searchText);

        const matchesType =
            selectedType === "all" ||
            transaction.type === selectedType;

        const matchesCategory =
            selectedCategory === "all" ||
            category.toLowerCase() === selectedCategory.toLowerCase();

        return matchesSearch && matchesType && matchesCategory;
    });

    filtered.sort((a, b) =>
        String(b.date || "").localeCompare(String(a.date || "")) ||
        String(b.id || "").localeCompare(String(a.id || ""))
    );

    if (filtered.length === 0) {
        const message = document.createElement("p");
        message.className = "empty-message";

        message.textContent = transactions.length === 0
            ? "No transactions yet. Add your first one!"
            : "No matching transactions found.";

        transactionList.appendChild(message);
        return;
    }

    filtered.forEach(transaction => {
        const item = document.createElement("article");
        item.className = "transaction-item";

        const details = document.createElement("div");
        details.className = "transaction-details";

        const title = document.createElement("h3");
        title.textContent =
            transaction.description || "Untitled transaction";

        const info = document.createElement("p");
        info.textContent =
            `${normalizeCategory(transaction.category)} • ` +
            `${transaction.date || "No date"}`;

        details.append(title, info);

        const amount = document.createElement("p");

        amount.className =
            transaction.type === "income" ? "income" : "expense";

        amount.textContent =
            `${transaction.type === "income" ? "+" : "−"}` +
            `${formatMoney(transaction.amount)}`;

        /* EDIT BUTTON */
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "edit-button";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", function () {
            editTransaction(transaction);
        });

        /* DELETE BUTTON */
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function () {
            if (
                !confirm(
                    "Are you sure you want to delete this transaction?"
                )
            ) {
                return;
            }

            const previousTransactions = transactions;

            transactions = transactions.filter(saved =>
                String(saved.id) !== String(transaction.id)
            );

            if (!saveTransactions()) {
                transactions = previousTransactions;
                return;
            }

            displayTransactions();
            updateSummary();
        });

        item.append(details, amount, editButton, deleteButton);

        transactionList.appendChild(item);
    });
}


/* =========================================
   SEARCH AND FILTERS
========================================= */

if (searchInput) {
    searchInput.addEventListener("input", displayTransactions);
}

if (typeFilter) {
    typeFilter.addEventListener("change", displayTransactions);
}

if (categoryFilter) {
    categoryFilter.addEventListener("change", displayTransactions);
}


/* =========================================
   DOWNLOAD CSV REPORT
========================================= */

if (downloadReportButton) {
    downloadReportButton.addEventListener("click", function () {
        if (transactions.length === 0) {
            alert("There are no transactions to download yet.");
            return;
        }

        const headings = [
            "Description",
            "Amount (KSh)",
            "Type",
            "Category",
            "Date"
        ];

        function escapeCSV(value) {
            return '"' +
                String(value ?? "").replace(/"/g, '""') +
                '"';
        }

        const rows = transactions.map(transaction => [
            transaction.description,
            transaction.amount,
            transaction.type,
            normalizeCategory(transaction.category),
            transaction.date || ""
        ]);

        const csv = [
            headings.map(escapeCSV).join(","),
            ...rows.map(row => row.map(escapeCSV).join(","))
        ].join("\r\n");

        const file = new Blob(
            ["\uFEFF" + csv],
            { type: "text/csv;charset=utf-8;" }
        );

        const url = URL.createObjectURL(file);
        const link = document.createElement("a");

        link.href = url;
        link.download = "expense-tracker-report.csv";

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    });
}


/* =========================================
   EXPENSE CHART
========================================= */

function drawExpenseChart() {
    if (!chart || typeof chart.getContext !== "function") {
        return;
    }

    const ctx = chart.getContext("2d");

    if (!ctx) {
        return;
    }

    const width = chart.width;
    const height = chart.height;

    const dark = document.body.classList.contains("dark-mode");
    const textColor = dark ? "#f9fafb" : "#374151";

    ctx.clearRect(0, 0, width, height);

    const totals = {};

    transactions
        .filter(transaction => transaction.type === "expense")
        .forEach(transaction => {
            const category = normalizeCategory(transaction.category);

            totals[category] =
                (totals[category] || 0) +
                Number(transaction.amount || 0);
        });

    const categories = Object.keys(totals).sort(
        (a, b) => totals[b] - totals[a]
    );

    ctx.font = "16px Arial";
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";

    if (categories.length === 0) {
        ctx.fillText(
            "Add an expense to see your chart.",
            width / 2,
            height / 2
        );

        return;
    }

    const left = 125;
    const right = 100;
    const top = 18;
    const barHeight = 25;
    const gap = 15;

    const maxBarWidth = width - left - right;
    const maxAmount = Math.max(...Object.values(totals));

    categories.forEach((category, index) => {
        const y = top + index * (barHeight + gap);

        if (y + barHeight > height) {
            return;
        }

        const barWidth = maxAmount > 0
            ? (totals[category] / maxAmount) * maxBarWidth
            : 0;

        ctx.textAlign = "right";
        ctx.font = "13px Arial";
        ctx.fillStyle = textColor;

        const label = category.length > 14
            ? category.slice(0, 13) + "…"
            : category;

        ctx.fillText(label, left - 10, y + 17);

        ctx.fillStyle = dark ? "#4c3b82" : "#ede9fe";
        ctx.fillRect(left, y, maxBarWidth, barHeight);

        ctx.fillStyle = "#7c3aed";
        ctx.fillRect(left, y, barWidth, barHeight);

        ctx.textAlign = "left";
        ctx.fillStyle = textColor;

        ctx.fillText(
            Number(totals[category]).toLocaleString("en-KE"),
            left + maxBarWidth + 8,
            y + 17
        );
    });
}


/* =========================================
   MONTHLY EXPENSE HISTORY
========================================= */

function updateMonthlyHistory() {
    if (
        !historyMonthInput ||
        !historyTotalDisplay ||
        !historyIncomeDisplay ||
        !historyDifferenceDisplay
    ) {
        return;
    }

    const selectedMonth = historyMonthInput.value;

    const monthTransactions = transactions.filter(transaction =>
        transaction.date &&
        transaction.date.slice(0, 7) === selectedMonth
    );

    const monthExpenses = monthTransactions
        .filter(transaction => transaction.type === "expense")
        .reduce(
            (sum, transaction) =>
                sum + Number(transaction.amount || 0),
            0
        );

    const monthIncome = monthTransactions
        .filter(transaction => transaction.type === "income")
        .reduce(
            (sum, transaction) =>
                sum + Number(transaction.amount || 0),
            0
        );

    const difference = monthIncome - monthExpenses;

    historyTotalDisplay.textContent = formatMoney(monthExpenses);
    historyIncomeDisplay.textContent = formatMoney(monthIncome);
    historyDifferenceDisplay.textContent = formatMoney(difference);

    historyDifferenceDisplay.style.color =
        difference < 0 ? "#dc2626" : "#16a34a";
}

if (historyMonthInput) {
    historyMonthInput.value = getTodayDate().slice(0, 7);

    historyMonthInput.addEventListener(
        "change",
        updateMonthlyHistory
    );
}


/* =========================================
   DARK MODE
========================================= */

if (darkModeToggle) {
    let savedDarkMode = "disabled";

    try {
        savedDarkMode =
            localStorage.getItem("expenseTrackerDarkMode") || "disabled";
    } catch (error) {
        console.error("Could not read dark mode preference:", error);
    }

    if (savedDarkMode === "enabled") {
        document.body.classList.add("dark-mode");
        darkModeToggle.textContent = "☀️ Light Mode";
    }

    darkModeToggle.addEventListener("click", function () {
        document.body.classList.toggle("dark-mode");

        const enabled =
            document.body.classList.contains("dark-mode");

        try {
            localStorage.setItem(
                "expenseTrackerDarkMode",
                enabled ? "enabled" : "disabled"
            );
        } catch (error) {
            console.error("Could not save dark mode preference:", error);
        }

        darkModeToggle.textContent =
            enabled ? "☀️ Light Mode" : "🌙 Dark Mode";

        drawExpenseChart();
    });
}


/* =========================================
   INITIALIZE APP
========================================= */

if (dateInput && !dateInput.value) {
    dateInput.value = getTodayDate();
}

displayTransactions();
updateSummary();
