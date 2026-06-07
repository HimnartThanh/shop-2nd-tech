/* =========================================================
   XỬ LÝ DỮ LIỆU TỪ GOOGLE SHEETS & LOGIC GIAO DIỆN
========================================================= */

const SHEET_ID = '1AGDoaoLvld0Ia11_LEHRP2X0xa6C7xdOi2lwSc4wXtU';
let currentService = 'Mua';
let filterPrice = 'all';
let filterBrand = 'all';
let filterSort = 'none';
let currentCategory = 'Tất cả';
let searchQuery = '';
let allProducts = [];

// Chuyển đổi giữa các tab dịch vụ (Mua, Thu Mua, Cho Thuê, v.v.)
function switchService(serviceName, element) {
    currentService = serviceName;
    currentCategory = 'Tất cả';
    
    document.querySelectorAll('.service-tab').forEach(t => t.classList.remove('active'));
    element.classList.add('active');
    
    const sideFilter = document.getElementById('sidebar-filter-zone');
    const subNav = document.getElementById('sub-nav');
    
    if (serviceName === 'Mua') {
        sideFilter.style.visibility = 'visible';
        subNav.style.display = 'flex';
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.cat-btn')[0].classList.add('active');
    } else {
        sideFilter.style.visibility = 'hidden';
        subNav.style.display = (serviceName === 'ThiBangLai') ? 'none' : 'flex';
    }
    
    loadData();
}

