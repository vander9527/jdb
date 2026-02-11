$(document).ready(function() {
    let currentCategory = 'FH';
    let currentView = 'grid';
    let currentPage = 1;
    let pageSize = 20;
    
    renderSidebar();
    loadCategoryContent();
    
    function renderSidebar() {
        const sidebar = $('.sidebar-menu');
        sidebar.empty();
        
        categories.forEach(cat => {
            const item = $(`
                <div class="menu-item ${cat.id === currentCategory ? 'active' : ''}" data-id="${cat.id}">
                    ${cat.name}
                </div>
            `);
            item.on('click', function() {
                $('.menu-item').removeClass('active');
                $(this).addClass('active');
                currentCategory = $(this).data('id');
                currentPage = 1;
                loadCategoryContent();
            });
            sidebar.append(item);
        });
    }
    
    function loadCategoryContent() {
        let html = '';
        
        // 动态加载对应的分类数据文件
        const fileName = currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1).toLowerCase() + 'ListData';
        const dataPath = `data/categories/${fileName}.js`;
        
        // 清除旧的分类数据
        delete window.categoriesList;
        
        $.getScript(dataPath, function() {
            renderContent();
        }).fail(function() {
            html = '<div class="empty-state">数据加载失败</div>';
            $('.main-content').html(html);
        });
        
        function renderContent() {
            html = '';
            
            if (!categoriesList || categoriesList.length === 0) {
                html = '<div class="empty-state">暂无数据</div>';
                $('.main-content').html(html);
                return;
            }
            
            html += '<div class="view-options">';
            html += '<div class="view-toggle">';
            html += `<button class="view-btn ${currentView === 'grid' ? 'active' : ''}" data-view="grid">▦</button>`;
            html += `<button class="view-btn ${currentView === 'list' ? 'active' : ''}" data-view="list">☰</button>`;
            html += '</div></div>';
            
            const totalPages = Math.ceil(categoriesList.length / pageSize);
            const start = (currentPage - 1) * pageSize;
            const end = Math.min(start + pageSize, categoriesList.length);
            const pageData = categoriesList.slice(start, end);
            
            html += `<div class="content-grid ${currentView}-view">`;
            pageData.forEach(item => {
                if (currentView === 'grid') {
                    html += `
                        <div class="media-item" data-id="${item.id}" data-type="${item.type || ''}">
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
                        <div class="media-item list-view" data-id="${item.id}" data-type="${item.type || ''}">
                            <div class="media-info">
                                <div class="media-title">${item.title}</div>
                                <div class="media-meta">
                                    <span>${item.year}</span>
                                    <span class="divider">|</span>
                                    <span>总数: ${item.total}</span>
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
    }
    
    function initViewToggle() {
        $('.view-btn').on('click', function() {
            currentView = $(this).data('view');
            loadCategoryContent();
        });
    }
    
    function initMediaItemHandlers() {
        $('.media-item').on('click', function() {
            const id = $(this).data('id');
            const type = $(this).data('type');
            const currentCat = categories.find(cat => cat.id === currentCategory);
            
            // 如果是FH分类(type=base)下的元素，跳转到FH列表页
            if (currentCat && currentCat.type === 'base') {
                window.location.href = 'fhList.html?fhId=' + id;
            } 
            // 如果是indexed类型分类，跳转到索引列表页，传递type参数
            else if (currentCat && currentCat.type === 'indexed') {
                window.location.href = 'indexList.html?type=' + type + '&categoryId=' + currentCategory + '&id=' + id;
            } 
            // 其他情况跳转到详情页
            else {
                window.location.href = 'detail.html?id=' + id;
            }
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
        loadCategoryContent();
        $(window).scrollTop(0);
    });
});
