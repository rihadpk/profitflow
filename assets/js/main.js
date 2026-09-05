
//dashboard//

document.addEventListener("DOMContentLoaded", () => {
    // ১. Check Login & Security Guard
    const loggedUser = JSON.parse(localStorage.getItem("loggedInUser"));

    // যদি ইউজার লগইন করা না থাকে, তবে সরাসরি লগইন পেজে (index.html) ফেরত পাঠাবে
    if (!loggedUser) {
        window.location.href = "index.html";
        return;
    }

    // ইউজারনেম ও ইমেজ ডিসপ্লে করা
    if (document.getElementById("userNameDisplay")) {
        document.getElementById("userNameDisplay").innerText = loggedUser.name;
    }

    if (loggedUser.image && document.getElementById("headerUserImg")) {
        document.getElementById("headerUserImg").src = loggedUser.image;
    }
    // ২. Constants & State
    let monthlyTarget = parseInt(localStorage.getItem("monthlyTarget")) || 300;
    let dailyTarget = parseInt(localStorage.getItem("dailyTarget")) || 10;
    let salesList = JSON.parse(localStorage.getItem("salesList")) || [];
    const dashboardMonth = document.getElementById("dashboardMonth");

    let selectedMonth = new Date().toISOString().slice(0, 7);

    if (dashboardMonth) {
        dashboardMonth.value = selectedMonth;

        dashboardMonth.addEventListener("change", function () {
            selectedMonth = this.value;
            renderDashboard();
            window.addEventListener("expenseUpdated", () => {
                renderDashboard();
            });
        });
    }

    // 3. UI Selectors
    const addSaleBtn = document.getElementById("addSaleBtn");
    const addSaleModal = document.getElementById("addSaleModal");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const addSaleForm = document.getElementById("addSaleForm");
    const salesTableBody = document.getElementById("salesTableBody");

    // Modal Logic
    if (addSaleBtn) {
        addSaleBtn.onclick = (e) => {
            e.preventDefault();
            if (addSaleModal) addSaleModal.style.display = 'flex';
        };
    }
    if (closeModalBtn) {
        closeModalBtn.onclick = () => {
            if (addSaleModal) addSaleModal.style.display = 'none';
        };
    }
    window.onclick = (e) => {
        if (e.target == addSaleModal) addSaleModal.style.display = 'none';
    };

    // 4. Update Function
    const renderDashboard = () => {
        const filterMonth = dashboardMonth
            ? dashboardMonth.value
            : new Date().toISOString().slice(0, 7);
        let soldThisMonth = 0;
        let soldToday = 0;
        let revSum = 0;
        let costSum = 0;
        let delSum = 0;
        let profitSum = 0;
        let todayProfit = 0;

        if (salesTableBody) {
            salesTableBody.innerHTML = "";
            const today = new Date().toLocaleDateString();
            const currentMonth = new Date().toISOString().slice(0, 7);

            salesList.forEach((sale, index) => {

                const saleMonth = sale.timestamp.slice(0, 7);

                if (saleMonth !== filterMonth) return;

                const sQty = parseInt(sale.qty);
                const sCostUnit = parseInt(sale.cost);
                const sSellUnit = parseInt(sale.sell);
                const sDel = parseInt(sale.delivery);

                const totalCost = sCostUnit;
                const totalRev = sSellUnit;
                const profit = totalRev - totalCost - sDel;

                soldThisMonth += sQty;
                revSum += totalRev;
                costSum += totalCost;
                delSum += sDel;
                profitSum += profit;

                if (
                    filterMonth === currentMonth &&
                    new Date(sale.timestamp).toLocaleDateString() === today
                ) {
                    soldToday += sQty;
                    todayProfit += profit;
                }

                const row = document.createElement("tr");
                row.innerHTML = `
        <td>${index + 1}</td>
        <td>${new Date(sale.timestamp).toLocaleString([], {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</td>
        <td>${sale.product}</td>
        <td>${sale.customer}</td>
        <td>${sQty}</td>
        <td>${totalCost}</td>
        <td>${totalRev}</td>
        <td>${sDel}</td>
        <td class="profit-green">${profit}</td>
        <td><i class="fa-solid fa-trash-can action-del" onclick="deleteSale(${index})"></i></td>
    `;

                salesTableBody.prepend(row);

            });

        }

        // Update DOM
        if (document.getElementById("soldThisMonthVal")) {
            document.getElementById("soldThisMonthVal").innerText = soldThisMonth;
            document.getElementById("barSoldVal").innerText = soldThisMonth;

            // Monthly Target Cards Update
            if (document.getElementById("monthlyTargetVal")) document.getElementById("monthlyTargetVal").innerText = monthlyTarget;
            if (document.getElementById("monthlyTargetTotalVal")) document.getElementById("monthlyTargetTotalVal").innerText = monthlyTarget;

            document.getElementById("remTargetVal").innerText = Math.max(0, monthlyTarget - soldThisMonth);
            document.getElementById("totalProfitValTop").innerText = profitSum.toLocaleString();

            const monthPercent = monthlyTarget > 0 ? ((soldThisMonth / monthlyTarget) * 100).toFixed(2) : 0;
            document.getElementById("monthBadge").innerText = monthPercent + "% Completed";
            document.getElementById("remBadge").innerText = (100 - Math.min(100, monthPercent)).toFixed(2) + "% Remaining";
            document.getElementById("monthBar").style.width = Math.min(100, monthPercent) + "%";

            // Today Progress
            document.getElementById("soldTodayVal").innerHTML = soldToday + " <small>Products</small>";

            // Daily Target Cards Update
            if (document.getElementById("dailyTargetVal")) document.getElementById("dailyTargetVal").innerText = dailyTarget;

            document.getElementById("remTodayVal").innerText = Math.max(0, dailyTarget - soldToday);
            document.getElementById("todayProfitVal").innerText = todayProfit.toLocaleString();

            const todayPercent = dailyTarget > 0 ? Math.min(100, (soldToday / dailyTarget) * 100) : 0;
            document.getElementById("todayPercentText").innerText = Math.round(todayPercent) + "%";

            const circumference = 283;
            const offset = circumference - (todayPercent / 100) * circumference;
            document.getElementById("todayCircle").style.strokeDashoffset = offset;

            // Summary Row
            document.getElementById("sumRev").innerText = revSum.toLocaleString();
            document.getElementById("sumCost").innerText = costSum.toLocaleString();
            document.getElementById("sumDel").innerText = delSum.toLocaleString();
            const expenses =
                JSON.parse(localStorage.getItem("expenses")) || [];

            const totalExpense =
                expenses
                    .filter(exp => exp.date.slice(0, 7) === filterMonth)
                    .reduce((sum, item) => sum + Number(item.amount), 0);

            document.getElementById("sumExpense").innerText =
                totalExpense.toLocaleString();

            profitSum -= totalExpense;

            document.getElementById("sumProfit").innerText =
                profitSum.toLocaleString();
            const recentExpenseBody =
                document.getElementById("recentExpenseBody");

            if (recentExpenseBody) {

                recentExpenseBody.innerHTML = "";

                expenses
                    .filter(exp => exp.date.slice(0, 7) === filterMonth)
                    .slice()
                    .reverse()
                    .slice(0, 5)
                    .forEach((exp, index) => {

                        recentExpenseBody.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${exp.date}</td>
                <td>${exp.cat}</td>
                <td>${exp.title}</td>
                <td>৳ ${Number(exp.amount).toLocaleString()}</td>
                <td>
                    <i class="fa-solid fa-minus text-danger"></i>
                </td>
            </tr>
            `;

                    });

            }
        }
    };

    // 5. Add Sale Logic
    if (addSaleForm) {
        addSaleForm.onsubmit = (e) => {
            e.preventDefault();
            const newSale = {
                product: document.getElementById("inProduct").value,
                customer: document.getElementById("inCustomer").value,
                qty: document.getElementById("inQty").value,
                delivery: document.getElementById("inDelivery").value,
                cost: document.getElementById("inCost").value,
                sell: document.getElementById("inSell").value,
                timestamp: new Date().toISOString()
            };

            salesList.push(newSale);
            localStorage.setItem("salesList", JSON.stringify(salesList));
            addSaleForm.reset();
            if (addSaleModal) addSaleModal.style.display = 'none';
            renderDashboard();
        };
    }

    // 6. Delete Sale
    window.deleteSale = (index) => {
        if (confirm("Are you sure you want to delete this record?")) {
            salesList.splice(index, 1);
            localStorage.setItem("salesList", JSON.stringify(salesList));
            renderDashboard();
        }
    };

    // 7. Timer & Clock
    const updateClock = () => {
        const now = new Date();
        if (document.getElementById("displayDate")) {
            document.getElementById("displayDate").innerText = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
            document.getElementById("displayDay").innerText = now.toLocaleDateString('en-US', { weekday: 'long' }) + ", " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const midnight = new Date();
            midnight.setHours(24, 0, 0, 0);
            const diff = midnight - now;
            const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
            const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
            const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
            document.getElementById("resetTimer").innerText = `${h}:${m}:${s}`;
        }
    };
    setInterval(updateClock, 1000);
    updateClock();

    renderDashboard();
});

document.addEventListener("DOMContentLoaded", () => {
    const loggedUser = JSON.parse(localStorage.getItem("loggedInUser"));
    if (loggedUser) {
        // নাম আপডেট করার জন্য
        if (document.getElementById("userNameDisplay")) {
            document.getElementById("userNameDisplay").innerText = loggedUser.name;
        }

        // ইমেজ ডায়নামিকালি আপডেট করার জন্য
        if (loggedUser.image && document.getElementById("headerUserImg")) {
            document.getElementById("headerUserImg").src = loggedUser.image;
        }
    }
});

document.addEventListener("DOMContentLoaded", () => {
    // ১. সিকিউরিটি গার্ড ও প্রোফাইল ডাটা লোড
    const loggedUser = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!loggedUser) {
        window.location.replace("index.html");
        return;
    }

    const userNameDisplay = document.getElementById("userNameDisplay");
    const headerUserImg = document.getElementById("headerUserImg");
    if (userNameDisplay && loggedUser.name) userNameDisplay.innerText = loggedUser.name;
    if (headerUserImg && loggedUser.image) headerUserImg.src = loggedUser.image;

    // ২. নাল চেকসহ সেলস ও টার্গেট ফিল্ড ফিক্স
    const btnFilterSales = document.getElementById("btnFilterSales");
    if (btnFilterSales) {
        btnFilterSales.onclick = () => {
            const startVal = filterStart.value;
            const endVal = filterEnd.value;
            if (!startVal || !endVal) {
                alert("Please select both Start and End date!");
                return;
            }
            const masterList = getSalesList();
            const filteredList = masterList.filter(sale => {
                const saleDate = sale.timestamp.split('T')[0];
                return saleDate >= startVal && saleDate <= endVal;
            });
            renderSalesTable(filteredList);
        };
    }

    // ৩. ক্লিক ড্রপডাউন টগল হ্যান্ডলার
    const userProfile = document.querySelector(".user-profile");
    const profileBtn = document.querySelector(".profile-btn");

    if (profileBtn && userProfile) {
        profileBtn.addEventListener("click", (e) => {
            e.stopPropagation(); // উইন্ডোতে ক্লিক প্রপাগেশন বন্ধ করা
            userProfile.classList.toggle("active");
        });

        // বাইরে ক্লিক করলে ড্রপডাউন বন্ধ হয়ে যাওয়া
        document.addEventListener("click", () => {
            userProfile.classList.remove("active");
        });
    }

    // ৪. স্মুথ লগআউট হ্যান্ডলার
    const btnLogout = document.getElementById("btnLogout");
    if (btnLogout) {
        btnLogout.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("loggedInUser");
            window.location.replace("index.html");
        });
    }
});

// বর্তমান মাস এবং বছর লাইভ করার কোড
const targetMonthYearEl = document.getElementById("targetMonthYear");
if (targetMonthYearEl) {
    const currentDate = new Date();

    // মাসের নাম পাওয়ার জন্য Array (English Months)
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const currentMonth = monthNames[currentDate.getMonth()]; // বর্তমান মাস (যেমন: June)
    const currentYear = currentDate.getFullYear();          // বর্তমান বছর (যেমন: 2026)

    // HTML এ সেট করা (আউটপুট দেখাবে: June 2026)
    targetMonthYearEl.innerText = `${currentMonth} ${currentYear}`;
}

//sales list//
document.addEventListener("DOMContentLoaded", () => {
    // Check Login State
    const loggedUser = JSON.parse(localStorage.getItem("loggedInUser"));
    if (loggedUser && document.getElementById("userNameDisplay")) {
        document.getElementById("userNameDisplay").innerText = loggedUser.name;
    }

    // UI Selectors
    const salesListTableBody = document.getElementById("salesListTableBody");
    const filterStart = document.getElementById("filterStart");
    const filterEnd = document.getElementById("filterEnd");
    const btnFilterSales = document.getElementById("btnFilterSales");
    const btnResetFilter = document.getElementById("btnResetFilter");

    // Modal elements
    const addSaleBtn = document.getElementById("addSaleBtn");
    const addSaleModal = document.getElementById("addSaleModal");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const addSaleForm = document.getElementById("addSaleForm");

    // Fetch master data sequence
    function getSalesList() {
        return JSON.parse(localStorage.getItem("salesList")) || [];
    }

    // Main Render Function
    function renderSalesTable(targetList) {
        if (!salesListTableBody) return;
        salesListTableBody.innerHTML = "";

        if (targetList.length === 0) {
            salesListTableBody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 30px; color: #64748b;">No sales records found.</td></tr>`;
            return;
        }

        // নতুন সেলস উপরে দেখানোর জন্য লুপটি রিভার্স অর্ডারে চালানো হয়েছে 
        for (let i = targetList.length - 1; i >= 0; i--) {
            const sale = targetList[i];
            const sQty = parseInt(sale.qty) || 0;
            const sCostUnit = parseInt(sale.cost) || 0;
            const sSellUnit = parseInt(sale.sell) || 0;
            const sDel = parseInt(sale.delivery) || 0;

            const totalCost = sCostUnit;
            const totalRev = sSellUnit;
            const profit = totalRev - totalCost - sDel;

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${i + 1}</td>
                <td>${new Date(sale.timestamp).toLocaleString([], { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                <td><strong>${sale.product}</strong></td>
                <td>${sale.customer}</td>
                <td><span class="qty-badge">${sQty}</span></td>
                <td>৳${totalCost.toLocaleString()}</td>
                <td>৳${totalRev.toLocaleString()}</td>
                <td>৳${sDel.toLocaleString()}</td>
                <td style="color: #10b981; font-weight: 700;">৳${profit.toLocaleString()}</td>
                <td><i class="fa-solid fa-trash-can action-del" style="cursor:pointer; color:#ef4444;" onclick="deleteListSale(${i})"></i></td>
            `;
            salesListTableBody.appendChild(row);
        }
    }

    // Initial Load Execution
    renderSalesTable(getSalesList());

    // Date Range Filter Logic
    btnFilterSales.onclick = () => {
        const startVal = filterStart.value;
        const endVal = filterEnd.value;

        if (!startVal || !endVal) {
            alert("Please select both Start and End date!");
            return;
        }

        const masterList = getSalesList();

        // ফিল্টারিং প্রসেস (YYYY-MM-DD ফরম্যাট ম্যাচিং)
        const filteredList = masterList.filter(sale => {
            const saleDate = sale.timestamp.split('T')[0];
            return saleDate >= startVal && saleDate <= endVal;
        });

        renderSalesTable(filteredList);
    };

    // Reset Filter View
    btnResetFilter.onclick = () => {
        filterStart.value = "";
        filterEnd.value = "";
        renderSalesTable(getSalesList());
    };

    // Add Sale Modal controls inside sales page
    if (addSaleBtn) {
        addSaleBtn.onclick = (e) => {
            e.preventDefault();
            if (addSaleModal) addSaleModal.style.display = 'flex';
        };
    }
    if (closeModalBtn) {
        closeModalBtn.onclick = () => {
            if (addSaleModal) addSaleModal.style.display = 'none';
        };
    }

    if (addSaleForm) {
        addSaleForm.onsubmit = (e) => {
            e.preventDefault();
            const currentSales = getSalesList();
            const newSale = {
                product: document.getElementById("inProduct").value,
                customer: document.getElementById("inCustomer").value,
                qty: document.getElementById("inQty").value,
                delivery: document.getElementById("inDelivery").value,
                cost: document.getElementById("inCost").value,
                sell: document.getElementById("inSell").value,
                timestamp: new Date().toISOString()
            };

            currentSales.push(newSale);
            localStorage.setItem("salesList", JSON.stringify(currentSales));
            addSaleForm.reset();
            if (addSaleModal) addSaleModal.style.display = 'none';

            // রিয়েল-টাইম রি-রেন্ডার
            renderSalesTable(getSalesList());
        };
    }

    // Global delete proxy 
    window.deleteListSale = (index) => {
        if (confirm("Are you sure you want to delete this record?")) {
            const currentSales = getSalesList();
            currentSales.splice(index, 1);
            localStorage.setItem("salesList", JSON.stringify(currentSales));
            renderSalesTable(getSalesList());
        }
    };

    // Live Sidebar Clock syncing
    const updateClock = () => {
        const now = new Date();
        if (document.getElementById("displayDate")) {
            document.getElementById("displayDate").innerText = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
            document.getElementById("displayDay").innerText = now.toLocaleDateString('en-US', { weekday: 'long' }) + ", " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    };
    setInterval(updateClock, 1000);
    updateClock();
});

// =======================
// TARGET SETTINGS
// =======================
document.addEventListener("DOMContentLoaded", () => {

    const loggedUser = JSON.parse(localStorage.getItem("loggedInUser"));
    const userNameDisplay = document.getElementById("userNameDisplay");

    if (loggedUser && userNameDisplay) {
        userNameDisplay.innerText = loggedUser.name;
    }

    const monthlyInput = document.getElementById("monthlyTargetInput");
    const workingDaysInput = document.getElementById("workingDaysInput");
    const dailyInput = document.getElementById("dailyTargetInput");
    const saveBtn = document.getElementById("saveTargetsBtn");

    if (!monthlyInput || !workingDaysInput || !dailyInput || !saveBtn) return;

    // Load Saved Values
    const savedMonthly = localStorage.getItem("monthlyTarget");
    const savedWorking = localStorage.getItem("workingDays");
    const savedDaily = localStorage.getItem("dailyTarget");

    if (savedMonthly) monthlyInput.value = savedMonthly;
    if (savedWorking) workingDaysInput.value = savedWorking;
    if (savedDaily) dailyInput.value = savedDaily;

    dailyInput.readOnly = true;

    function calculateDailyTarget() {

        const monthly = Number(monthlyInput.value);
        const days = Number(workingDaysInput.value);

        if (monthly > 0 && days > 0) {
            dailyInput.value = Math.ceil(monthly / days);
        } else {
            dailyInput.value = "";
        }

    }

    monthlyInput.addEventListener("input", calculateDailyTarget);
    workingDaysInput.addEventListener("input", calculateDailyTarget);

    saveBtn.addEventListener("click", function (e) {

        e.preventDefault();

        const monthly = Number(monthlyInput.value);
        const days = Number(workingDaysInput.value);

        if (monthly <= 0) {
            alert("Enter Monthly Target");
            return;
        }

        if (days <= 0) {
            alert("Enter Working Days");
            return;
        }

        const daily = Math.ceil(monthly / days);

        localStorage.setItem("monthlyTarget", monthly);
        localStorage.setItem("workingDays", days);
        localStorage.setItem("dailyTarget", daily);

        alert("Targets Updated Successfully!");

        window.location.href = "dashboard.html";

    });



    // Sidebar Clock
    const updateClock = () => {
        const displayDate = document.getElementById("displayDate");
        const displayDay = document.getElementById("displayDay");

        if (!displayDate || !displayDay) return; // নাল চেক

        const now = new Date();
        displayDate.innerText = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        displayDay.innerText = now.toLocaleDateString('en-US', { weekday: 'long' }) + ", " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    setInterval(updateClock, 1000);
    updateClock();
});
//mobiletoggle//
document.addEventListener("DOMContentLoaded", () => {
    // মোবাইল সাইডবার টগল লজিক
    const sidebarToggleBtn = document.getElementById("sidebarToggleBtn");
    const sidebar = document.querySelector(".sidebar");

    if (sidebarToggleBtn && sidebar) {
        sidebarToggleBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            sidebar.classList.toggle("active");
        });

        // সাইডবারের বাইরে কোথাও ক্লিক করলে মেনু বন্ধ হয়ে যাবে
        document.addEventListener("click", (e) => {
            if (!sidebar.contains(e.target) && !sidebarToggleBtn.contains(e.target)) {
                sidebar.classList.remove("active");
            }
        });
    }
});



//add sales//
document.addEventListener("DOMContentLoaded", () => {
    // লগইন ইউজার নেম শো করা
    const loggedUser = JSON.parse(localStorage.getItem("loggedInUser"));
    if (loggedUser && document.getElementById("userNameDisplay")) {
        document.getElementById("userNameDisplay").innerText = loggedUser.name;
    }

    const addSalePageForm = document.getElementById("addSalePageForm");

    if (addSalePageForm) {
        addSalePageForm.addEventListener("submit", (e) => {
            e.preventDefault();

            // ইনপুট ফিল্ড থেকে মান নেওয়া
            const productName = document.getElementById("inProduct").value;
            const customerName = document.getElementById("inCustomer").value;
            const qty = parseInt(document.getElementById("inQty").value) || 0;
            const delivery = parseInt(document.getElementById("inDelivery").value) || 0;
            const costUnit = parseInt(document.getElementById("inCost").value) || 0;
            const sellUnit = parseInt(document.getElementById("inSell").value) || 0;

            // প্রফিট অটো জেনারেট: Profit = (Selling Price * Qty) - (Cost Price * Qty) - Delivery
            const totalCost = costUnit * qty;
            const totalRev = sellUnit * qty;
            const profit = totalRev - totalCost - delivery;

            // নতুন সেলস অবজেক্ট তৈরি 
            const newSale = {
                product: productName,
                customer: customerName,
                qty: qty,
                cost: costUnit, // Per unit cost save korar jonno (jemon dashboard update hishabe chilo)
                sell: sellUnit, // Per unit sell 
                delivery: delivery,
                profit: profit, // Auto generated profit
                timestamp: new Date().toISOString()
            };

            // লোকাল স্টোরেজ থেকে পূর্বের সেলস লিস্ট আনা
            let salesList = JSON.parse(localStorage.getItem("salesList")) || [];
            salesList.push(newSale);

            // লোকাল স্টোরেজে আপডেট করা
            localStorage.setItem("salesList", JSON.stringify(salesList));

            alert("Sale added successfully!");
            addSalePageForm.reset();

            // সফলভাবে যোগ করার পর ড্যাশবোর্ডে রিডাইরেক্ট করা
            window.location.href = "dashboard.html";
        });
    }
});

// Reports//
document.addEventListener("DOMContentLoaded", () => {
    // ১. হেডার ইউজার প্রোফাইল ও নাম সিঙ্ক করা
    const loggedUser = JSON.parse(localStorage.getItem("loggedInUser"));
    if (loggedUser) {
        if (document.getElementById("userNameDisplay")) {
            document.getElementById("userNameDisplay").innerText = loggedUser.name;
        }
        if (loggedUser.image && document.getElementById("headerUserImg")) {
            document.getElementById("headerUserImg").src = loggedUser.image;
        }
    }

    // ২. ডেট ফিল্টারে বর্তমান মাস ও বছর ডিফল্ট হিসেবে সেট করা (YYYY-MM ফরম্যাট)
    const monthInput = document.getElementById("monthFilter");
    if (monthInput) {
        const date = new Date();
        const currentYear = date.getFullYear();
        const currentMonth = String(date.getMonth() + 1).padStart(2, '0');
        monthInput.value = `${currentYear}-${currentMonth}`;
    }

    // ডিফল্ট রিপোর্ট রেন্ডার করা
    renderReportData();

    // ৩. ইউজার যেকোনো মাস পরিবর্তন করলেই লাইভ আপডেট হওয়া
    if (monthInput) {
        monthInput.addEventListener("change", () => {
            renderReportData();
        });
    }

    // প্রধান ফাংশন যা লোকাল স্টোরেজ থেকে ডাটা প্রসেস করে
    function renderReportData() {
        const salesList = JSON.parse(localStorage.getItem("salesList")) || [];
        const selectedMonth = monthInput ? monthInput.value : ""; // Format: "YYYY-MM"

        // সিলেক্টেড মাসের ওপর ভিত্তি করে সেলস ফিল্টার করা
        const filteredSales = salesList.filter(sale => {
            if (!sale.timestamp) return false;
            return sale.timestamp.startsWith(selectedMonth);
        });

        let totalRevenue = 0;
        let totalCost = 0;
        let totalDelivery = 0;
        let totalProfit = 0;
        let totalQty = 0;


        const expenses = JSON.parse(localStorage.getItem("expenses")) || [];

        const totalExpense = expenses.reduce((sum, item) => {
            return sum + Number(item.amount || 0);
        }, 0);

        filteredSales.forEach(sale => {
            const qty = parseInt(sale.qty) || 0;
            const cost = parseInt(sale.cost) || 0;
            const sell = parseInt(sale.sell) || 0;
            const delivery = parseInt(sale.delivery) || 0;

            totalQty += qty;
            totalCost += (cost * qty);
            totalRevenue += (sell * qty);
            totalDelivery += delivery;
            totalProfit += ((sell - cost) * qty) - delivery;
        });

        // ৪. টপ ৪ কার্ড (Top 4 Stats Cards) আপডেট করা
        if (document.getElementById("repRevenue")) document.getElementById("repRevenue").innerText = totalRevenue.toLocaleString();
        if (document.getElementById("repOrdersCount")) document.getElementById("repOrdersCount").innerText = filteredSales.length;
        if (document.getElementById("repCost")) document.getElementById("repCost").innerText = totalCost.toLocaleString();
        if (document.getElementById("repDelivery")) document.getElementById("repDelivery").innerText = totalDelivery.toLocaleString();
        if (document.getElementById("repProfit")) document.getElementById("repProfit").innerText = totalProfit.toLocaleString();

        // ৫. টার্গেট রিপোর্ট সেকশন (লোকাল স্টোরেজ থেকে টার্গেট গোল নেওয়া, না পেলে ডিফল্ট 300)
        const targetGoal = parseInt(localStorage.getItem("monthlyTarget")) || 300;

        // দশমিকসহ সঠিক পার্সেন্টেজ হিসাব করার জন্য .toFixed(1) ব্যবহার করা হলো
        const successRateDecimal = ((totalQty / targetGoal) * 100);
        const successRate = totalQty > 0 ? successRateDecimal.toFixed(1) : 0;
        const remaining = Math.max(targetGoal - totalQty, 0);

        if (document.getElementById("targetGoal")) document.getElementById("targetGoal").innerText = targetGoal;
        if (document.getElementById("targetSold")) document.getElementById("targetSold").innerText = totalQty;
        if (document.getElementById("targetRemaining")) document.getElementById("targetRemaining").innerText = remaining;

        // ভিউতে দশমিকসহ বা পূর্ণসংখ্যা পার্সেন্টেজ দেখানো
        if (document.getElementById("targetSuccessRate")) {
            document.getElementById("targetSuccessRate").innerText = (successRate % 1 === 0 ? Math.round(successRate) : successRate) + "%";
        }

        // সার্কুলার প্রোগ্রেস বার কালার আপডেট 
        const circle = document.getElementById("targetCircle");
        if (circle) {
            circle.style.background = `conic-gradient(#f97316 0% ${successRate}%, #e2e8f0 ${successRate}% 100%)`;
        }

        // ৬. টপ প্রোডাক্টস টেবিল তৈরি করা
        const productMap = {};
        filteredSales.forEach(sale => {
            const pName = sale.product || "Unknown Product";
            const qty = parseInt(sale.qty) || 0;
            const sell = parseInt(sale.sell) || 0;
            const cost = parseInt(sale.cost) || 0;
            const pft = ((sell - cost) * qty);

            if (!productMap[pName]) {
                productMap[pName] = { qty: 0, profit: 0 };
            }
            productMap[pName].qty += qty;
            productMap[pName].profit += pft;
        });

        const sortableProducts = [];
        for (let p in productMap) {
            sortableProducts.push({ name: p, qty: productMap[p].qty, profit: productMap[p].profit });
        }
        sortableProducts.sort((a, b) => b.profit - a.profit);

        const top5 = sortableProducts.slice(0, 5);
        const tBody = document.getElementById("topProductsTable");
        if (tBody) {
            tBody.innerHTML = "";
            if (top5.length === 0) {
                tBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #64748b;">কোনো সেলস রেকর্ড নেই</td></tr>`;
            } else {
                top5.forEach((item, index) => {
                    const row = `<tr>
                        <td>${index + 1}</td>
                        <td>${item.name}</td>
                        <td>${item.qty}</td>
                        <td>৳ ${item.profit.toLocaleString()}</td>
                    </tr>`;
                    tBody.innerHTML += row;
                });
            }
        }

        // ۷. সেলস সামারি (Sales Summary) সেকশন আপডেট করা
        if (document.getElementById("sumOrders")) document.getElementById("sumOrders").innerText = filteredSales.length;
        if (document.getElementById("sumQty")) document.getElementById("sumQty").innerText = totalQty;

        const avgProfit = filteredSales.length > 0 ? (totalProfit / filteredSales.length) : 0;
        if (document.getElementById("sumAvgProfit")) {
            document.getElementById("sumAvgProfit").innerText = avgProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
        }

        // ৮. রিপোর্ট জেনারেটেড ডেট (Footer Date Banner) আপডেট করা
        if (selectedMonth && document.getElementById("reportGenDate")) {
            const [year, month] = selectedMonth.split('-');
            const dateNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const monthStr = dateNames[parseInt(month, 10) - 1];
            document.getElementById("reportGenDate").innerText = `01 ${monthStr} ${year} - 31 ${monthStr} ${year}`;
        }
    }
});


//Settings//
document.addEventListener("DOMContentLoaded", () => {
    const loggedUser = JSON.parse(localStorage.getItem("loggedInUser"));

    if (!loggedUser) {
        window.location.href = "index.html"; // লগইন না থাকলে ফিরিয়ে দেওয়া
        return;
    }

    // ইউজার ডাটা ফিল্ডে বসানো
    document.getElementById("userNameDisplay").innerText = loggedUser.name;
    document.getElementById("inName").value = loggedUser.name;
    document.getElementById("inEmail").value = loggedUser.email;

    if (loggedUser.image && document.getElementById("profilePreview")) {
        document.getElementById("profilePreview").src = loggedUser.image;
        document.getElementById("headerUserImg").src = loggedUser.image;
    }

    const settingsForm = document.getElementById("settingsForm");
    let newProfileImage = loggedUser.image || "";

    // ইমেজ আপলোড হলে সেটি বেস৬৪ (Base64) এ কনভার্ট করা
    document.getElementById("inProfileImg").addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                newProfileImage = event.target.result;
                document.getElementById("profilePreview").src = newProfileImage;
            };
            reader.readAsDataURL(file);
        }
    });

    settingsForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const updatedName = document.getElementById("inName").value;
        const newPassword = document.getElementById("inPassword").value;

        // লগইন ইউজার আপডেট অবজেক্ট
        loggedUser.name = updatedName;
        if (newPassword && newPassword.trim() !== "") {
            loggedUser.password = newPassword;
        }
        loggedUser.image = newProfileImage;

        // loggedInUser আপডেট করা
        localStorage.setItem("loggedInUser", JSON.stringify(loggedUser));

        // মেইন ইউজার লিস্ট (users array) আপডেট করা
        let users = JSON.parse(localStorage.getItem("users")) || [];
        const userIndex = users.findIndex(u => u.email === loggedUser.email);

        if (userIndex !== -1) {
            users[userIndex] = loggedUser;
            localStorage.setItem("users", JSON.stringify(users));
        }

        alert("Settings updated successfully!");
        location.reload();
    });
});




