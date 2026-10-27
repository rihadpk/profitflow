(() => {
    "use strict";

    const STORAGE_KEY = "profitflow_records_v1";
    const $ = id => document.getElementById(id);

    let records = loadRecords();
    let activeFilter = "month";
    let customStart = "";
    let customEnd = "";
    let toastTimer;

    function todayISO() {
        const d = new Date();
        return [
            d.getFullYear(),
            String(d.getMonth() + 1).padStart(2, "0"),
            String(d.getDate()).padStart(2, "0")
        ].join("-");
    }

    function money(value) {
        return "৳ " + Number(value || 0).toLocaleString("en-BD", {
            maximumFractionDigits: 2
        });
    }

    function formatDate(iso) {
        if (!iso) return "—";
        const [y, m, d] = iso.split("-").map(Number);

        return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, ch => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[ch]));
    }

    function loadRecords() {
        try {
            const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            return Array.isArray(data) ? data : [];
        } catch (error) {
            return [];
        }
    }

    function saveRecords() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
            return true;
        } catch (error) {
            showToast("Unable to save. Browser storage may be unavailable.");
            return false;
        }
    }

    function showToast(message) {
        const toast = $("toast");
        toast.textContent = message;
        toast.classList.add("show");

        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.classList.remove("show");
        }, 2600);
    }

    function getBounds() {
        const now = new Date();
        const today = todayISO();

        if (activeFilter === "today") {
            return [today, today];
        }

        if (activeFilter === "week") {
            const start = new Date(now);
            const day = (start.getDay() + 6) % 7;

            start.setDate(start.getDate() - day);

            const end = new Date(start);
            end.setDate(end.getDate() + 6);

            const toISO = d =>
                `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

            return [toISO(start), toISO(end)];
        }

        if (activeFilter === "month") {
            return [
                `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
                today
            ];
        }

        if (activeFilter === "custom") {
            return [
                customStart || "0000-01-01",
                customEnd || "9999-12-31"
            ];
        }

        return ["0000-01-01", "9999-12-31"];
    }

    function getFilteredRecords() {
        const [start, end] = getBounds();

        return records
            .filter(r => r.date >= start && r.date <= end)
            .sort((a, b) =>
                b.date.localeCompare(a.date) ||
                (b.createdAt || 0) - (a.createdAt || 0)
            );
    }

    function getTotalCost(record) {
        if (record.type === "stock") {
            return Number(record.stockCost || 0) +
                Number(record.shippingCost || 0);
        }

        return Number(record.amount || 0);
    }

    function updateSummary(list) {
        let ads = 0;
        let stock = 0;
        let shipping = 0;
        let other = 0;

        list.forEach(r => {
            if (r.type === "stock") {
                stock += Number(r.stockCost || 0);
                shipping += Number(r.shippingCost || 0);
            } else if (r.category === "Ads") {
                ads += Number(r.amount || 0);
            } else {
                other += Number(r.amount || 0);
            }
        });

        $("adTotal").textContent = money(ads);
        $("stockTotal").textContent = money(stock);
        $("shippingTotal").textContent = money(shipping);
        $("otherTotal").textContent = money(other);
        $("grandTotal").textContent = money(ads + stock + shipping + other);
    }

    function render() {
        const list = getFilteredRecords();

        updateSummary(list);

        $("recordCount").textContent =
            `${list.length} record${list.length === 1 ? "" : "s"}`;

        const [start, end] = getBounds();

        if (activeFilter === "all") {
            $("rangeCaption").textContent = "Showing all saved records";
        } else if (activeFilter === "today") {
            $("rangeCaption").textContent = `Showing ${formatDate(start)}`;
        } else {
            $("rangeCaption").textContent =
                `Showing ${formatDate(start)} – ${formatDate(end)}`;
        }

        const body = $("recordsBody");

        if (!list.length) {
            body.innerHTML = `
        <tr>
          <td colspan="9" class="empty">
            No records found. Add a stock or expense entry.
          </td>
        </tr>`;
            return;
        }

        body.innerHTML = list.map(r => {
            const isStock = r.type === "stock";

            const title = isStock
                ? escapeHTML(r.product)
                : escapeHTML(r.name);

            const typeLabel = isStock
                ? `<span class="type-pill stock">${escapeHTML(r.shipmentType)} Shipment</span>`
                : `<span class="type-pill expense">${escapeHTML(r.category)}</span>`;

            const qty = isStock ? `${r.quantity} pcs` : "—";
            const kg = isStock ? `${r.totalKg} KG` : "—";
            const rate = isStock ? money(r.ratePerKg) : "—";
            const stockExpense = isStock ? money(r.stockCost) : money(r.amount);
            const shipping = isStock ? money(r.shippingCost) : "—";

            return `
        <tr>
          <td>${formatDate(r.date)}</td>
          <td>
            ${typeLabel}
            <strong class="record-name">${title}</strong>
          </td>
          <td>${qty}</td>
          <td>${kg}</td>
          <td>${rate}</td>
          <td class="money">${stockExpense}</td>
          <td>${shipping}</td>
          <td class="money">${money(getTotalCost(r))}</td>
          <td>
            <div class="actions">
              <button class="icon-btn" data-action="edit"
                data-id="${r.id}" title="Edit">✎</button>
              <button class="icon-btn delete" data-action="delete"
                data-id="${r.id}" title="Delete">×</button>
            </div>
          </td>
        </tr>`;
        }).join("");
    }

    function resetExpenseForm() {
        $("expenseForm").reset();
        $("expenseEditId").value = "";
        $("expenseDate").value = todayISO();
        $("saveExpense").textContent = "Save Expense";
        $("cancelExpense").classList.add("hidden");
    }

    function resetStockForm() {
        $("stockForm").reset();
        $("stockEditId").value = "";
        $("stockDate").value = todayISO();
        $("saveStock").textContent = "Save Stock Entry";
        $("cancelStock").classList.add("hidden");
        updateLiveCalculation();
    }

    function updateLiveCalculation() {
        const kg = Math.max(0, Number($("totalKg").value || 0));
        const rate = Math.max(0, Number($("ratePerKg").value || 0));
        const shipping = Math.max(0, Number($("shippingCost").value || 0));

        const stockCost = kg * rate;

        $("liveStockCost").textContent = money(stockCost);
        $("liveTotalCost").textContent = money(stockCost + shipping);
    }

    // SAVE EXPENSE
    $("expenseForm").addEventListener("submit", event => {
        event.preventDefault();

        const id = $("expenseEditId").value;
        const amount = Number($("expenseAmount").value);

        if (!Number.isFinite(amount) || amount <= 0) {
            showToast("Enter an amount greater than zero.");
            return;
        }

        const existing = records.find(r => r.id === id);

        const record = {
            id: id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            type: "expense",
            date: $("expenseDate").value,
            category: $("expenseCategory").value,
            name: $("expenseName").value.trim(),
            amount,
            createdAt: existing?.createdAt || Date.now()
        };

        if (!record.date || !record.name) {
            showToast("Complete all expense fields.");
            return;
        }

        if (id) {
            records = records.map(r => r.id === id ? record : r);
        } else {
            records.push(record);
        }

        if (saveRecords()) {
            resetExpenseForm();
            render();
            showToast(id ? "Expense updated." : "Expense saved.");
        }
    });

    // SAVE STOCK
    $("stockForm").addEventListener("submit", event => {
        event.preventDefault();

        const id = $("stockEditId").value;
        const quantity = Number($("quantity").value);
        const totalKg = Number($("totalKg").value);
        const rate = Number($("ratePerKg").value);
        const shipping = Number($("shippingCost").value);

        if (!Number.isInteger(quantity) || quantity < 0) {
            showToast("Enter a valid quantity in pieces.");
            return;
        }

        if (!Number.isFinite(totalKg) || totalKg <= 0) {
            showToast("Total KG must be greater than zero.");
            return;
        }

        if (
            !Number.isFinite(rate) || rate < 0 ||
            !Number.isFinite(shipping) || shipping < 0
        ) {
            showToast("Enter a valid rate and shipping cost.");
            return;
        }

        const existing = records.find(r => r.id === id);

        const record = {
            id: id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            type: "stock",
            date: $("stockDate").value,
            product: $("productName").value.trim(),
            quantity,
            totalKg,
            shipmentType: $("shipmentType").value,
            ratePerKg: rate,
            stockCost: totalKg * rate,
            shippingCost: shipping,
            createdAt: existing?.createdAt || Date.now()
        };

        if (!record.date || !record.product) {
            showToast("Complete all stock fields.");
            return;
        }

        if (id) {
            records = records.map(r => r.id === id ? record : r);
        } else {
            records.push(record);
        }

        if (saveRecords()) {
            resetStockForm();
            render();
            showToast(id ? "Stock entry updated." : "Stock entry saved.");
        }
    });

    // EDIT AND DELETE
    $("recordsBody").addEventListener("click", event => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;

        const record = records.find(r => r.id === button.dataset.id);
        if (!record) return;

        if (button.dataset.action === "delete") {
            if (!confirm("Delete this record? This cannot be undone.")) return;

            records = records.filter(r => r.id !== record.id);

            if (saveRecords()) {
                render();
                showToast("Record deleted.");
            }

            return;
        }

        if (record.type === "expense") {
            $("expenseEditId").value = record.id;
            $("expenseDate").value = record.date;
            $("expenseCategory").value = record.category;
            $("expenseName").value = record.name;
            $("expenseAmount").value = record.amount;
            $("saveExpense").textContent = "Update Expense";
            $("cancelExpense").classList.remove("hidden");

            $("expenseForm").scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        } else {
            $("stockEditId").value = record.id;
            $("stockDate").value = record.date;
            $("productName").value = record.product;
            $("quantity").value = record.quantity;
            $("totalKg").value = record.totalKg;
            $("shipmentType").value = record.shipmentType;
            $("ratePerKg").value = record.ratePerKg;
            $("shippingCost").value = record.shippingCost;

            $("saveStock").textContent = "Update Stock Entry";
            $("cancelStock").classList.remove("hidden");

            updateLiveCalculation();

            $("stockForm").scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    });

    // CANCEL EDIT
    $("cancelExpense").addEventListener("click", resetExpenseForm);
    $("cancelStock").addEventListener("click", resetStockForm);

    // LIVE COST CALCULATION
    ["totalKg", "ratePerKg", "shippingCost"].forEach(id => {
        $(id).addEventListener("input", updateLiveCalculation);
    });

    // DATE FILTER
    $("dateFilter").addEventListener("change", () => {
        activeFilter = $("dateFilter").value;

        $("customRange").classList.toggle(
            "hidden",
            activeFilter !== "custom"
        );

        if (activeFilter === "custom") {
            const now = new Date();
            $("startDate").value =
                customStart ||
                `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

            $("endDate").value = customEnd || todayISO();
        }

        render();
    });

    $("applyRange").addEventListener("click", () => {
        customStart = $("startDate").value;
        customEnd = $("endDate").value;

        if (!customStart || !customEnd) {
            showToast("Choose both start and end dates.");
            return;
        }

        if (customStart > customEnd) {
            showToast("Start date must be before end date.");
            return;
        }

        render();
    });

    $("resetFilter").addEventListener("click", () => {
        activeFilter = "month";
        $("dateFilter").value = "month";
        $("customRange").classList.add("hidden");
        customStart = "";
        customEnd = "";
        render();
    });

    // INITIALIZE
    $("todayLabel").textContent = new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

    $("expenseDate").value = todayISO();
    $("stockDate").value = todayISO();

    render();
})();
