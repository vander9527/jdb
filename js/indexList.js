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

        // 优先从localStorage获取索引数据
        const cachedIndex = localStorage.getItem(`${categoryId}_index`);
        const cachedData = localStorage.getItem(`${categoryId}_data`);

        if (cachedIndex && cachedData) {
            window.indexData = JSON.parse(cachedIndex);
            // 恢复全局变量
            if (categoryId === 'ACTORS') {
                window.actorsList = JSON.parse(cachedData);
            } else if (categoryId === 'SERIES') {
                window.seriesList = JSON.parse(cachedData);
            }
            loadFhData();
            return;
        }

        // localStorage中没有数据，提示返回主页
        html = `
            <div class="empty-state">
                未获取到数据
                <br>
                <a href="index.html" class="back-link">← 返回主页</a>
            </div>
        `;
        $('.main-content').html(html);
    }
    
    function loadFhData() {
        const indexData = window.indexData;

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

        // 从fhId（格式为"文件名-编号"，如"ADN-1"）中提取文件名部分
        const fileNames = [...new Set(indexItem.fhId.map(fhId => {
            const parts = fhId.split('-');
            return parts.length > 1 ? parts[0] : fhId;
        }))];

        if (fileNames.length === 0) {
            $('.main-content').html('<div class="empty-state">暂无关联数据</div>');
            return;
        }

        // 动态加载所有FH数据文件（从fhDatas目录加载对应的JSON文件）
        let loadedCount = 0;
        let allFhData = [];

            fileNames.forEach(fileName => {
                const dataPath = `data/fhDatas/${fileName}.json`;

                $.getJSON(dataPath, function(data) {
                    // 合并数据
                    allFhData = allFhData.concat(data);

                    loadedCount++;

                    // 所有数据加载完成后渲染
                    if (loadedCount === fileNames.length) {
                        // 保存文件名列表到全局变量
                        window.indexedFileNames = fileNames;
                        renderContent(allFhData, fileNames);
                    }
                }).fail(function() {
                    loadedCount++;
                    if (loadedCount === fileNames.length) {
                        window.indexedFileNames = fileNames;
                        renderContent(allFhData, fileNames);
                    }
                });
            });
    }
    
    function renderContent(fhDataList, fileNames) {
        let html = '';

        if (!fhDataList || fhDataList.length === 0) {
            html = '<div class="empty-state">暂无数据</div>';
            $('.main-content').html(html);
            return;
        }

        // 过滤数据，只显示索引中包含的fhId
        const indexData = window.indexData;
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
            // 从全局变量获取文件名列表
            const fileNames = window.indexedFileNames || [];
            // 根据id的前缀（如"ADN-1"中的"ADN"）找到对应的文件名
            const prefixMatch = id.match(/^([^-]+)-/);
            const fileName = prefixMatch ? prefixMatch[1] : id.split('-')[0];
            const dataFile = `fhDatas/${fileName}.json`;
            window.location.href = 'detail.html?id=' + id + '&dataFile=' + encodeURIComponent(dataFile);
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
