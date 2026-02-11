$(document).ready(function() {
    // 获取URL参数
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const categoryId = urlParams.get('categoryId');
    const itemId = urlParams.get('id');
    
    if (!type || !categoryId || !itemId) {
        $('.main-content').html('<div class="empty-state">参数错误</div>');
        return;
    }
    
    let currentView = 'grid';
    let currentPage = 1;
    let pageSize = 20;
    
    // 获取当前分类信息
    const currentCat = categories.find(cat => cat.id === categoryId);
    if (!currentCat || currentCat.type !== 'indexed') {
        $('.main-content').html('<div class="empty-state">分类类型错误</div>');
        return;
    }
    
    renderSidebar();
    loadIndexData();
    
    function renderSidebar() {
        const sidebar = $('.sidebar-menu');
        sidebar.empty();
        
        // 显示返回主页按钮
        const backBtn = $(`
            <div class="menu-item back-btn">
                ← 返回主页
            </div>
        `);
        backBtn.on('click', function() {
            window.location.href = 'index.html';
        });
        sidebar.append(backBtn);
        
        // 显示当前分类名称
        const currentCatItem = $(`
            <div class="menu-item active current-category">
                ${currentCat.name}
            </div>
        `);
        sidebar.append(currentCatItem);
    }
    
    function loadIndexData() {
        let html = '';
        
        // 使用type参数构建索引数据文件名: actorFhIndexData.js, seriesFhIndexData.js
        const indexFileName = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() + 'FhIndexData';
        const indexPath = `data/index/${indexFileName}.js`;
        
        $.getScript(indexPath, function() {
            loadFhData();
        }).fail(function() {
            html = '<div class="empty-state">索引数据加载失败</div>';
            $('.main-content').html(html);
        });
    }
    
    function loadFhData() {
        // 获取索引数据变量名（使用type参数）
        const indexVarName = type.charAt(0).toLowerCase() + type.slice(1).toLowerCase() + 'FhIndexData';
        const indexData = window[indexVarName];
        
        if (!indexData) {
            $('.main-content').html('<div class="empty-state">索引数据不存在</div>');
            return;
        }
        
        // 根据itemId查找对应的fhId列表
        const indexItem = indexData.find(item => {
            if (type === 'actor') {
                return item.actorId == itemId;
            } else if (type === 'series') {
                return item.seriesId == itemId;
            }
            return false;
        });
        
        if (!indexItem || !indexItem.fhId || indexItem.fhId.length === 0) {
            $('.main-content').html('<div class="empty-state">暂无关联数据</div>');
            return;
        }
        
        // 从fhId中提取fh数据标识（如fh1-1 -> fh1）
        const fhIds = [...new Set(indexItem.fhId.map(fhId => {
            const match = fhId.match(/^(fh\d+)/);
            return match ? match[1] : null;
        }).filter(id => id !== null))];
        
        if (fhIds.length === 0) {
            $('.main-content').html('<div class="empty-state">暂无关联数据</div>');
            return;
        }
        
        // 动态加载所有FH数据文件
        let loadedCount = 0;
        let allFhData = [];
        
        // 清除旧的FH数据
        delete window.fhDataList;
        
        fhIds.forEach(fhId => {
            const fileName = fhId + 'Data';
            const dataPath = `data/fhDatas/${fileName}.js`;
            
            $.getScript(dataPath, function() {
                // 合并数据
                if (window.fhDataList) {
                    allFhData = allFhData.concat(window.fhDataList);
                    delete window.fhDataList;
                }
                
                loadedCount++;
                
                // 所有数据加载完成后渲染
                if (loadedCount === fhIds.length) {
                    renderContent(allFhData);
                }
            }).fail(function() {
                loadedCount++;
                if (loadedCount === fhIds.length) {
                    renderContent(allFhData);
                }
            });
        });
    }
    
    function renderContent(fhDataList) {
        let html = '';
        
        if (!fhDataList || fhDataList.length === 0) {
            html = '<div class="empty-state">暂无数据</div>';
            $('.main-content').html(html);
            return;
        }
        
        // 过滤数据，只显示索引中包含的fhId
        const indexVarName = type.charAt(0).toLowerCase() + type.slice(1).toLowerCase() + 'FhIndexData';
        const indexData = window[indexVarName];
        const indexItem = indexData.find(item => {
            if (type === 'actor') {
                return item.actorId == itemId;
            } else if (type === 'series') {
                return item.seriesId == itemId;
            }
            return false;
        });
        
        const validFhIds = indexItem.fhId;
        const filteredData = fhDataList.filter(item => validFhIds.includes(item.id));
        
        html += '<div class="view-options">';
        html += '<div class="view-toggle">';
        html += `<button class="view-btn ${currentView === 'grid' ? 'active' : ''}" data-view="grid">▦</button>`;
        html += `<button class="view-btn ${currentView === 'list' ? 'active' : ''}" data-view="list">☰</button>`;
        html += '</div></div>';
        
        const totalPages = Math.ceil(filteredData.length / pageSize);
        const start = (currentPage - 1) * pageSize;
        const end = Math.min(start + pageSize, filteredData.length);
        const pageData = filteredData.slice(start, end);
        
        html += `<div class="content-grid ${currentView}-view">`;
        pageData.forEach(item => {
            if (currentView === 'grid') {
                html += `
                    <div class="media-item" data-id="${item.id}">
                        <div class="media-poster">
                            <img src="${item.poster}" alt="${item.title}">
                        </div>
                        <div class="media-info">
                            <div class="media-title">${item.title}</div>
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div class="media-item list-view" data-id="${item.id}">
                        <div class="media-info">
                            <div class="media-title">${item.title}</div>
                            <div class="media-meta">
                                <span>${item.publishTime}</span>
                                <span class="divider">|</span>
                                <span>链接数: ${item.links.length}</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        });
        html += '</div>';
        
        html += renderPagination(totalPages);
        
        $('.main-content').html(html);
        initViewToggle();
        initMediaItemHandlers();
    }
    
    function initViewToggle() {
        $('.view-btn').on('click', function() {
            currentView = $(this).data('view');
            loadFhData();
        });
    }
    
    function initMediaItemHandlers() {
        $('.media-item').on('click', function() {
            const id = $(this).data('id');
            window.location.href = 'detail.html?id=' + id;
        });
    }
    
    function renderPagination(totalPages) {
        if (totalPages <= 1) return '';
        
        let html = '<div class="pagination">';
        
        html += `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="1">首页</button>`;
        html += `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">上一页</button>`;
        
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                html += '<span class="page-ellipsis">...</span>';
            }
        }
        
        html += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">下一页</button>`;
        html += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${totalPages}">末页</button>`;
        html += '</div>';
        
        return html;
    }
    
    $(document).on('click', '.page-btn:not(:disabled)', function() {
        currentPage = $(this).data('page');
        loadFhData();
        $(window).scrollTop(0);
    });
});