// Tải dữ liệu từ Google Sheets
function loadData() {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(currentService)}`;
    
    // Hiển thị trạng thái đang tải
    document.getElementById('product-list').innerHTML = '<div class="loading">Đang nạp dữ liệu kho QuanLiWeb...</div>';
    
    fetch(url)
        .then(res => res.text())
        .then(txt => {
            const jsonString = txt.substring(txt.indexOf("{"), txt.lastIndexOf("}") + 1);
            const data = JSON.parse(jsonString);
            const rows = data.table.rows;

            if (currentService === 'Mua') {
                allProducts = rows.map(r => ({
                    id: r.c[0] ? r.c[0].v : 'Mã trống',
                    category: r.c[1] ? r.c[1].v : 'Chưa phân loại',
                    brand: r.c[2] ? r.c[2].v : 'Khác',
                    name: r.c[3] ? r.c[3].v : 'Sản phẩm không tên',
                    image: r.c[4] ? r.c[4].v : '',
                    oldPrice: r.c[5] ? Number(r.c[5].v) : 0,
                    price: r.c[6] ? Number(r.c[6].v) : 0,
                    stock: r.c[7] ? Number(r.c[7].v) : 0,
                    desc: r.c[8] ? r.c[8].v : ''
                }));
            } else {
                allProducts = rows.map(r => ({
                    id: r.c[0] ? r.c[0].v : '',
                    category: r.c[1] ? r.c[1].v : '',
                    name: r.c[2] ? r.c[2].v : '',
                    image: r.c[3] ? r.c[3].v : '',
                    price: r.c[4] ? r.c[4].v : 'Liên hệ',
                    stock: r.c[5] ? r.c[5].v : '',
                    desc: r.c[6] ? r.c[6].v : ''
                }));
            }
            renderView();
        })
        .catch(error => {
            console.error("Lỗi tải dữ liệu Google Sheets: ", error);
            document.getElementById('product-list').innerHTML = '<div class="loading">Lỗi kết nối dữ liệu. Vui lòng kiểm tra quyền chia sẻ Google Sheets.</div>';
        });
}

// Đổ dữ liệu ra giao diện HTML
function renderView() {
    const grid = document.getElementById('product-list');
    let html = '';
    let displayList = [...allProducts];

    if (currentService === 'Mua') {
        if (currentCategory !== 'Tất cả') {
            displayList = displayList.filter(p => p.category.trim().toLowerCase() === currentCategory.trim().toLowerCase());
        }
        if (filterPrice === 'under5') displayList = displayList.filter(p => p.price < 5000000);
        else if (filterPrice === '5to15') displayList = displayList.filter(p => p.price >= 5000000 && p.price <= 15000000);
        else if (filterPrice === 'over15') displayList = displayList.filter(p => p.price > 15000000);

        if (filterBrand !== 'all') {
            displayList = displayList.filter(p => p.brand.trim().toLowerCase() === filterBrand.toLowerCase());
        }
        if (searchQuery) displayList = displayList.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

        if (filterSort === 'asc') displayList.sort((a,b) => a.price - b.price);
        else if (filterSort === 'desc') displayList.sort((a,b) => b.price - a.price);

        if(displayList.length === 0) return grid.innerHTML = '<div class="loading">Không tìm thấy sản phẩm phù hợp.</div>';

        displayList.forEach(p => {
            let pct = 0;
            let saved = p.oldPrice - p.price;
            if (p.oldPrice > 0) pct = Math.round((saved / p.oldPrice) * 100);

            let imgHtml = p.image ? `<img class="product-img" src="${p.image}">` : `<div class="no-img-graffiti">Liên hệ để lấy<br>hình thực tế</div>`;
            let saleBadgeHtml = pct > 0 ? `<div class="sale-badge"><i class="fa-solid fa-fire"></i> GIẢM ${pct}%</div>` : '';
            let msgMua = encodeURIComponent(`Mình cần chốt mua sản phẩm: ${p.name} (Mã hàng: ${p.id})`);

            html += `
                <div class="product-card">
                    ${saleBadgeHtml}
                    <div class="img-container">${imgHtml}</div>
                    <div class="product-info">
                        <div class="product-name">${p.name}</div>
                        <div class="product-desc">${p.desc || 'Xem cấu hình chi tiết.'}</div>
                        <div class="price-row">
                            <span class="old-price">${p.oldPrice.toLocaleString('vi-VN')}₫</span>
                            <span class="current-price">${p.price.toLocaleString('vi-VN')}₫</span>
                        </div>
                        <div class="save-money"><i class="fa-solid fa-piggy-bank"></i> Tiết kiệm: ${saved.toLocaleString('vi-VN')}₫</div>
                        <div class="stock-status">Số lượng còn: ${p.stock} máy</div>
                        
                        <div class="btn-group">
                            <a href="https://zalo.me/0343321608?text=${msgMua}" target="_blank" class="contact-btn btn-mua-zalo"><i class="fa-solid fa-cart-shopping"></i> Mua</a>
                            <button onclick="openDetailPopup('${p.id}')" class="contact-btn btn-detail"><i class="fa-solid fa-circle-info"></i> Chi tiết</button>
                        </div>
                    </div>
                </div>`;
        });
    } else {
        if (currentService !== 'ThiBangLai' && currentCategory !== 'Tất cả') {
            displayList = displayList.filter(p => p.category.trim().toLowerCase() === currentCategory.trim().toLowerCase());
        }
        displayList.forEach(p => {
            let priceText = typeof p.price === 'number' ? p.price.toLocaleString('vi-VN') + '₫' : p.price;
            html += `
                <div class="product-card">
                    <div class="img-container"><img class="product-img" src="${p.image || 'https://via.placeholder.com/200?text=Web2Hand'}"></div>
                    <div class="product-info">
                        <div class="product-name">${p.name}</div>
                        <div class="product-desc">${p.desc || ''}</div>
                        <div class="current-price" style="margin-bottom:10px;">${priceText}</div>
                        <a href="https://zalo.me/0343321608" target="_blank" class="contact-btn btn-mua-zalo btn-action-tab"><i class="fa-solid fa-comments"></i> Liên hệ dịch vụ ngay</a>
                    </div>
                </div>`;
        });
    }
    grid.innerHTML = html;
}

// Xử lý Popup
function openDetailPopup(productId) {
    const product = allProducts.find(p => p.id === productId);
    if(!product) return;

    document.getElementById('pop-title').innerText = product.name;
    document.getElementById('pop-desc').innerText = product.desc || 'Thiết bị đã được kiểm định nghiêm ngặt. Liên hệ hotline shop để nhận thêm video thực tế.';
    
    const imgZone = document.getElementById('pop-img-zone');
    imgZone.innerHTML = product.image ? `<img src="${product.image}" style="max-width:100%; max-height:180px; object-fit:contain;">` : `<div class="no-img-graffiti">LIÊN HỆ LẤY HÌNH</div>`;

    const related = allProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
    const relatedGrid = document.getElementById('pop-related-grid');
    relatedGrid.innerHTML = '';

    if (related.length === 0) {
        relatedGrid.innerHTML = '<span style="font-size:0.95rem; color:#888;">Hiện chưa có thêm sản phẩm cùng loại.</span>';
    } else {
        related.forEach(item => {
            const d = document.createElement('div');
            d.className = 'related-item';
            d.innerText = item.name;
            d.onclick = () => openDetailPopup(item.id);
            relatedGrid.appendChild(d);
        });
    }
    document.getElementById('detail-popup').style.display = 'flex';
}

function closePopup() { document.getElementById('detail-popup').style.display = 'none'; }
function clickPromoTag(tagName) {
    const title = document.getElementById('pop-title').innerText;
    window.open(`https://zalo.me/0343321608?text=${encodeURIComponent(`Mình cần tư vấn sản phẩm ${title} về gói dịch vụ: [${tagName}]`)}`, '_blank');
}

// Xử lý các bộ lọc
function filterByCategory(catName) {
    currentCategory = catName;
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    if(event) event.currentTarget.classList.add('active');
    renderView();
}
function setPriceFilter(val) { filterPrice = val; renderView(); }
function setBrandFilter(val) { filterBrand = val; renderView(); }
function setSortFilter(val) { filterSort = val; renderView(); }
function searchProducts() { searchQuery = document.getElementById('search-input').value.trim(); renderView(); }

// Chạy hàm tải dữ liệu ngay khi vừa mở web
window.onload = loadData;
