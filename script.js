
/* ========================================
   EXPENSE TRACKER - COMPLETE JAVASCRIPT
======================================== */

/* CONNECT HTML ELEMENTS */
const form = document.getElementById("transactionForm");
const budgetForm = document.getElementById("budgetForm");
const monthlyBudgetInput = document.getElementById("monthlyBudget");
const budgetStatus = document.getElementById("budgetStatus");
const budgetProgressBar = document.getElementById("budgetProgressBar");
const budgetMessage = document.getElementById("budgetMessage");

const categoryInput = document.getElementById("category");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const dateInput = document.getElementById("date");

const transactionList = document.getElementById("transactionList");
const balanceDisplay = document.getElementById("balance");
const incomeDisplay = document.getElementById("income");
const expensesDisplay = document.getElementById("expenses");
const darkModeToggle = document.getElementById("darkModeToggle");
const downloadReportButton = document.getElementById("downloadReport");

const transactionSearchInput =
    document.getElementById("searchTransactions");
const transactionTypeFilter =
    document.getElementById("filterType");
const transactionCategoryFilter =
    document.getElementById("filterCategory");


/* LOAD SAVED TRANSACTIONS */
let transactions = [];

try {
    const savedTransactions = JSON.parse(
        localStorage.getItem("expenseTrackerTransactions")
    );

    if (Array.isArray(savedTransactions)) {
        transactions = savedTransactions;
    }
} catch (error) {
    transactions = [];
}


/* LOAD SAVED MONTHLY BUDGET */
let monthlyBudget =
    Number(localStorage.getItem("expenseTrackerMonthlyBudget")) || 0;


/* GET TODAY'S DATE */
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/* FORMAT MONEY IN KENYAN SHILLINGS */
function formatMoney(amount) {
    return new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(amount) || 0);
}


/* SAVE TRANSACTIONS */
function saveTransactions() {
    localStorage.setItem(
        "expenseTrackerTransactions",
        JSON.stringify(transactions)
    );
}


/* ========================================
   EXPENSE CHART
======================================== */
function drawExpenseChart() {
    const canvas = document.getElementById("expenseChart");

    if (!canvas) {
        return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
        return;
    }

    const expensesByCategory = {};

    transactions
        .filter(transaction => transaction.type === "expense")
        .forEach(transaction => {
            const category = transaction.category || "Uncategorized";

            expensesByCategory[category] =
                (expensesByCategory[category] || 0) +
                Number(transaction.amount);
        });

    const categories = Object.keys(expensesByCategory);
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (categories.length === 0) {
        ctx.font = "16px Arial";
        ctx.fillStyle = "#6b7280";
        ctx.textAlign = "center";
        ctx.fillText(
            "Add an expense to see your chart.",
            width / 2,
            height / 2
        );
        return;
    }

    const maxAmount = Math.max(
        ...Object.values(expensesByCategory)
    );

    const chartLeft = 120;
    const chartRight = width - 70;
    const chartWidth = chartRight - chartLeft;
    const barHeight = 24;
    const gap = 14;
    const totalHeight = categories.length * (barHeight + gap);
    const startY = Math.max(10, (height - totalHeight) / 2);

    categories.forEach((category, index) => {
        const y = startY + index * (barHeight + gap);

        const barWidth = maxAmount > 0
            ? (expensesByCategory[category] / maxAmount) * chartWidth
            : 0;

        ctx.fillStyle = "#374151";
        ctx.font = "12px Arial";
        ctx.textAlign = "right";

        ctx.fillText(
            category.length > 14
                ? category.slice(0, 14) + "…"
                : category,
            chartLeft - 10,
            y + 16
        );

        ctx.fillStyle = "#7c3aed";
        ctx.fillRect(chartLeft, y, barWidth, barHeight);

        ctx.fillStyle = "#111827";
        ctx.textAlign = "left";

        ctx.fillText(
            Number(expensesByCategory[category]).toLocaleString("en-KE"),
            Math.min(chartLeft + barWidth + 5, width - 65),
            y + 16
        );
    });
}


