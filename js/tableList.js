let currentCategory = 'all';
let selectedItems = new Set();
let allData = [];
let currentPage = 1;
let pageSize = 20;
let totalPage = 1;

document.addEventListener('DOMContentLoaded', function() {
    initCategorySelect();
    initSelectAll();
    initButtons();
    
    loadAllData();
});

function initCategorySelect() {
    const select = document.getElementById('category-select');
    
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = '全部分类';
    select.appendChild(allOption);
    
    for (const [key, value] of Object.entries(movies)) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = value.typeName;
        select.appendChild(option);
    }
    
    select.addEventListener('change', function() {
        currentCategory = this.value;
        currentPage = 1;
        loadData();
    });
}

function initSelectAll() {
    const selectAll = document.getElementById('select-all');
    
    selectAll.addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.data-item .cyber-checkbox');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
            const itemId = checkbox.dataset.id;
            
            if (this.checked) {
                selectedItems.add(itemId);
            } else {
                selectedItems.delete(itemId);
            }
        });
        
        updateStats();
    });
}

function loadAllData() {
    allData = [];
    
    for (const [categoryKey, categoryData] of Object.entries(movies)) {
        if (categoryData.links) {
            categoryData.links.forEach((link, index) => {
                allData.push({
                    id: `${categoryKey}_${index}`,
                    title: link.title,
                    link: link.link,
                    linkType: link.linkType,
                    category: categoryData.typeName
                });
            });
        }
    }
    
    loadData();
}

function initButtons() {
    const copySelectedBtn = document.getElementById('copy-selected');
    const copyAllBtn = document.getElementById('copy-all');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    copySelectedBtn.addEventListener('click', copySelected);
    copyAllBtn.addEventListener('click', copyAll);
    
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
}

function handleSearch() {
    const searchInput = document.getElementById('search-input');
    const keyword = searchInput.value.trim().toLowerCase();
    
    if (!keyword) {
        loadData();
        return;
    }
    
    let filteredData = allData;
    
    if (currentCategory !== 'all' && movies[currentCategory]) {
        filteredData = allData.filter(item => item.id.startsWith(currentCategory + '_'));
    }
    
    filteredData = filteredData.filter(item => 
        item.title.toLowerCase().includes(keyword)
    );
    
    totalPage = Math.ceil(filteredData.length / pageSize);
    if (totalPage === 0) {
        totalPage = 1;
    }
    currentPage = 1;
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageData = filteredData.slice(startIndex, endIndex);
    
    renderDataList(pageData);
    updateStats(filteredData.length);
    renderPagination();
}

function loadData() {
    let filteredData = allData;
    
    if (currentCategory !== 'all' && movies[currentCategory]) {
        filteredData = allData.filter(item => item.id.startsWith(currentCategory + '_'));
    }
    
    totalPage = Math.ceil(filteredData.length / pageSize);
    if (currentPage > totalPage) {
        currentPage = totalPage || 1;
    }
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageData = filteredData.slice(startIndex, endIndex);
    
    renderDataList(pageData);
    updateStats(filteredData.length);
    renderPagination();
}

