
/* CONNECT HTML ELEMENTS */
const form = document.getElementById("transactionForm");
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

/* LOAD SAVED TRANSACTIONS */
let transactions = [];

try {
    transactions = JSON.parse(
        localStorage.getItem("expenseTrackerTransactions")
    ) || [];
} catch (error) {
    transactions = [];
}

/* CURRENCY FORMAT */
function formatMoney(amount) {
    return "KSh " + Number(amount).toLocaleString("en-KE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/* GET TODAY'S DATE */
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

/* SAVE TRANSACTIONS */
function saveTransactions() {
    localStorage.setItem(
        "expenseTrackerTransactions",
        JSON.stringify(transactions)
    );
}

/* UPDATE SUMMARY CARDS */
function updateSummary() {
    const income = transactions
        .filter(transaction => transaction.type === "income")
        .reduce((total, transaction) => total + Number(transaction.amount), 0);

    const expenses = transactions
        .filter(transaction => transaction.type === "expense")
        .reduce((total, transaction) => total + Number(transaction.amount), 0);

    const balance = income - expenses;

    balanceDisplay.textContent = formatMoney(balance);
    incomeDisplay.textContent = formatMoney(income);
    expensesDisplay.textContent = formatMoney(expenses);
}

/* DISPLAY TRANSACTIONS */
function displayTransactions() {
    transactionList.innerHTML = "";

    if (transactions.length === 0) {
        transactionList.innerHTML =
            '<p class="empty-message">No transactions yet. Add your first one!</p>';
        return;
    }

    const sortedTransactions = [...transactions].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
    );

    sortedTransactions.forEach(transaction => {
        const item = document.createElement("div");
        item.className = "transaction";

        const info = document.createElement("div");
        info.className = "transaction-info";

        const description = document.createElement("h3");
        description.textContent = transaction.description;

        const details = document.createElement("p");

        const categoryNames = {
            food: "Food",
            transport: "Transport",
            rent: "Rent",
            shopping: "Shopping",
            bills: "Bills",
            salary: "Salary",
            business: "Business",
            other: "Other"
        };

        const category = categoryNames[transaction.category] ||
            transaction.category ||
            "Uncategorized";

        details.textContent = `${transaction.date} • ${category}`;

        info.appendChild(description);
        info.appendChild(details);

        const rightSide = document.createElement("div");
        rightSide.className = "transaction-actions";

        const amount = document.createElement("span");
        amount.className = transaction.type === "income"
            ? "transaction-income"
            : "transaction-expense";

        const sign = transaction.type === "income" ? "+ " : "- ";
        amount.textContent = sign + formatMoney(transaction.amount);

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function () {
            const confirmed = confirm(
                "Are you sure you want to delete this transaction?"
            );

            if (!confirmed) return;

            transactions = transactions.filter(
                savedTransaction => savedTransaction.id !== transaction.id
            );

            saveTransactions();
            updateSummary();
            displayTransactions();
        });

        rightSide.appendChild(amount);
        rightSide.appendChild(deleteButton);

        item.appendChild(info);
        item.appendChild(rightSide);

        transactionList.appendChild(item);
    });
}

/* ADD A TRANSACTION */
form.addEventListener("submit", function (event) {
    event.preventDefault();

    const description = descriptionInput.value.trim();
    const amount = Number(amountInput.value);
    const type = typeInput.value;
    const category = categoryInput.value;
    const date = dateInput.value;

    if (
        !description ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        !date ||
        !category
    ) {
        alert("Please enter a description, valid amount, category, and date.");
        return;
    }

    const transaction = {
        id: Date.now().toString() + Math.random().toString(16).slice(2),
        description,
        amount,
        type,
        category,
        date
    };

    transactions.push(transaction);

    saveTransactions();
    updateSummary();
    displayTransactions();

    form.reset();
    dateInput.value = getTodayDate();
});

/* DARK MODE */
if (darkModeToggle) {
    darkModeToggle.addEventListener("click", function () {
        document.body.classList.toggle("dark-mode");

        const isDarkMode = document.body.classList.contains("dark-mode");

        darkModeToggle.textContent = isDarkMode
            ? "☀️ Light Mode"
            : "🌙 Dark Mode";

        localStorage.setItem("expenseTrackerDarkMode", isDarkMode);
    });

    if (localStorage.getItem("expenseTrackerDarkMode") === "true") {
        document.body.classList.add("dark-mode");
        darkModeToggle.textContent = "☀️ Light Mode";
    }
}

/* INITIAL PAGE SETUP */
dateInput.value = getTodayDate();
updateSummary();
displayTransactions();
