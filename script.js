// ======================================================
// script.js - المنطق البرمجي لموقع دَوِّر
// ======================================================

// ---------- 1. بيانات الأدوات الافتراضية (تستخدم أول مرة بس) ----------
const defaultItems = [
    {
        id: 1,
        name: "كتاب رياضيات - صف  تاسع",
        category: "كتب",
        condition: "جيدة",
        method: "تبادل",
        price: null,
        owner: "سارة أحمد",
        phone: "01012345678",
        ownerEmail: null
    },
    {
        id: 2,
        name: "طقم أدوات هندسية",
        category: "أدوات هندسية",
        condition: "ممتازة",
        method: "استعارة",
        price: null,
        owner: "محمد علي",
        phone: "01123456789",
        ownerEmail: null
    },
    {
        id: 3,
        name: "قصة (ألف ليلة وليلة)",
        category: "قصص",
        condition: "مقبولة",
        method: "سعر رمزي",
        price: 10,
        owner: "ياسمين خالد",
        phone: "01234567890",
        ownerEmail: null
    },
    {
        id: 4,
        name: "مجسم مشروع علوم (نظام شمسي)",
        category: "مشاريع مدرسية",
        condition: "جيدة",
        method: "تبادل",
        price: null,
        owner: "عمر حسن",
        phone: "01098765432",
        ownerEmail: null
    }
];

// ---------- المفتاح المستخدم لتخزين الأدوات بالمتصفح ----------
const ITEMS_STORAGE_KEY = "dawwer_items";

// نتغير حالة "هل نحن بوضع تعديل أداة موجودة؟" ولو أيوه، إيش الـ id بتاعها
let editingItemId = null;

// ---------- دوال حفظ/تحميل الأدوات من localStorage ----------

// نجيب الأدوات من التخزين، ولو أول مرة (مفيش بيانات محفوظة) نستخدم القائمة الافتراضية
function loadItems() {
    const data = localStorage.getItem(ITEMS_STORAGE_KEY);
    return data ? JSON.parse(data) : defaultItems;
}

// نحفظ مصفوفة الأدوات الحالية بالمتصفح
function saveItems() {
    localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(items));
}

// مصفوفة الأدوات الفعلية اللي بيشتغل عليها الموقع
let items = loadItems();


// ---------- 2. عناصر الصفحة (نحفظها في متغيرات عشان نستخدمها كتير) ----------
const navButtons = document.querySelectorAll(".nav-btn");
const heroButtons = document.querySelectorAll(".hero-buttons .btn");
const pages = document.querySelectorAll(".page");

const itemsContainer = document.getElementById("items-container");
const noResultsMsg = document.getElementById("no-results-msg");

const addItemForm = document.getElementById("add-item-form");
const methodSelect = document.getElementById("item-method");
const priceFieldWrapper = document.getElementById("price-field-wrapper");
const priceInput = document.getElementById("item-price");
const successMsg = document.getElementById("form-success-msg");
const addFormTitle = document.querySelector("#add h2");
const addFormSubmitBtn = addItemForm.querySelector("button[type='submit']");

const searchInput = document.getElementById("search-input");
const filterCategory = document.getElementById("filter-category");
const filterMethod = document.getElementById("filter-method");
const myItemsContainer = document.getElementById("my-items-container");
const myItemsEmpty = document.getElementById("my-items-empty");


// ======================================================
// 3. التنقل بين الأقسام (Home / Browse / Add / About / Account)
// ======================================================

function showPage(pageId) {
    pages.forEach(function (page) {
        page.classList.remove("active-page");
    });

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add("active-page");
    }

    navButtons.forEach(function (btn) {
        if (btn.dataset.target === pageId) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    // لو رجع للصفحة الرئيسية، نحدث عداد الأثر البيئي
    if (pageId === "home") {
        updateImpactStats();
    }

    // لو فتح قسم "أدواتي"، نعرض أدواته المحدثة
    if (pageId === "my-items") {
        renderMyItems();
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
}

navButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
        showPage(btn.dataset.target);
    });
});

heroButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
        showPage(btn.dataset.target);
    });
});


// ======================================================
// 4. عرض الأدوات كبطاقات (Cards) + البحث والفلترة
// ======================================================

function getMethodClass(method) {
    if (method === "تبادل") return "method-exchange";
    if (method === "استعارة") return "method-borrow";
    if (method === "سعر رمزي") return "method-price";
    return "";
}

