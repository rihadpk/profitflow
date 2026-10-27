
"use strict";

// ==========================================
// RENZONE PRODUCT DASHBOARD
// ==========================================

const KEY = "renzone_products_v1";
const PAGE_SIZE = 6;

const $ = id => document.getElementById(id);

let products = loadProducts();
let currentPage = 1;
let selectedImage = "";

// ==========================================
// STORAGE
// ==========================================

function loadProducts() {
    try {
        const saved = localStorage.getItem(KEY);
        const data = saved ? JSON.parse(saved) : [];

        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Could not load products:", error);
        return [];
    }
}

function saveProducts() {
    try {
        localStorage.setItem(KEY, JSON.stringify(products));
        return true;
    } catch (error) {
        console.error("Could not save products:", error);
        alert("Product save হয়নি। Image ছোট করে আবার চেষ্টা করো।");
        return false;
    }
}

// ==========================================
// HELPERS
// ==========================================

function safe(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[ch]);
}

function money(value) {
    return "৳ " + Number(value || 0).toLocaleString("en-BD", {
        maximumFractionDigits: 2
    });
}

function getFilterValue() {
    const value = $("statusFilter")?.value || "all";

    if (value === "in-stock") return "in";
    if (value === "out-of-stock") return "out";

    return "all";
}

function getFilteredProducts() {
    const query = ($("searchInput")?.value || "")
        .trim()
        .toLowerCase();

    const filter = getFilterValue();

    return products.filter(product => {
        const name = String(product.name || "").toLowerCase();
        const sku = String(product.sku || "").toLowerCase();

        const matchesSearch =
            name.includes(query) || sku.includes(query);

        const matchesStock =
            filter === "all" || product.stock === filter;

        return matchesSearch && matchesStock;
    });
}

// ==========================================
// RENDER PRODUCT LIST
// ==========================================

function renderProducts() {
    const table = $("productTable");

    if (!table) {
        console.error('HTML element "#productTable" পাওয়া যায়নি।');
        return;
    }

    const filtered = getFilteredProducts();

    if ($("totalProducts")) {
        $("totalProducts").textContent = products.length;
    }

    if ($("inStock")) {
        $("inStock").textContent =
            products.filter(p => p.stock === "in").length;
    }

    if ($("outStock")) {
        $("outStock").textContent =
            products.filter(p => p.stock === "out").length;
    }

    const pageCount = Math.max(
        1,
        Math.ceil(filtered.length / PAGE_SIZE)
    );

    currentPage = Math.max(1, Math.min(currentPage, pageCount));

    const start = (currentPage - 1) * PAGE_SIZE;
    const visible = filtered.slice(start, start + PAGE_SIZE);

    table.innerHTML = visible.map((p, i) => `
        <tr>
            <td>${String(start + i + 1).padStart(2, "0")}</td>

            <td>
                <div class="product-cell">
                    ${p.image
            ? `<img class="product-img"
                                src="${p.image}"
                                alt="${safe(p.name)}">`
            : `<div class="product-img"
                                style="display:grid;place-items:center;font-size:24px">📦</div>`
        }

                    <div>
                        <div class="product-name">${safe(p.name)}</div>
                        <div class="sku-note">RENZONE Product</div>
                    </div>
                </div>
            </td>

            <td>${safe(p.sku)}</td>
            <td>${money(p.china)}</td>
            <td>${money(p.shipping)}</td>
            <td>${Number(p.weight || 0).toLocaleString()} gm</td>
            <td class="sale-price">${money(p.selling)}</td>

            <td>
                <span class="status ${p.stock === "in" ? "in" : "out"}">
                    ${p.stock === "in" ? "● In Stock" : "● Out of Stock"}
                </span>
            </td>

            <td>
                <div class="action-group">
                    <button type="button"
                        class="icon-btn"
                        title="Edit"
                        data-edit="${p.id}">✎</button>

                    <button type="button"
                        class="icon-btn delete"
                        title="Delete"
                        data-delete="${p.id}">⌫</button>
                </div>
            </td>
        </tr>
    `).join("");

    if ($("emptyState")) {
        $("emptyState").hidden = filtered.length > 0;
    }

    if ($("showing")) {
        $("showing").textContent = filtered.length
            ? `Showing ${start + 1}–${Math.min(
                start + PAGE_SIZE,
                filtered.length
            )} of ${filtered.length} products`
            : "Showing 0 products";
    }

    if ($("pages")) {
        $("pages").innerHTML = Array.from(
            { length: pageCount },
            (_, i) => `
                <button type="button"
                    class="page-btn ${currentPage === i + 1 ? "active" : ""
                }"
                    data-page="${i + 1}">
                    ${i + 1}
                </button>
            `
        ).join("");
    }
}

// ==========================================
// OPEN / CLOSE PRODUCT FORM
// ==========================================

function openModal(product = null) {
    const form = $("productForm");
    const modal = $("productModal");

    if (!form || !modal) {
        console.error(
            'productForm অথবা productModal HTML-এ পাওয়া যায়নি।'
        );
        alert("Product form পাওয়া যায়নি। HTML ID পরীক্ষা করো।");
        return;
    }

    form.reset();

    selectedImage = "";

    if ($("editId")) {
        $("editId").value = product ? product.id : "";
    }

    if ($("modalTitle")) {
        $("modalTitle").textContent =
            product ? "Edit Product" : "Add New Product";
    }

    if (product) {
        $("name").value = product.name || "";
        $("sku").value = product.sku || "";
        $("china").value = product.china ?? "";
        $("shipping").value = product.shipping ?? "";
        $("weight").value = product.weight ?? "";
        $("selling").value = product.selling ?? "";
        $("stock").value = product.stock || "in";

        selectedImage = product.image || "";
    } else if ($("stock")) {
        $("stock").value = "in";
    }

    // একই display logic: open class + flex
    modal.style.display = "flex";
    modal.classList.add("open");
}