/* ========================================
   UPDATE BALANCE, INCOME AND EXPENSES
======================================== */
function updateSummary() {
    const income = transactions
        .filter(transaction => transaction.type === "income")
        .reduce((total, transaction) => {
            return total + Number(transaction.amount);
        }, 0);

    const expenses = transactions
        .filter(transaction => transaction.type === "expense")
        .reduce((total, transaction) => {
            return total + Number(transaction.amount);
        }, 0);

    const balance = income - expenses;

    if (balanceDisplay) {
        balanceDisplay.textContent = formatMoney(balance);
    }

    if (incomeDisplay) {
        incomeDisplay.textContent = formatMoney(income);
    }

    if (expensesDisplay) {
        expensesDisplay.textContent = formatMoney(expenses);
    }

    updateBudget();
    drawExpenseChart();
}


/* ========================================
   UPDATE MONTHLY BUDGET
======================================== */
function updateBudget() {
    if (!budgetStatus || !budgetProgressBar || !budgetMessage) {
        return;
    }

    const currentMonth = getTodayDate().slice(0, 7);

    const monthlyExpenses = transactions
        .filter(transaction =>
            transaction.type === "expense" &&
            transaction.date &&
            transaction.date.slice(0, 7) === currentMonth
        )
        .reduce((total, transaction) => {
            return total + Number(transaction.amount);
        }, 0);

    if (monthlyBudget <= 0) {
        budgetStatus.textContent = "No budget set yet";
        budgetProgressBar.style.width = "0%";
        budgetProgressBar.style.backgroundColor = "#7c3aed";

        budgetMessage.textContent =
            "Enter your monthly budget to track your spending.";

        return;
    }

    const percentage = (monthlyExpenses / monthlyBudget) * 100;
    const displayedPercentage = Math.min(percentage, 100);

    budgetStatus.textContent =
        `${formatMoney(monthlyExpenses)} spent of ${formatMoney(monthlyBudget)}`;

    budgetProgressBar.style.width = displayedPercentage + "%";

    if (percentage >= 100) {
        budgetProgressBar.style.backgroundColor = "#dc2626";

        budgetMessage.textContent =
            `Budget exceeded by ${formatMoney(monthlyExpenses - monthlyBudget)}.`;
    } else if (percentage >= 80) {
        budgetProgressBar.style.backgroundColor = "#f59e0b";

        budgetMessage.textContent =
            `${percentage.toFixed(1)}% used. You're getting close to your limit!`;
    } else {
        budgetProgressBar.style.backgroundColor = "#7c3aed";

        budgetMessage.textContent =
            `${percentage.toFixed(1)}% used. ${formatMoney(monthlyBudget - monthlyExpenses)} remaining.`;
    }
}


/* ========================================
   SAVE MONTHLY BUDGET
======================================== */
if (budgetForm) {
    budgetForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const enteredBudget = Number(monthlyBudgetInput.value);

        if (!Number.isFinite(enteredBudget) || enteredBudget <= 0) {
            alert("Please enter a valid budget greater than zero.");
            return;
        }

        monthlyBudget = enteredBudget;

        localStorage.setItem(
            "expenseTrackerMonthlyBudget",
            String(monthlyBudget)
        );

        updateBudget();

        alert("Monthly budget saved successfully!");
    });
}


/* ========================================
   ADD A NEW TRANSACTION
======================================== */
if (form) {
    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const description = descriptionInput.value.trim();
        const amount = Number(amountInput.value);
        const type = typeInput.value;
        const category = categoryInput
            ? categoryInput.value
            : "Other";
        const date = dateInput.value || getTodayDate();

        if (!description) {
            alert("Please enter a description.");
            return;
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            alert("Please enter an amount greater than zero.");
            return;
        }

        if (type !== "income" && type !== "expense") {
            alert("Please select income or expense.");
            return;
        }

        const transaction = {
            id: Date.now().toString() +
                Math.random().toString(16).slice(2),
            description: description,
            amount: amount,
            type: type,
            category: category,
            date: date
        };

        transactions.push(transaction);

        saveTransactions();
        displayTransactions();
        updateSummary();

        form.reset();

        if (dateInput) {
            dateInput.value = getTodayDate();
        }
    });
}