// دالة تحول رقم هاتف مصري (01xxxxxxxxx) لصيغة دولية لرابط واتساب (20xxxxxxxxxx)
function toWhatsAppNumber(phone) {
    if (phone.startsWith("0")) {
        return "20" + phone.substring(1);
    }
    return phone;
}

// دالة تطبق البحث والفلاتر الحالية وترجع الأدوات المطابقة فقط
function getFilteredItems() {
    const searchText = searchInput.value.trim().toLowerCase();
    const categoryValue = filterCategory.value;
    const methodValue = filterMethod.value;

    return items.filter(function (item) {
        const matchesSearch = item.name.toLowerCase().includes(searchText);
        const matchesCategory = (categoryValue === "الكل") || (item.category === categoryValue);
        const matchesMethod = (methodValue === "الكل") || (item.method === methodValue);
        return matchesSearch && matchesCategory && matchesMethod;
    });
}

// دالة تعرض الأدوات (بعد تطبيق البحث/الفلترة) داخل الصفحة
function renderItems() {
    const filteredItems = getFilteredItems();
    const currentUser = getCurrentUser();

    itemsContainer.innerHTML = "";

    // لو مفيش نتائج مطابقة، نظهر رسالة بدل ما نسيب المكان فاضي بدون تفسير
    if (filteredItems.length === 0) {
        noResultsMsg.classList.remove("hidden");
    } else {
        noResultsMsg.classList.add("hidden");
    }

    filteredItems.forEach(function (item) {
        const card = document.createElement("div");
        card.className = "item-card";

        let priceHTML = "";
        if (item.method === "سعر رمزي" && item.price) {
            priceHTML = `<p class="item-price">السعر: ${item.price} جنيه</p>`;
        }

        // زر واتساب بيفتح محادثة مباشرة مع صاحب الأداة
        const waNumber = toWhatsAppNumber(item.phone);
        const waMessage = encodeURIComponent("مرحباً، شفت إعلانك على دَوِّر عن: " + item.name);
        const whatsappHTML = `<a class="whatsapp-btn" href="https://wa.me/${waNumber}?text=${waMessage}" target="_blank" rel="noopener">📱 تواصل عبر واتساب</a>`;

        // أزرار تعديل/حذف تظهر بس لو الأداة تخص المستخدم المسجل دخول حالياً
        let ownerActionsHTML = "";
        if (currentUser && item.ownerEmail === currentUser.email) {
            ownerActionsHTML = `
                <div class="card-owner-actions">
                    <button class="edit-btn" data-edit-id="${item.id}">✏️ تعديل</button>
                    <button class="delete-btn" data-delete-id="${item.id}">🗑 حذف</button>
                </div>
            `;
        }

        card.innerHTML = `
        ${item.image ? `<img src="${item.image}" alt="${item.name}" class="item-image">` : ""}
            <h3>${item.name}</h3>
            <p>الفئة: ${item.category}</p>
            <p>الحالة: ${item.condition}</p>
            ${priceHTML}
            <span class="method-badge ${getMethodClass(item.method)}">${item.method}</span>
            <p class="item-owner">👤 ${item.owner}</p>
            <p class="item-phone">📞 ${item.phone}</p>
            ${whatsappHTML}
            ${ownerActionsHTML}
        `;

        itemsContainer.appendChild(card);
    });

    // نربط أزرار التعديل والحذف اللي اتولدت جديد بالكروت
    attachCardActionListeners(itemsContainer);
}

// نعيد رسم الأدوات كل ما المستخدم يكتب بالبحث أو يغير فلتر
searchInput.addEventListener("input", renderItems);
filterCategory.addEventListener("change", renderItems);
filterMethod.addEventListener("change", renderItems);

