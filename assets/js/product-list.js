
const KEY = "renzone_products_v1";
const PAGE_SIZE = 6;

// কোনো demo বা sample product থাকবে না
let products = loadProducts();
let currentPage = 1;
let selectedImage = "";

function loadProducts() {
    try {
        const saved = localStorage.getItem(KEY);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}


function saveProducts() {
    try {
        localStorage.setItem(KEY, JSON.stringify(products));
    } catch {
        alert("Browser storage is full. Try a smaller image.");
    }
}

function safe(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;",
        '"': "&quot;", "'": "&#39;"
    })[ch]);
}

function money(value) {
    return "৳ " + Number(value || 0).toLocaleString("en-BD", {
        maximumFractionDigits: 2
    });
}

function renderProducts() {
    const query = $("search").value.trim().toLowerCase();
    const filter = $("stockFilter").value;

    const filtered = products.filter(p =>
        (p.name.toLowerCase().includes(query) ||
            p.sku.toLowerCase().includes(query)) &&
        (filter === "all" || p.stock === filter)
    );

    $("totalProducts").textContent = products.length;
    $("inStock").textContent =
        products.filter(p => p.stock === "in").length;
    $("outStock").textContent =
        products.filter(p => p.stock === "out").length;

    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    currentPage = Math.min(currentPage, pageCount);

    const start = (currentPage - 1) * PAGE_SIZE;
    const visible = filtered.slice(start, start + PAGE_SIZE);

    $("productTable").innerHTML = visible.map((p, i) => `
    <tr>
      <td>${String(start + i + 1).padStart(2, "0")}</td>
      <td>
        <div class="product-cell">
          ${p.image
            ? `<img class="product-img" src="${p.image}" alt="${safe(p.name)}">`
            : `<div class="product-img" style="display:grid;place-items:center;font-size:24px">📦</div>`
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
      <td>${Number(p.weight).toLocaleString()} gm</td>
      <td class="sale-price">${money(p.selling)}</td>
      <td>
        <span class="status ${p.stock}">
          ${p.stock === "in" ? "● In Stock" : "● Out of Stock"}
        </span>
      </td>
      <td>
        <div class="action-group">
          <button class="icon-btn" title="Edit" data-edit="${p.id}">✎</button>
          <button class="icon-btn delete" title="Delete" data-delete="${p.id}">⌫</button>
        </div>
      </td>
    </tr>
  `).join("");

    $("emptyState").hidden = filtered.length !== 0;

    $("showing").textContent = filtered.length
        ? `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, filtered.length)} of ${filtered.length} products`
        : "Showing 0 products";

    $("pages").innerHTML = Array.from({ length: pageCount }, (_, i) => `
    <button class="page-btn ${currentPage === i + 1 ? "active" : ""}"
      data-page="${i + 1}">${i + 1}</button>
  `).join("");
}

function openModal(product = null) {
    $("productForm").reset();
    $("editId").value = product ? product.id : "";
    $("modalTitle").textContent = product ? "Edit Product" : "Add New Product";

    if (product) {
        $("name").value = product.name;
        $("sku").value = product.sku;
        $("china").value = product.china;
        $("shipping").value = product.shipping;
        $("weight").value = product.weight;
        $("selling").value = product.selling;
        $("stock").value = product.stock;
    }

    selectedImage = product?.image || "";
    $("productModal").classList.add("open");
}

function closeModal() {
    $("productModal").classList.remove("open");
}

$("addProductBtn").addEventListener("click", () => openModal());
$("closeModal").addEventListener("click", closeModal);
$("cancelBtn").addEventListener("click", closeModal);
$("search").addEventListener("input", () => {
    currentPage = 1;
    renderProducts();
});
$("stockFilter").addEventListener("change", () => {
    currentPage = 1;
    renderProducts();
});

$("productTable").addEventListener("click", e => {
    const editBtn = e.target.closest("[data-edit]");
    const deleteBtn = e.target.closest("[data-delete]");

    if (editBtn) {
        const product = products.find(p => p.id === Number(editBtn.dataset.edit));
        if (product) openModal(product);
    }

    if (deleteBtn) {
        const id = Number(deleteBtn.dataset.delete);
        const product = products.find(p => p.id === id);

        if (product && confirm(`Delete "${product.name}"?`)) {
            products = products.filter(p => p.id !== id);
            saveProducts();
            renderProducts();
        }
    }
});

$("pages").addEventListener("click", e => {
    const button = e.target.closest("[data-page]");
    if (!button) return;

    currentPage = Number(button.dataset.page);
    renderProducts();
});

$("image").addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("Please select a valid image.");
        this.value = "";
        return;
    }

    if (file.size > 500 * 1024) {
        alert("Image must be under 500 KB.");
        this.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = () => selectedImage = reader.result;
    reader.readAsDataURL(file);
});

$("productForm").addEventListener("submit", e => {
    e.preventDefault();

    const editId = Number($("editId").value);
    const sku = $("sku").value.trim();
    const name = $("name").value.trim();

    if (!name || !sku) return;

    const duplicate = products.some(p =>
        p.sku.toLowerCase() === sku.toLowerCase() && p.id !== editId
    );

    if (duplicate) {
        alert("This SKU already exists. Please use a unique SKU.");
        return;
    }

    const old = products.find(p => p.id === editId);

    const product = {
        id: editId || Date.now(),
        name,
        sku,
        china: Number($("china").value),
        shipping: Number($("shipping").value),
        weight: Number($("weight").value),
        selling: Number($("selling").value),
        stock: $("stock").value,
        image: selectedImage || old?.image || ""
    };

    if (editId) {
        products = products.map(p => p.id === editId ? product : p);
    } else {
        products.unshift(product);
    }

    saveProducts();
    currentPage = 1;
    closeModal();
    renderProducts();
});

$("productModal").addEventListener("click", e => {
    if (e.target === $("productModal")) closeModal();
});

$("exportBtn").addEventListener("click", () => {
    const headers = [
        "Product Name", "SKU", "China Price (BDT)",
        "Shipping Cost per Piece", "Weight (gm)",
        "Selling Price (BDT)", "Stock Status"
    ];

    const rows = products.map(p => [
        p.name, p.sku, p.china, p.shipping,
        p.weight, p.selling,
        p.stock === "in" ? "In Stock" : "Out of Stock"
    ]);

    const csv = [headers, ...rows]
        .map(row => row.map(v =>
            '"' + String(v).replace(/"/g, '""') + '"'
        ).join(","))
        .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "renzone-products.csv";
    a.click();
    URL.revokeObjectURL(url);
});

renderProducts();