/* ========================================
   EDIT A TRANSACTION
======================================== */
function editTransaction(transaction) {
    const newDescription = prompt(
        "Edit transaction description:",
        transaction.description
    );

    if (newDescription === null) {
        return;
    }

    const cleanedDescription = newDescription.trim();

    if (cleanedDescription === "") {
        alert("Description cannot be empty.");
        return;
    }

    const newAmountText = prompt(
        "Edit transaction amount (KSh):",
        String(transaction.amount)
    );

    if (newAmountText === null) {
        return;
    }

    const newAmount = Number(newAmountText);

    if (!Number.isFinite(newAmount) || newAmount <= 0) {
        alert("Please enter a valid amount greater than zero.");
        return;
    }

    const newTypeText = prompt(
        "Enter transaction type: income or expense",
        transaction.type
    );

    if (newTypeText === null) {
        return;
    }

    const newType = newTypeText.trim().toLowerCase();

    if (newType !== "income" && newType !== "expense") {
        alert("Type must be income or expense.");
        return;
    }

    const newCategoryText = prompt(
        "Edit category:",
        transaction.category || "Other"
    );

    if (newCategoryText === null) {
        return;
    }

    const cleanedCategory = newCategoryText.trim();

    if (cleanedCategory === "") {
        alert("Category cannot be empty.");
        return;
    }

    const newDateText = prompt(
        "Edit date (YYYY-MM-DD):",
        transaction.date || getTodayDate()
    );

    if (newDateText === null) {
        return;
    }

    const cleanedDate = newDateText.trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanedDate) ||
        Number.isNaN(Date.parse(cleanedDate + "T00:00:00"))) {
        alert("Please enter a valid date in YYYY-MM-DD format.");
        return;
    }

    /* UPDATE THE EXISTING TRANSACTION */
    transaction.description = cleanedDescription;
    transaction.amount = newAmount;
    transaction.type = newType;
    transaction.category = cleanedCategory;
    transaction.date = cleanedDate;

    /* SAVE AND REFRESH EVERYTHING */
    saveTransactions();
    displayTransactions();
    updateSummary();
}


/* ========================================
   DISPLAY TRANSACTIONS
======================================== */
function displayTransactions() {
    if (!transactionList) {
        return;
    }

    transactionList.innerHTML = "";

    const searchText = transactionSearchInput
        ? transactionSearchInput.value.toLowerCase().trim()
        : "";

    const selectedType = transactionTypeFilter
        ? transactionTypeFilter.value
        : "all";

    const selectedCategory = transactionCategoryFilter
        ? transactionCategoryFilter.value
        : "all";

    const filteredTransactions = transactions.filter(transaction => {
        const matchesSearch = (transaction.description || "")
            .toLowerCase()
            .includes(searchText);

        const matchesType =
            selectedType === "all" ||
            transaction.type === selectedType;

        const matchesCategory =
            selectedCategory === "all" ||
            transaction.category === selectedCategory;

        return matchesSearch && matchesType && matchesCategory;
    });

    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
        const dateDifference =
            (b.date || "").localeCompare(a.date || "");

        if (dateDifference !== 0) {
            return dateDifference;
        }

        return String(b.id || "").localeCompare(String(a.id || ""));
    });

    if (sortedTransactions.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "empty-message";

        emptyMessage.textContent = transactions.length === 0
            ? "No transactions yet. Add your first one!"
            : "No matching transactions found.";

        transactionList.appendChild(emptyMessage);
        return;
    }

    sortedTransactions.forEach(function (transaction) {
        const item = document.createElement("div");
        item.className = "transaction-item";

        /* TRANSACTION DETAILS */
        const details = document.createElement("div");
        details.className = "transaction-details";

        const title = document.createElement("h3");
        title.textContent = transaction.description;

        const info = document.createElement("p");

        const category = transaction.category || "Uncategorized";
        const date = transaction.date || "";

        info.textContent = `${category} • ${date}`;

        /* TRANSACTION AMOUNT */
        const amount = document.createElement("p");

        amount.className = transaction.type === "income"
            ? "income"
            : "expense";

        const sign = transaction.type === "income" ? "+" : "-";

        amount.textContent =
            `${sign}${formatMoney(transaction.amount)}`;

        /* EDIT BUTTON */
        const editButton = document.createElement("button");

        editButton.type = "button";
        editButton.textContent = "Edit";
        editButton.className = "edit-button";

        editButton.addEventListener("click", function () {
            editTransaction(transaction);
        });

        /* DELETE BUTTON */
        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-button";

        deleteButton.addEventListener("click", function () {
            const confirmed = confirm(
                "Are you sure you want to delete this transaction?"
            );

            if (!confirmed) {
                return;
            }

            transactions = transactions.filter(savedTransaction =>
                String(savedTransaction.id) !==
                String(transaction.id)
            );

            saveTransactions();
            displayTransactions();
            updateSummary();
        });

        /* ADD ALL ELEMENTS TO THE TRANSACTION */
        details.appendChild(title);
        details.appendChild(info);

        item.appendChild(details);
        item.appendChild(amount);
        item.appendChild(editButton);
        item.appendChild(deleteButton);

        transactionList.appendChild(item);
    });
}