// دالة تعرض الأدوات اللي تخص المستخدم المسجل دخول حالياً في قسم "أدواتي"
function renderMyItems() {
    const currentUser = getCurrentUser();
    myItemsContainer.innerHTML = "";

    // لو مفيش مستخدم مسجل دخول، منعرضش أي حاجة ونبين رسالة مناسبة
    if (!currentUser) {
        myItemsEmpty.textContent = "سجل دخولك الأول عشان تقدر تشوف أدواتك.";
        myItemsEmpty.classList.remove("hidden");
        return;
    }

    const myItems = items.filter(function (item) {
        return item.ownerEmail === currentUser.email;
    });

    if (myItems.length === 0) {
        myItemsEmpty.textContent = "لسه مفيش أدوات أضفتها.";
        myItemsEmpty.classList.remove("hidden");
    } else {
        myItemsEmpty.classList.add("hidden");
    }

    myItems.forEach(function (item) {
        const card = document.createElement("div");
        card.className = "item-card";

        let priceHTML = "";
        if (item.method === "سعر رمزي" && item.price) {
            priceHTML = `<p class="item-price">السعر: ${item.price} جنيه</p>`;
        }

        card.innerHTML = `
        ${item.image ? `<img src="${item.image}" alt="${item.name}" class="item-image">` : ""}
            <h3>${item.name}</h3>
            <p>الفئة: ${item.category}</p>
            <p>الحالة: ${item.condition}</p>
            ${priceHTML}
            <span class="method-badge ${getMethodClass(item.method)}">${item.method}</span>
            <div class="card-owner-actions">
                <button class="edit-btn" data-edit-id="${item.id}">✏️ تعديل</button>
                <button class="delete-btn" data-delete-id="${item.id}">🗑 حذف</button>
            </div>
        `;

        myItemsContainer.appendChild(card);
    });

    attachCardActionListeners(myItemsContainer);
}


// ======================================================
// 5. حذف وتعديل أداة (بس لصاحبها المسجل دخول)
// ======================================================

function attachCardActionListeners(container) {
    const scope = container || document;

    // أزرار الحذف
    scope.querySelectorAll(".delete-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            const id = Number(btn.dataset.deleteId);
            const confirmDelete = confirm("متأكد إنك عاوز تحذف الأداة دي؟");
            if (!confirmDelete) return;

            items = items.filter(function (item) { return item.id !== id; });
            saveItems();
            renderItems();
            renderMyItems();
            updateImpactStats();
        });
    });

    // أزرار التعديل
    scope.querySelectorAll(".edit-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            const id = Number(btn.dataset.editId);
            const item = items.find(function (i) { return i.id === id; });
            if (!item) return;

            // نملأ الفورم ببيانات الأداة الحالية
            document.getElementById("item-name").value = item.name;
            document.getElementById("item-category").value = item.category;
            document.getElementById("item-condition").value = item.condition;
            methodSelect.value = item.method;
            document.getElementById("item-owner").value = item.owner;
            document.getElementById("item-phone").value = item.phone;

            if (item.method === "سعر رمزي") {
                priceFieldWrapper.classList.remove("hidden");
                priceInput.value = item.price || "";
            } else {
                priceFieldWrapper.classList.add("hidden");
            }

            // نفعل وضع "التعديل" ونغير شكل الفورم عشان يبين واضح
            editingItemId = id;
            addFormTitle.textContent = "تعديل الأداة";
            addFormSubmitBtn.textContent = "حفظ التعديلات";

            showPage("add");
        });
    });
}


// ======================================================
// 6. إظهار/إخفاء حقل السعر حسب طريقة الحصول على الأداة
// ======================================================

methodSelect.addEventListener("change", function () {
    if (methodSelect.value === "سعر رمزي") {
        priceFieldWrapper.classList.remove("hidden");
    } else {
        priceFieldWrapper.classList.add("hidden");
        priceInput.value = "";
    }
});


// ======================================================
// 7. إضافة/تعديل أداة عن طريق النموذج (Form)
// ======================================================

