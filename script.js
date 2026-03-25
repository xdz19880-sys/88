/* script.js - النسخة المصححة */
import { db, auth, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, signInWithEmailAndPassword, signOut, onAuthStateChanged } from './firebase-config.js';

// === إعدادات ===
const WHATSAPP_NUMBER = "213550000000";

// === بيانات الولايات ===
const wilayas = [
    { id: 16, name: "الجزائر", price: 400 },
    { id: 31, name: "وهران", price: 500 },
    { id: 25, name: "قسنطينة", price: 500 },
    { id: 30, name: "ورقلة", price: 800 },
    { id: 1, name: "أدرار", price: 900 },
    { id: 15, name: "البويرة", price: 450 },
    { id: 9, name: "البليدة", price: 400 },
    { id: 19, name: "سطيف", price: 500 },
    { id: 0, name: "ولايات أخرى", price: 600 }
];

// === دوال مساعدة ===
const showLoader = (show) => {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = show ? 'flex' : 'none';
};

const showToast = (message, type = 'success') => {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};

// === دوال قاعدة البيانات ===
const getProducts = async () => {
    try {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting products:", error);
        return [];
    }
};

const saveProduct = async (product) => {
    showLoader(true);
    try {
        if (product.id) {
            await updateDoc(doc(db, "products", product.id), product);
            showToast('تم تعديل المنتج بنجاح', 'success');
        } else {
            product.createdAt = new Date().toISOString();
            await addDoc(collection(db, "products"), product);
            showToast('تمت إضافة المنتج بنجاح', 'success');
        }
    } catch (e) {
        showToast('حدث خطأ أثناء الحفظ', 'error');
        console.error(e);
    } finally {
        showLoader(false);
    }
};

const deleteProductFromDB = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
        showLoader(true);
        await deleteDoc(doc(db, "products", id));
        showToast('تم حذف المنتج', 'success');
        showLoader(false);
        if (window.renderAdminProducts) window.renderAdminProducts();
    }
};

const getOrders = async () => {
    try {
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting orders:", error);
        return [];
    }
};

const saveOrder = async (order) => {
    order.createdAt = new Date().toISOString();
    await addDoc(collection(db, "orders"), order);
};

const updateOrder = async (id, data) => {
    await updateDoc(doc(db, "orders", id), data);
};

// === نظام المصادقة ===
const login = async (email, password) => {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        return true;
    } catch (error) {
        showToast('البريد أو كلمة المرور غير صحيحة', 'error');
        return false;
    }
};

const logout = async () => {
    await signOut(auth);
    window.location.reload();
};