function closeModal() {
    const modal = $("productModal");
    const form = $("productForm");

    if (!modal) return;

    modal.classList.remove("open");
    modal.style.display = "none";

    if (form) form.reset();

    selectedImage = "";
}

// Add New
$("addProductBtn")?.addEventListener("click", event => {
    event.preventDefault();
    openModal();
});

// Close ×
$("closeModal")?.addEventListener("click", event => {
    event.preventDefault();
    closeModal();
});

// Cancel
$("cancelBtn")?.addEventListener("click", event => {
    event.preventDefault();
    closeModal();
});

// Click outside modal to close
$("productModal")?.addEventListener("click", event => {
    if (event.target === $("productModal")) {
        closeModal();
    }
});

// ==========================================
// SEARCH & STOCK FILTER
// ==========================================

$("searchInput")?.addEventListener("input", () => {
    currentPage = 1;
    renderProducts();
});

$("statusFilter")?.addEventListener("change", () => {
    currentPage = 1;
    renderProducts();
});

// ==========================================
// SAVE NEW PRODUCT / UPDATE PRODUCT
// ==========================================

$("productForm")?.addEventListener("submit", event => {
    event.preventDefault();

    const nameInput = $("name");
    const skuInput = $("sku");

    if (!nameInput || !skuInput) {
        alert("Product Name বা SKU input পাওয়া যায়নি।");
        return;
    }

    const name = nameInput.value.trim();
    const sku = skuInput.value.trim();
    const editValue = $("editId")?.value || "";
    const editId = String(editValue);

    if (!name || !sku) {
        alert("Product Name এবং SKU পূরণ করো।");
        return;
    }

    const duplicate = products.some(p =>
        String(p.sku || "").toLowerCase() === sku.toLowerCase() &&
        String(p.id) !== editId
    );

    if (duplicate) {
        alert("এই SKU আগে থেকেই আছে। অন্য SKU ব্যবহার করো।");
        return;
    }

    const oldProduct = editValue
        ? products.find(p => String(p.id) === editId)
        : null;

    if (editValue && !oldProduct) {
        alert("Edit করার product পাওয়া যায়নি। আবার চেষ্টা করো।");
        return;
    }

    const product = {
        id: oldProduct ? oldProduct.id : Date.now(),
        name,
        sku,
        china: Number($("china")?.value || 0),
        shipping: Number($("shipping")?.value || 0),
        weight: Number($("weight")?.value || 0),
        selling: Number($("selling")?.value || 0),
        stock: $("stock")?.value || "in",
        image: selectedImage || oldProduct?.image || ""
    };

    const previousProducts = products;

    products = oldProduct
        ? products.map(p =>
            String(p.id) === editId ? product : p
        )
        : [product, ...products];

    if (!saveProducts()) {
        products = previousProducts;
        return;
    }

    currentPage = 1;
    closeModal();
    renderProducts();

    alert(oldProduct
        ? "Product updated successfully!"
        : "Product added successfully!"
    );
});

// ==========================================
// EDIT / DELETE
// ==========================================

$("productTable")?.addEventListener("click", event => {
    const editButton = event.target.closest("[data-edit]");
    const deleteButton = event.target.closest("[data-delete]");

    if (editButton) {
        const product = products.find(
            p => String(p.id) === editButton.dataset.edit
        );

        if (product) openModal(product);
        return;
    }

    if (deleteButton) {
        const id = deleteButton.dataset.delete;

        const product = products.find(
            p => String(p.id) === id
        );

        if (!product) return;

        if (confirm(`Delete "${product.name}"?`)) {
            const previousProducts = products;

            products = products.filter(
                p => String(p.id) !== id
            );

            if (!saveProducts()) {
                products = previousProducts;
                return;
            }

            renderProducts();
        }
    }
});

// ==========================================
// PAGINATION
// ==========================================

$("pages")?.addEventListener("click", event => {
    const button = event.target.closest("[data-page]");

    if (!button) return;

    currentPage = Number(button.dataset.page);
    renderProducts();
});

// ==========================================
// IMAGE UPLOAD
// ==========================================

$("image")?.addEventListener("change", function () {
    const file = this.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("Valid image select করো।");
        this.value = "";
        return;
    }



    const reader = new FileReader();

    reader.onload = () => {
        selectedImage = reader.result;
    };

    reader.onerror = () => {
        alert("Image load হয়নি। আবার চেষ্টা করো।");
    };

    reader.readAsDataURL(file);
});

// ==========================================
// EXPORT CSV
// ==========================================

$("exportCsv")?.addEventListener("click", event => {
    event.preventDefault();

    const headers = [
        "Product Name",
        "SKU",
        "China Price (BDT)",
        "Shipping Cost per Piece",
        "Weight (gm)",
        "Selling Price (BDT)",
        "Stock Status"
    ];

    const rows = products.map(p => [
        p.name,
        p.sku,
        p.china,
        p.shipping,
        p.weight,
        p.selling,
        p.stock === "in" ? "In Stock" : "Out of Stock"
    ]);

    const csv = [headers, ...rows]
        .map(row => row.map(value =>
            '"' + String(value ?? "").replace(/"/g, '""') + '"'
        ).join(","))
        .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "renzone-products.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
});

// ==========================================
// INITIAL LOAD
// ==========================================

renderProducts();
