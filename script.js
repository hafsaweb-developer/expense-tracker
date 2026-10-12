
const transactionForm = document.getElementById("transactionForm");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const dateInput = document.getElementById("date");

const balanceDisplay = document.getElementById("balance");
const incomeDisplay = document.getElementById("income");
const expensesDisplay = document.getElementById("expenses");
const transactionList = document.getElementById("transactionList");

// DARK MODE
const darkModeToggle = document.getElementById("darkModeToggle");

// Restore the saved theme
const savedTheme = localStorage.getItem("expenseTrackerTheme");

if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
}

updateDarkModeButton();

// Switch between light and dark mode
darkModeToggle.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");

    const isDarkMode = document.body.classList.contains("dark-mode");

    localStorage.setItem(
        "expenseTrackerTheme",
        isDarkMode ? "dark" : "light"
    );

    updateDarkModeButton();
});

// Update the button text
function updateDarkModeButton() {
    if (document.body.classList.contains("dark-mode")) {
        darkModeToggle.textContent = "☀️ Light Mode";
    } else {
        darkModeToggle.textContent = "🌙 Dark Mode";
    }
}

// LOAD SAVED TRANSACTIONS
let transactions = JSON.parse(
    localStorage.getItem("expenseTrackerTransactions")
) || [];

// Set today's date using the local calendar date
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

dateInput.value = getTodayDate();

// Format Kenyan shillings
function formatMoney(amount) {
    return "KSh " + amount.toLocaleString("en-KE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Save transactions
function saveTransactions() {
    localStorage.setItem(
        "expenseTrackerTransactions",
        JSON.stringify(transactions)
    );
}

// Update the summary cards
function updateSummary() {
    const totalIncome = transactions
        .filter(transaction => transaction.type === "income")
        .reduce((total, transaction) => total + transaction.amount, 0);

    const totalExpenses = transactions
        .filter(transaction => transaction.type === "expense")
        .reduce((total, transaction) => total + transaction.amount, 0);

    const balance = totalIncome - totalExpenses;

    balanceDisplay.textContent = formatMoney(balance);
    incomeDisplay.textContent = formatMoney(totalIncome);
    expensesDisplay.textContent = formatMoney(totalExpenses);
}

// Display transactions
function displayTransactions() {
    transactionList.innerHTML = "";

    if (transactions.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "empty-message";
        emptyMessage.textContent =
            "No transactions yet. Add your first one!";

        transactionList.appendChild(emptyMessage);
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

        info.appendChild(title);
        info.appendChild(date);

        const details = document.createElement("div");

        const amount = document.createElement("p");
        amount.className = "transaction-amount " +
            (transaction.type === "income"
                ? "income-text"
                : "expense-text");

        amount.textContent =
            (transaction.type === "income" ? "+ " : "- ") +
            formatMoney(transaction.amount);

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function () {
            transactions = transactions.filter(
                savedTransaction =>
                    savedTransaction.id !== transaction.id
            );

            saveTransactions();
            updateSummary();
            displayTransactions();
        });

        details.appendChild(amount);
        details.appendChild(deleteButton);

        item.appendChild(info);
        item.appendChild(details);

        transactionList.appendChild(item);
    });
}

// Add a transaction
transactionForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const description = descriptionInput.value.trim();
    const amount = Number(amountInput.value);
    const type = typeInput.value;
    const date = dateInput.value;

    if (
        !description ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        !date
    ) {
        alert("Please enter a description, a valid amount, and a date.");
        return;
    }

    const transaction = {
        id: Date.now().toString() +
            Math.random().toString(16).slice(2),
        description: description,
        amount: amount,
        type: type,
        date: date
    };

    transactions.push(transaction);

    saveTransactions();
    updateSummary();
    displayTransactions();

    transactionForm.reset();
    dateInput.value = getTodayDate();
});

// Display saved information on page load
updateSummary();
displayTransactions();