/* ========================================
   DOWNLOAD TRANSACTIONS REPORT
======================================== */
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
            transaction.category || "Uncategorized",
            transaction.date || ""
        ]);

        const csvContent = [
            headings.map(escapeCSV).join(","),
            ...rows.map(row => row.map(escapeCSV).join(","))
        ].join("\r\n");

        const file = new Blob(
            ["\uFEFF" + csvContent],
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


/* ========================================
   DARK MODE
======================================== */
if (darkModeToggle) {
    const savedDarkMode =
        localStorage.getItem("expenseTrackerDarkMode");

    if (savedDarkMode === "enabled") {
        document.body.classList.add("dark-mode");
        darkModeToggle.textContent = "☀️ Light Mode";
    }

    darkModeToggle.addEventListener("click", function () {
        document.body.classList.toggle("dark-mode");

        const isDarkMode =
            document.body.classList.contains("dark-mode");

        localStorage.setItem(
            "expenseTrackerDarkMode",
            isDarkMode ? "enabled" : "disabled"
        );

        darkModeToggle.textContent = isDarkMode
            ? "☀️ Light Mode"
            : "🌙 Dark Mode";
    });
}


/* ========================================
   SEARCH AND FILTER LISTENERS
======================================== */
if (transactionSearchInput) {
    transactionSearchInput.addEventListener(
        "input",
        displayTransactions
    );
}

if (transactionTypeFilter) {
    transactionTypeFilter.addEventListener(
        "change",
        displayTransactions
    );
}

if (transactionCategoryFilter) {
    transactionCategoryFilter.addEventListener(
        "change",
        displayTransactions
    );
}


/* ========================================
   INITIALIZE THE APP
======================================== */
if (dateInput && !dateInput.value) {
    dateInput.value = getTodayDate();
}

displayTransactions();
updateSummary();

/* ========================================
   MONTHLY EXPENSE HISTORY
======================================== */

const historyMonthInput = document.getElementById("historyMonth");
const historyTotalDisplay = document.getElementById("historyTotal");
const historyIncomeDisplay = document.getElementById("historyIncome");
const historyDifferenceDisplay = document.getElementById("historyDifference");

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

    const monthlyTransactions = transactions.filter(transaction =>
        transaction.date &&
        transaction.date.slice(0, 7) === selectedMonth
    );

    const monthlyExpenses = monthlyTransactions
        .filter(transaction => transaction.type === "expense")
        .reduce((total, transaction) => total + Number(transaction.amount), 0);

    const monthlyIncome = monthlyTransactions
        .filter(transaction => transaction.type === "income")
        .reduce((total, transaction) => total + Number(transaction.amount), 0);

    const difference = monthlyIncome - monthlyExpenses;

    historyTotalDisplay.textContent = formatMoney(monthlyExpenses);
    historyIncomeDisplay.textContent = formatMoney(monthlyIncome);
    historyDifferenceDisplay.textContent = formatMoney(difference);

    historyDifferenceDisplay.style.color = difference < 0
        ? "#dc2626"
        : "#16a34a";
}

/* SELECT THE CURRENT MONTH BY DEFAULT */
if (historyMonthInput) {
    historyMonthInput.value = getTodayDate().slice(0, 7);

    historyMonthInput.addEventListener("change", updateMonthlyHistory);
}

/* REFRESH HISTORY WHEN TRANSACTIONS CHANGE */
const originalDisplayTransactions = displayTransactions;

displayTransactions = function () {
    originalDisplayTransactions();
    updateMonthlyHistory();
};

updateMonthlyHistory();
