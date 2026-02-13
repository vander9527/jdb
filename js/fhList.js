$(document).ready(function() {
    // 获取URL中的fhId和dataFile参数
    const urlParams = new URLSearchParams(window.location.search);
    const fhId = urlParams.get('fhId');
    const dataFile = urlParams.get('dataFile');
    
    if (!fhId) {
        $('.main-content').html('<div class="empty-state">参数错误</div>');
        return;
    }
    
    let currentView = 'grid';
    let currentPage = 1;
    let pageSize = 20;
    
    renderSidebar();
    loadFhContent();
    
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
        
        // 显示当前FH名称
        const currentFh = $(`
            <div class="menu-item active current-fh">
                ${fhId}
            </div>
        `);
        sidebar.append(currentFh);
    }
    
    function loadFhContent() {
        let html = '';
        
        // 从URL参数获取数据文件路径
        const dataPath = `data/${dataFile}`;
        
        $.getJSON(dataPath, function(data) {
            window.fhDataList = data;
            renderContent();
        }).fail(function() {
            html = '<div class="empty-state">数据加载失败</div>';
            $('.main-content').html(html);
        });
        
        function renderContent() {
            html = '';
            
            if (!fhDataList || fhDataList.length === 0) {
                html = '<div class="empty-state">暂无数据</div>';
                $('.main-content').html(html);
                return;
            }
            
            html += '<div class="view-options">';
            html += '<div class="view-toggle">';
            html += `<button class="view-btn ${currentView === 'grid' ? 'active' : ''}" data-view="grid">▦</button>`;
            html += `<button class="view-btn ${currentView === 'list' ? 'active' : ''}" data-view="list">☰</button>`;
            html += '</div></div>';
            
            const totalPages = Math.ceil(fhDataList.length / pageSize);
            const start = (currentPage - 1) * pageSize;
            const end = Math.min(start + pageSize, fhDataList.length);
            const pageData = fhDataList.slice(start, end);
            
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
    }
    
    function initViewToggle() {
        $('.view-btn').on('click', function() {
            currentView = $(this).data('view');
            loadFhContent();
        });
    }
    
    function initMediaItemHandlers() {
        $('.media-item').on('click', function() {
            const id = $(this).data('id');
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
        loadFhContent();
        $(window).scrollTop(0);
    });
});