// === دالة initAdminFeatures - مُعرّفة في النطاق العام ===
async function initAdminFeatures() {
    // إضافة حقول الصور
    window.addImageField = (url = '') => {
        const container = document.getElementById('images-container');
        if (!container) return;
        const div = document.createElement('div');
        div.style.cssText = 'display:flex;gap:5px;margin-bottom:5px;';
        div.innerHTML = `
            <input type="url" class="prod-img-input" placeholder="رابط الصورة" value="${url}" style="flex:1;padding:8px;border:1px solid #ddd;border-radius:5px;" required>
            <button type="button" onclick="this.parentElement.remove()" style="background:#ef4444;color:white;border:none;padding:8px 12px;border-radius:5px;cursor:pointer;">✕</button>
        `;
        container.appendChild(div);
    };

    // حساب وعرض الإحصائيات
    const renderStats = async () => {
        const orders = await getOrders();
        const totalSales = orders.filter(o => o.status !== 'ملغي').reduce((sum, o) => sum + o.total, 0);
        const pendingOrders = orders.filter(o => o.status === 'جديد' || o.status === 'مؤكد').length;
        const deliveredOrders = orders.filter(o => o.status === 'تم التوصيل').length;
        
        const statSales = document.getElementById('stat-sales');
        const statOrders = document.getElementById('stat-orders');
        const statPending = document.getElementById('stat-pending');
        const statDelivered = document.getElementById('stat-delivered');
        
        if (statSales) statSales.innerText = totalSales.toLocaleString() + ' دج';
        if (statOrders) statOrders.innerText = orders.length;
        if (statPending) statPending.innerText = pendingOrders;
        if (statDelivered) statDelivered.innerText = deliveredOrders;
    };

    // عرض المنتجات في لوحة التحكم
    window.renderAdminProducts = async () => {
        const list = document.getElementById('admin-products-list');
        if (!list) return;
        const products = await getProducts();
        list.innerHTML = '';
        products.forEach(p => {
            const div = document.createElement('div');
            div.style.cssText = 'border:1px solid #ddd;padding:15px;margin-bottom:10px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;background:#fff;';
            div.innerHTML = `
                <div style="display:flex;align-items:center;gap:15px;">
                    <img src="${p.image}" width="60" style="border-radius:8px;object-fit:cover;">
                    <div>
                        <div style="font-weight:bold;font-size:16px;">${p.name}</div>
                        <div style="color:#2563eb;font-weight:600;">${p.price.toLocaleString()} دج</div>
                    </div>
                </div>
                <div style="display:flex;gap:10px;">
                    <button onclick="editProduct('${p.id}')" style="background:#2563eb;color:white;border:none;padding:8px 15px;border-radius:5px;cursor:pointer;">✏️ تعديل</button>
                    <button onclick="deleteProduct('${p.id}')" style="background:#ef4444;color:white;border:none;padding:8px 15px;border-radius:5px;cursor:pointer;">🗑️ حذف</button>
                </div>
            `;
            list.appendChild(div);
        });
    };

    // حفظ المنتج
    const saveProductForm = async (e) => {
        e.preventDefault();
        const productId = document.getElementById('edit-product-id').value;
        
        const imgInputs = document.querySelectorAll('.prod-img-input');
        const images = Array.from(imgInputs).map(input => input.value).filter(val => val.trim() !== '');
        
        if (images.length === 0) {
            showToast('يجب إضافة صورة واحدة على الأقل', 'error');
            return;
        }

        const productData = {
            name: document.getElementById('prod-name').value,
            price: parseFloat(document.getElementById('prod-price').value),
            image: images[0], 
            images: images,
            desc: document.getElementById('prod-desc').value
        };

        if (productId) productData.id = productId;
        await saveProduct(productData);
        
        resetProductForm();
        window.renderAdminProducts();
    };

    const resetProductForm = () => {
        const form = document.getElementById('add-product-form');
        if (form) form.reset();
        const editId = document.getElementById('edit-product-id');
        if (editId) editId.value = '';
        const formTitle = document.querySelector('#add-product-form h3');
        if (formTitle) formTitle.innerText = '➕ إضافة منتج جديد';
        const imgContainer = document.getElementById('images-container');
        if (imgContainer) imgContainer.innerHTML = '';
        addImageField();
    };

    window.editProduct = async (id) => {
        const products = await getProducts();
        const product = products.find(p => p.id === id);
        if (product) {
            document.getElementById('prod-name').value = product.name;
            document.getElementById('prod-price').value = product.price;
            document.getElementById('prod-desc').value = product.desc;
            document.getElementById('edit-product-id').value = product.id;
            
            document.getElementById('images-container').innerHTML = '';
            product.images.forEach(img => addImageField(img));
            
            const formTitle = document.querySelector('#add-product-form h3');
            if (formTitle) formTitle.innerText = '✏️ تعديل المنتج';
            
            document.getElementById('add-product-form').scrollIntoView({ behavior: 'smooth' });
        }
    };

    window.deleteProduct = deleteProductFromDB;

    // عرض الطلبات
    const renderOrders = async () => {
        const tbody = document.getElementById('orders-table-body');
        if (!tbody) return;
        const orders = await getOrders();
        tbody.innerHTML = '';
        orders.forEach(o => {
            let statusColor = '#f59e0b';
            if (o.status === 'مؤكد') statusColor = '#2563eb';
            if (o.status === 'في التوصيل') statusColor = '#8b5cf6';
            if (o.status === 'تم التوصيل') statusColor = '#10b981';
            if (o.status === 'ملغي') statusColor = '#ef4444';

            const row = `
                <tr>
                    <td><img src="${o.product.image}" width="50" style="border-radius:5px;"></td>
                    <td>${o.product.name}</td>
                    <td>${o.customer.fname} ${o.customer.lname}<br><small style="color:#666;">${o.customer.phone}</small></td>
                    <td>${o.customer.wilaya}</td>
                    <td><strong>${o.total.toLocaleString()} دج</strong></td>
                    <td><span style="background:${statusColor};color:white;padding:5px 10px;border-radius:15px;font-size:12px;">${o.status}</span></td>
                    <td>${o.date}</td>
                    <td><button onclick="editOrder('${o.id}')" style="background:#2563eb;color:white;border:none;padding:6px 12px;border-radius:5px;cursor:pointer;">تعديل</button></td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    };

    // تصدير الطلبات
    window.exportOrders = async () => {
        showLoader(true);
        const orders = await getOrders();
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
        csvContent += "التاريخ,الزبون,الهاتف,الولاية,العنوان,المنتج,السعر,حالة الطلب\n";
        orders.forEach(o => {
            const row = `${o.date},${o.customer.fname} ${o.customer.lname},${o.customer.phone},${o.customer.wilaya},${o.customer.address},${o.product.name},${o.total},${o.status}`;
            csvContent += row + "\n";
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `orders-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        showToast('تم تحميل الملف بنجاح', 'success');
        showLoader(false);
    };

    // تعديل الطلب
    window.editOrder = async (id) => {
        const orders = await getOrders();
        const order = orders.find(o => o.id === id);
        if (!order) return;

        document.getElementById('edit-order-id').value = order.id;
        document.getElementById('edit-fname').value = order.customer.fname;
        document.getElementById('edit-lname').value = order.customer.lname;
        document.getElementById('edit-phone').value = order.customer.phone;
        document.getElementById('edit-address').value = order.customer.address;
        document.getElementById('edit-wilaya').value = order.customer.wilaya;
        document.getElementById('edit-status').value = order.status;

        document.getElementById('order-edit-modal').style.display = 'flex';
    };

    window.saveOrderEdit = async (e) => {
        e.preventDefault();
        showLoader(true);
        const orderId = document.getElementById('edit-order-id').value;
        
        await updateOrder(orderId, {
            customer: {
                fname: document.getElementById('edit-fname').value,
                lname: document.getElementById('edit-lname').value,
                phone: document.getElementById('edit-phone').value,
                address: document.getElementById('edit-address').value,
                wilaya: document.getElementById('edit-wilaya').value
            },
            status: document.getElementById('edit-status').value
        });
        
        document.getElementById('order-edit-modal').style.display = 'none';
        renderOrders();
        renderStats();
        showToast('تم تحديث الطلب بنجاح', 'success');
        showLoader(false);
    };

    window.closeEditModal = () => {
        document.getElementById('order-edit-modal').style.display = 'none';
    };

    // ربط الأحداث
    document.getElementById('add-product-form')?.addEventListener('submit', saveProductForm);
    document.getElementById('edit-order-form')?.addEventListener('submit', saveOrderEdit);
    document.getElementById('export-btn')?.addEventListener('click', exportOrders);

    if (document.getElementById('images-container')) addImageField();

    await renderStats();
    await renderOrders();
    await window.renderAdminProducts();
}

// === صفحة المتجر الرئيسية (index.html) ===
if (document.querySelector('.products-grid')) {
    const grid = document.querySelector('.products-grid');
    const searchInput = document.getElementById('product-search');

    const renderProducts = (products) => {
        grid.innerHTML = '';
        if (products.length === 0) {
            grid.innerHTML = '<p style="text-align:center;width:100%;color:#666;">لا توجد منتجات مطابقة</p>';
            return;
        }
        products.forEach(p => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-image">
                    <img src="${p.image}" alt="${p.name}" loading="lazy">
                </div>
                <div class="card-body">
                    <h3 class="card-title">${p.name}</h3>
                    <div class="card-price">${p.price.toLocaleString()} دج</div>
                    <button class="btn-view">عرض التفاصيل 👁️</button>
                </div>
            `;
            card.onclick = () => window.location.href = `product.html?id=${p.id}`;
            grid.appendChild(card);
        });
    };

    getProducts().then(products => {
        renderProducts(products);
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = products.filter(p => p.name.toLowerCase().includes(term));
                renderProducts(filtered);
            });
        }
    });
}

// === صفحة المنتج (product.html) ===
if (document.getElementById('product-detail-container')) {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    getProducts().then(products => {
        const product = products.find(p => p.id === productId);
        
        if (product) {
            const mainImg = document.getElementById('p-img');
            if (mainImg) mainImg.src = product.image;
            
            const gallery = document.getElementById('thumbnail-gallery');
            if (gallery && product.images) {
                product.images.forEach((img, index) => {
                    const thumb = document.createElement('img');
                    thumb.src = img;
                    thumb.className = 'thumbnail' + (index === 0 ? ' active' : '');
                    thumb.onclick = () => {
                        mainImg.src = img;
                        document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                        thumb.classList.add('active');
                    };
                    gallery.appendChild(thumb);
                });
            }

            const pTitle = document.getElementById('p-title');
            const pDesc = document.getElementById('p-desc');
            const pPrice = document.getElementById('p-price');
            const basePriceInput = document.getElementById('base-price');

            if (pTitle) pTitle.innerText = product.name;
            if (pDesc) pDesc.innerText = product.desc;
            if (pPrice) pPrice.innerText = product.price.toLocaleString() + ' دج';
            if (basePriceInput) basePriceInput.value = product.price;

            const wilayaSelect = document.getElementById('wilaya');
            if (wilayaSelect) {
                wilayas.forEach(w => {
                    const option = document.createElement('option');
                    option.value = w.price;
                    option.text = `${w.name} (${w.price} دج)`;
                    wilayaSelect.appendChild(option); 
                });

                function calculateTotal() {
                    const price = parseFloat(document.getElementById('base-price').value);
                    const delivery = parseFloat(document.getElementById('wilaya').value);
                    const total = price + delivery;
                    const totalEl = document.getElementById('total-price');
                    if (totalEl) totalEl.innerText = total.toLocaleString() + ' دج';
                    return total;
                }

                document.getElementById('wilaya').addEventListener('change', calculateTotal);
                
                document.getElementById('order-form').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    showLoader(true);
                    
                    const total = calculateTotal();
                    const customer = {
                        fname: document.getElementById('fname').value,
                        lname: document.getElementById('lname').value,
                        wilaya: document.getElementById('wilaya').options[document.getElementById('wilaya').selectedIndex].text,
                        address: document.getElementById('address').value,
                        phone: document.getElementById('phone').value
                    };

                    const order = {
                        status: 'جديد',
                        product: { name: product.name, price: product.price, image: product.image },
                        customer: customer,
                        deliveryPrice: parseFloat(document.getElementById('wilaya').value),
                        total: total,
                        date: new Date().toLocaleString('ar-DZ')
                    };

                    try {
                        await saveOrder(order);
                        
                        const message = `🛒 طلب جديد:%0a━━━━━━━━━━━━%0a📦 المنتج: ${product.name}%0a💰 السعر: ${total} دج%0a━━━━━━━━━━━━%0a👤 الزبون: ${customer.fname} ${customer.lname}%0a📍 الولاية: ${customer.wilaya}%0a📱 الهاتف: ${customer.phone}`;
                        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');

                        showToast('تم استلام طلبك بنجاح!', 'success');
                        
                        const modal = document.getElementById('success-modal');
                        if (modal) modal.style.display = 'flex';
                        
                        setTimeout(() => window.location.href = 'index.html', 2000);
                    } catch (err) {
                        showToast('فشل إرسال الطلب', 'error');
                        console.error(err);
                    } finally {
                        showLoader(false);
                    }
                });
            }
        } else {
            const container = document.querySelector('.container');
            if (container) container.innerHTML = "<h2>❌ المنتج غير موجود</h2>";
        }
    });
}

// === لوحة التحكم (admin.html) - استخدام onAuthStateChanged ===
if (document.getElementById('admin-content')) {
    const loginSection = document.getElementById('login-section');
    const adminContent = document.getElementById('admin-content');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');

    // مراقبة حالة المصادقة من Firebase
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // المستخدم مسجل دخول
            if (loginSection) loginSection.style.display = 'none';
            if (adminContent) adminContent.style.display = 'block';
            initAdminFeatures(); // ✅ الآن الدالة مُعرّفة ويمكن الوصول إليها
        } else {
            // المستخدم غير مسجل دخول
            if (loginSection) loginSection.style.display = 'flex';
            if (adminContent) adminContent.style.display = 'none';
        }
    });

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            await login(email, password);
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}