function renderDataList(data) {
    const dataList = document.getElementById('data-list');
    const selectAllCheckbox = document.getElementById('select-all');
    
    selectedItems.clear();
    selectAllCheckbox.checked = false;
    
    if (!data || data.length === 0) {
        dataList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <p>暂无数据</p>
            </div>
        `;
        return;
    }
    
    dataList.innerHTML = data.map(item => {
        return `
            <div class="data-item" data-link="${item.link}" onclick="handleItemClick(event, '${item.id}')">
                <div class="checkbox-cell">
                    <input type="checkbox" 
                           class="cyber-checkbox" 
                           data-id="${item.id}"
                           data-link="${item.link}"
                           onchange="toggleItem('${item.id}')">
                </div>
                <div class="title-cell">
                    <span class="item-title">${item.title}</span>
                </div>
                <div class="link-cell">
                    <span class="item-link">${item.link}</span>
                </div>
            </div>
        `;
    }).join('');
}

function renderPagination() {
    const paginationContainer = document.getElementById('pagination');
    
    if (totalPage <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '<div class="pagination-wrapper">';
    
    paginationHTML += `
        <button class="pagination-btn" 
                onclick="changePage(${currentPage - 1})" 
                ${currentPage === 1 ? 'disabled' : ''}>
            &lt;
        </button>
    `;
    
    for (let i = 1; i <= totalPage; i++) {
        if (i === 1 || i === totalPage || (i >= currentPage - 1 && i <= currentPage + 1)) {
            paginationHTML += `
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                        onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            paginationHTML += '<span class="pagination-ellipsis">...</span>';
        }
    }
    
    paginationHTML += `
        <button class="pagination-btn" 
                onclick="changePage(${currentPage + 1})" 
                ${currentPage === totalPage ? 'disabled' : ''}>
            &gt;
        </button>
    `;
    
    paginationHTML += '<div class="pagination-info">第 ' + currentPage + ' / ' + totalPage + ' 页</div>';
    paginationHTML += '</div>';
    
    paginationContainer.innerHTML = paginationHTML;
}

function toggleItem(itemId) {
    const checkbox = document.querySelector(`.cyber-checkbox[data-id="${itemId}"]`);
    
    if (checkbox.checked) {
        selectedItems.add(itemId);
    } else {
        selectedItems.delete(itemId);
    }
    
    updateStats();
    
    const selectAllCheckbox = document.getElementById('select-all');
    const allCheckboxes = document.querySelectorAll('.data-item .cyber-checkbox');
    const allChecked = Array.from(allCheckboxes).every(cb => cb.checked);
    
    selectAllCheckbox.checked = allChecked;
}

function changePage(page) {
    if (page < 1 || page > totalPage || page === currentPage) {
        return;
    }
    
    currentPage = page;
    loadData();
}

function handleItemClick(event) {
    if (event.target.classList.contains('cyber-checkbox')) {
        return;
    }
    
    const dataItem = event.currentTarget;
    const link = dataItem.dataset.link;
    copyToClipboard(link);
}

function updateStats(totalCount = 0) {
    const totalCountEl = document.getElementById('total-count');
    const selectedCountEl = document.getElementById('selected-count');
    
    let selectedCount = selectedItems.size;
    
    totalCountEl.textContent = totalCount;
    selectedCountEl.textContent = selectedCount;
}

function copySelected() {
    if (selectedItems.size === 0) {
        alert('请先选择要复制的数据');
        return;
    }
    
    const links = [];
    const checkboxes = document.querySelectorAll('.cyber-checkbox:checked');
    
    checkboxes.forEach(checkbox => {
        links.push(checkbox.dataset.link);
    });
    
    const text = links.join('\n');
    copyToClipboard(text);
}

function copyAll() {
    let currentData = allData;
    
    if (currentCategory !== 'all') {
        currentData = allData.filter(item => item.id.startsWith(currentCategory + '_'));
    }
    
    if (currentData.length === 0) {
        alert('暂无数据');
        return;
    }
    
    const links = currentData.map(item => item.link);
    const text = links.join('\n');
    copyToClipboard(text);
}

function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => {
                showNotification('复制成功！');
            })
            .catch(err => {
                console.error('复制失败:', err);
                fallbackCopyToClipboard(text);
            });
    } else {
        fallbackCopyToClipboard(text);
    }
}

function fallbackCopyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        showNotification('复制成功！');
    } catch (err) {
        console.error('复制失败:', err);
        alert('复制失败，请手动复制');
    }
    
    document.body.removeChild(textarea);
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 255, 255, 0.9);
        color: #000;
        padding: 15px 30px;
        border: 2px solid #00ffff;
        box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
        z-index: 9999;
        font-family: 'Courier New', monospace;
        font-size: 1rem;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}