// تحول ملف صورة لنص base64 عشان يتخزن بشكل دائم في localStorage
// (لو استخدمنا URL.createObjectURL بدل كده، الرابط بيموت بعد ريفريش الصفحة)
function readImageAsBase64(file) {
    return new Promise(function (resolve, reject) {
        if (!file) {
            resolve(null);
            return;
        }
        const reader = new FileReader();
        reader.onload = function () { resolve(reader.result); };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

addItemForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("item-name").value.trim();
    const imageInput = document.getElementById("item-image");
    const category = document.getElementById("item-category").value;
    const condition = document.getElementById("item-condition").value;
    const method = methodSelect.value;
    const owner = document.getElementById("item-owner").value.trim();
    const phone = document.getElementById("item-phone").value.trim();

    let price = null;
    if (method === "سعر رمزي" && priceInput.value) {
        price = Number(priceInput.value);
    }

    if (name === "") {
        alert("من فضلك اكتب اسم الأداة.");
        return;
    }

    if (owner === "") {
        alert("من فضلك اكتب اسمك.");
        return;
    }

    if (phone === "" || !/^[0-9]{10,15}$/.test(phone)) {
        alert("من فضلك اكتب رقم هاتف صحيح (أرقام فقط، بين 10 و15 رقم).");
        return;
    }

    const currentUser = getCurrentUser();
    const ownerEmail = currentUser ? currentUser.email : null;

    // لو المستخدم اختار صورة جديدة نحولها base64، وإلا نسيبها null
    const newImageData = await readImageAsBase64(imageInput.files[0]);

    if (editingItemId !== null) {
        // ---- وضع التعديل: نحدث الأداة الموجودة بدل ما ننشئ وحدة جديدة ----
        const itemIndex = items.findIndex(function (i) { return i.id === editingItemId; });
        if (itemIndex !== -1) {
            items[itemIndex] = {
                id: editingItemId,
                name: name,
                category: category,
                condition: condition,
                method: method,
                price: price,
                owner: owner,
                phone: phone,
                // لو اختار صورة جديدة نستخدمها، وإلا نحافظ على الصورة القديمة
                image: newImageData !== null ? newImageData : items[itemIndex].image,
                ownerEmail: items[itemIndex].ownerEmail // نحافظ على صاحب الأداة الأصلي
            };
        }

        // نرجع الفورم لوضعه الطبيعي (إضافة أداة جديدة)
        editingItemId = null;
        addFormTitle.textContent = "أضف أداة جديدة";
        addFormSubmitBtn.textContent = "إضافة الأداة";

    } else {
        // ---- وضع الإضافة العادي: أداة جديدة كلياً ----
        const newItem = {
            id: Date.now(), // رقم فريد بسيط بناءً على الوقت الحالي
            name: name,
            category: category,
            condition: condition,
            method: method,
            price: price,
            owner: owner,
            phone: phone,
            image: newImageData,
            ownerEmail: ownerEmail
        };

        items.push(newItem);
    }

    saveItems();
    renderItems();
    renderMyItems();
    updateImpactStats();

    addItemForm.reset();
    priceFieldWrapper.classList.add("hidden");

    successMsg.classList.remove("hidden");
    setTimeout(function () {
        successMsg.classList.add("hidden");
    }, 2500);
});


// ======================================================
// 8. عداد الأثر البيئي (بالصفحة الرئيسية)
// ======================================================
// كل الأرقام هون حقيقية ومحسوبة من بيانات الموقع الفعلية
// (الأدوات المضافة والطلاب المسجلين)، مش أرقام وهمية ثابتة.

// دالة بسيطة لعمل تأثير "عدّاد متحرك" من رقم لرقم
function animateCounter(elementId, targetValue) {
    const el = document.getElementById(elementId);
    const duration = 800; // مدة الحركة بالميلي ثانية
    const steps = 30;
    const stepValue = targetValue / steps;
    let current = 0;
    let stepCount = 0;

    const interval = setInterval(function () {
        stepCount++;
        current += stepValue;

        if (stepCount >= steps) {
            el.textContent = Math.round(targetValue);
            clearInterval(interval);
        } else {
            el.textContent = Math.round(current);
        }
    }, duration / steps);
}

// دالة تحسب الإحصائيات الحالية بناء على بيانات الأدوات والمستخدمين الفعلية
function updateImpactStats() {
    // عدد الكتب المعاد استخدامها: أي أداة فئتها "كتب" أو "قصص"
    const booksCount = items.filter(function (item) {
        return item.category === "كتب" || item.category === "قصص";
    }).length;

    // عدد الأدوات المدرسية اللي طريقتها "تبادل"
    const toolsCount = items.filter(function (item) {
        return item.method === "تبادل";
    }).length;

    // إجمالي القطع اللي اتنقذت من الرمي (كل الأدوات المعروضة على الموقع)
    const rescuedCount = items.length;

    // عدد الطلاب المشاركين: كل الأسماء الفريدة اللي ظهرت كأصحاب أدوات
    // + كل الأسماء الفريدة للمستخدمين المسجلين (بدون تكرار لنفس الاسم)
    const participantsSet = new Set();

    items.forEach(function (item) {
        if (item.owner) {
            participantsSet.add(item.owner.trim().toLowerCase());
        }
    });

    getUsers().forEach(function (user) {
        if (user.name) {
            participantsSet.add(user.name.trim().toLowerCase());
        }
    });

    const studentsCount = participantsSet.size;

    animateCounter("stat-books", booksCount);
    animateCounter("stat-tools", toolsCount);
    animateCounter("stat-rescued", rescuedCount);
    animateCounter("stat-students", studentsCount);
}


// ======================================================
// 9. نظام حساب تجريبي (تسجيل دخول / إنشاء حساب)
// ======================================================
// ملاحظة: هذا نظام تعليمي بسيط فقط. البيانات بتتخزن محلياً
// بمتصفح المستخدم عن طريق localStorage، وليس بسيرفر حقيقي.
// لذلك هذا غير آمن لاستخدام حقيقي، لكنه مناسب للتعلم والتجربة.

const accountNavBtn = document.getElementById("account-nav-btn");
const loggedInView = document.getElementById("logged-in-view");
const loggedOutView = document.getElementById("logged-out-view");
const welcomeName = document.getElementById("welcome-name");
const logoutBtn = document.getElementById("logout-btn");

const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const loginError = document.getElementById("login-error");
const signupError = document.getElementById("signup-error");
const showSignupBtn = document.getElementById("show-signup-btn");
const showLoginBtn = document.getElementById("show-login-btn");

function getUsers() {
    const data = localStorage.getItem("dawwer_users");
    return data ? JSON.parse(data) : [];
}

function saveUsers(users) {
    localStorage.setItem("dawwer_users", JSON.stringify(users));
}

function getCurrentUser() {
    const data = localStorage.getItem("dawwer_current_user");
    return data ? JSON.parse(data) : null;
}

function updateAuthUI() {
    const currentUser = getCurrentUser();

    if (currentUser) {
        loggedInView.classList.remove("hidden");
        loggedOutView.classList.add("hidden");
        welcomeName.textContent = currentUser.name;
        accountNavBtn.textContent = "حسابي";
    } else {
        loggedInView.classList.add("hidden");
        loggedOutView.classList.remove("hidden");
        accountNavBtn.textContent = "تسجيل الدخول";
    }

    // نعيد رسم الأدوات عشان أزرار التعديل/الحذف تظهر أو تختفي حسب حالة الدخول
    renderItems();
    renderMyItems();
}

// --- التبديل من فورم الدخول لفورم إنشاء حساب جديد ---
showSignupBtn.addEventListener("click", function () {
    loginForm.classList.add("hidden");
    signupForm.classList.remove("hidden");
});

// --- التبديل الرجوع من فورم إنشاء الحساب لفورم الدخول ---
showLoginBtn.addEventListener("click", function () {
    signupForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
});

signupForm.addEventListener("submit", function (event) {
    event.preventDefault();
    signupError.classList.add("hidden");

    const name = document.getElementById("signup-name").value.trim();
    const email = document.getElementById("signup-email").value.trim().toLowerCase();
    const password = document.getElementById("signup-password").value;

    const users = getUsers();

    const emailExists = users.some(function (user) {
        return user.email === email;
    });

    if (emailExists) {
        signupError.textContent = "هذا البريد الإلكتروني مسجل بالفعل، جرب تسجيل الدخول.";
        signupError.classList.remove("hidden");
        return;
    }

    users.push({ name: name, email: email, password: password });
    saveUsers(users);

    localStorage.setItem("dawwer_current_user", JSON.stringify({ name: name, email: email }));

    signupForm.reset();
    updateAuthUI();
});

loginForm.addEventListener("submit", function (event) {
    event.preventDefault();
    loginError.classList.add("hidden");

    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const password = document.getElementById("login-password").value;

    const users = getUsers();
    const matchedUser = users.find(function (user) {
        return user.email === email && user.password === password;
    });

    if (!matchedUser) {
        loginError.textContent = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
        loginError.classList.remove("hidden");
        return;
    }

    localStorage.setItem("dawwer_current_user", JSON.stringify({
        name: matchedUser.name,
        email: matchedUser.email
    }));

    loginForm.reset();
    updateAuthUI();
});

logoutBtn.addEventListener("click", function () {
    localStorage.removeItem("dawwer_current_user");
    updateAuthUI();
    showPage("home");
});


// ======================================================
// 10. تشغيل أولي عند فتح الصفحة لأول مرة
// ======================================================
renderItems();
renderMyItems();
updateAuthUI();
updateImpactStats();
 