document.addEventListener('DOMContentLoaded', () => {

    // ==========================
    // CHART
    // ==========================
    const chartEl = document.getElementById('expenseChart');

    if (chartEl) {
        const ctx = chartEl.getContext('2d');

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Ads', 'Packaging', 'Salary'],
                datasets: [{
                    data: [12000, 3500, 8000],
                    backgroundColor: [
                        '#6366f1',
                        '#10b981',
                        '#f59e0b'
                    ]
                }]
            },
            options: {
                cutout: '70%'
            }
        });
    }

    // ==========================
    // SIDEBAR MENU
    // ==========================
    const menu = document.querySelector('.has-submenu > a');

    if (menu) {

        menu.addEventListener('click', function (e) {

            e.preventDefault();

            this.parentElement.classList.toggle('open');

            const sub = this.nextElementSibling;

            if (sub) {
                sub.style.display =
                    sub.style.display === 'block'
                        ? 'none'
                        : 'block';
            }

        });

    }

});


//=====================================
// DATA
//=====================================

let expenses =
    JSON.parse(localStorage.getItem("expenses")) || [];

let cats =
    JSON.parse(localStorage.getItem("cats")) || [
        "Ads",
        "Salary",
        "Packaging"
    ];


//=====================================
// SAVE
//=====================================

function saveExpenses() {

    localStorage.setItem(
        "expenses",
        JSON.stringify(expenses)
    );

}


//=====================================
// RENDER
//=====================================

function render() {


    //=========================
    // TABLE
    //=========================

    const body =
        document.getElementById("expBody");

    if (body) {

        body.innerHTML = expenses
            .slice()
            .reverse()
            .map((ex, index) => `

<tr>

<td>${ex.date}</td>

<td>${ex.cat}</td>

<td>${ex.title}</td>

<td>৳ ${Number(ex.amount).toLocaleString()}</td>

<td>

<button onclick="del(${expenses.length - 1 - index})">

Delete

</button>

</td>

</tr>

`).join("");

    }



    //=========================
    // CATEGORY
    //=========================

    const catSelect =
        document.getElementById("catSelect");

    if (catSelect) {

        catSelect.innerHTML = cats
            .map(c => `<option>${c}</option>`)
            .join("");

    }


    const catList =
        document.getElementById("catList");

    if (catList) {

        catList.innerHTML =
            cats
                .map(c => `<li>${c}</li>`)
                .join("");

    }



    //=========================
    // TOTAL
    //=========================

    const totalExpense =
        expenses.reduce(
            (sum, item) =>
                sum + Number(item.amount),
            0
        );


    const today =
        new Date()
            .toISOString()
            .split("T")[0];


    const todayExpense =
        expenses
            .filter(item => item.date === today)
            .reduce(
                (sum, item) =>
                    sum + Number(item.amount),
                0
            );


    localStorage.setItem(
        "totalExpenses",
        totalExpense
    );


    if (document.getElementById("monthExp")) {

        document.getElementById("monthExp")
            .innerText =
            totalExpense.toLocaleString();

    }


    if (document.getElementById("todayExp")) {

        document.getElementById("todayExp")
            .innerText =
            todayExpense.toLocaleString();

    }

}
//=====================================
// ADD EXPENSE
//=====================================

const expForm = document.getElementById("expForm");

if (expForm) {

    expForm.onsubmit = (e) => {

        e.preventDefault();

        const category =
            document.getElementById("catSelect").value;

        const title =
            document.getElementById("expTitle").value.trim();

        const amount =
            Number(document.getElementById("expAmount").value);

        const date =
            document.getElementById("expDate").value;

        if (!title) {
            alert("Please enter expense title.");
            return;
        }

        if (amount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        expenses.push({

            id: Date.now(),

            cat: category,

            title: title,

            amount: amount,

            date: date

        });

        saveExpenses();

        render();

        expForm.reset();

        alert("Expense added successfully!");

    };

}



//=====================================
// ADD CATEGORY
//=====================================

function addCat() {

    const input =
        document.getElementById("newCat");

    if (!input) return;

    const value = input.value.trim();

    if (value === "") {

        alert("Category name required.");

        return;

    }

    if (cats.includes(value)) {

        alert("Category already exists.");

        return;

    }

    cats.push(value);

    localStorage.setItem(
        "cats",
        JSON.stringify(cats)
    );

    input.value = "";
    window.dispatchEvent(new Event("expenseUpdated"));
    render();

}



//=====================================
// DELETE EXPENSE
//=====================================

function del(index) {

    if (!confirm("Delete this expense?"))
        return;

    expenses.splice(index, 1);

    saveExpenses();

    render();

}



//=====================================
// INITIAL LOAD
//=====================================

render();