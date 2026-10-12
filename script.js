
const form = document.getElementById("transactionForm");
const categoryInput = document.getElementById("category");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const dateInput = document.getElementById("date");

const balanceDisplay = document.getElementById("balance");
const incomeDisplay = document.getElementById("income");
const expensesDisplay = document.getElementById("expenses");
const transactionList = document.getElementById("transactionList");
const darkModeToggle = document.getElementById("darkModeToggle");

const TRANSACTIONS_KEY = "expenseTrackerTransactions";
const THEME_KEY = "expenseTrackerTheme";

let transactions = [];

try {
    const savedTransactions = JSON.parse(
        localStorage.getItem(TRANSACTIONS_KEY) || "[]"
    );

    if (Array.isArray(savedTransactions)) {
        transactions = savedTransactions.filter(transaction =>
            transaction &&
            typeof transaction.description === "string" &&
            Number.isFinite(Number(transaction.amount)) &&
            Number(transaction.amount) > 0 &&
            ["income", "expense"].includes(transaction.type) &&
            typeof transaction.date === "string"
        ).map(transaction => ({
            ...transaction,
            amount: Number(transaction.amount),
            id: transaction.id || (
                Date.now().toString() + Math.random().toString(16).slice(2)
            )
        }));
    }
} catch (error) {
    console.error("Could not load saved transactions:", error);
}

function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatMoney(amount) {
    return "KSh " + amount.toLocaleString("en-KE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function saveTransactions() {
    try {
        localStorage.setItem(
            TRANSACTIONS_KEY,
            JSON.stringify(transactions)
        );
    } catch (error) {
        alert("Your browser could not save the transactions.");
        console.error(error);
    }
}

/* DARK MODE */
function updateThemeButton() {
    const isDark = document.body.classList.contains("dark-mode");

    darkModeToggle.textContent = isDark
        ? "☀️ Light Mode"
        : "🌙 Dark Mode";

    darkModeToggle.setAttribute("aria-pressed", String(isDark));
}

try {
    if (localStorage.getItem(THEME_KEY) === "dark") {
        document.body.classList.add("dark-mode");
    }
} catch (error) {
    console.error("Could not load saved theme:", error);
}

updateThemeButton();

darkModeToggle.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");

    const isDark = document.body.classList.contains("dark-mode");

    try {
        localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
    } catch (error) {
        console.error("Could not save theme:", error);
    }

    updateThemeButton();
});

/* SUMMARY CARDS */
function updateSummary() {
    const totalIncome = transactions
        .filter(transaction => transaction.type === "income")
        .reduce((total, transaction) => total + transaction.amount, 0);

    const totalExpenses = transactions
        .filter(transaction => transaction.type === "expense")
        .reduce((total, transaction) => total + transaction.amount, 0);

    balanceDisplay.textContent = formatMoney(totalIncome - totalExpenses);
    incomeDisplay.textContent = formatMoney(totalIncome);
    expensesDisplay.textContent = formatMoney(totalExpenses);
}

/* TRANSACTION LIST */
function displayTransactions() {
    transactionList.replaceChildren();

    if (transactions.length === 0) {
        const message = document.createElement("p");
        message.className = "empty-message";
        message.textContent = "No transactions yet. Add your first one!";
        transactionList.appendChild(message);
        return;
    }

    const sortedTransactions = [...transactions].sort(
        (a, b) => b.date.localeCompare(a.date)
    );

    sortedTransactions.forEach(transaction => {
        const item = document.createElement("div");
        item.className = "transaction";

        const info = document.createElement("div");
        info.className = "transaction-info";

        const title = document.createElement("h3");
        title.textContent = transaction.description;

        const date = document.createElement("p");
        date.textContent = transaction.date;

        info.append(title, date);

        const details = document.createElement("div");

        const amount = document.createElement("p");
        const isIncome = transaction.type === "income";

        amount.className = "transaction-amount " +
            (isIncome ? "income-text" : "expense-text");

        amount.textContent =
            (isIncome ? "+ " : "- ") + formatMoney(transaction.amount);

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function () {
            transactions = transactions.filter(
                saved => saved.id !== transaction.id
            );

            saveTransactions();
            updateSummary();
            displayTransactions();
        });

        details.append(amount, deleteButton);
        item.append(info, details);
        transactionList.appendChild(item);
    });
}

/* ADD TRANSACTION */
form.addEventListener("submit", function (event) {
    event.preventDefault();

    const description = descriptionInput.value.trim();
    const amount = Number(amountInput.value);
    const type = typeInput.value;
    const date = dateInput.value;

    if (!description || !Number.isFinite(amount) || amount <= 0 || !date) {
        alert("Please enter a description, a valid amount, and a date.");
        return;
    }

    transactions.push({
        id: Date.now().toString() + Math.random().toString(16).slice(2),
        description,
        amount,
        type,
        date
    });

    saveTransactions();
    updateSummary();
    displayTransactions();

    form.reset();
    dateInput.value = getTodayDate();
});

/* INITIAL PAGE SETUP */
dateInput.value = getTodayDate();
updateSummary();
displayTransactions();
