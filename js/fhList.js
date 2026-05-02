$(document).ready(function() {
    // 获取URL中的fhId和dataFile参数
    const urlParams = new URLSearchParams(window.location.search);
    const fhId = urlParams.get('fhId');
    const dataFile = urlParams.get('dataFile');
    
    if (!fhId) {
        $('.main-content').html('<div class="empty-state">参数错误</div>');
        return;
    }
    
    let currentView = localStorage.getItem('currentView') || 'grid';
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
            html += '</div>';
            html += '<button class="copy-btn" id="copyBtn">📋 复制批次</button>';
            html += '</div>';
            
            // 复制弹窗
            html += `
            <div class="copy-modal-overlay" id="copyModalOverlay">
                <div class="copy-modal">
                    <div class="copy-modal-header">
                        <span class="copy-modal-title">选择批次</span>
                        <button class="copy-modal-close" id="copyModalClose">×</button>
                    </div>
                    <div class="copy-modal-body">
                        <div class="batch-size-section">
                            <span class="batch-size-label">批次大小：</span>
                            <div class="batch-size-options">
                                ${generateBatchSizeOptions()}
                            </div>
                        </div>
                        <div class="batch-list-container">
                            <div class="batch-list" id="batchList">
                                ${generateBatchList(fhDataList.length)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            `;
            
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
                                <img src="${item.poster}" alt="${item.title}" referrerpolicy="no-referrer" style="object-fit: contain;">
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
            initCopyButton();
            initMediaItemHandlers();
        }
    }
    
    function generateBatchSizeOptions() {
        const sizes = [20, 50, 100, 150, 200];
        let html = '';
        
        sizes.forEach(size => {
            const checked = size === 20 ? 'checked' : '';
            html += `
                <label class="batch-size-radio">
                    <input type="radio" name="batchSize" value="${size}" ${checked}>
                    <span>${size}</span>
                </label>
            `;
        });
        
        return html;
    }
    
    function generateBatchList(total, batchSize = 20) {
        const totalBatches = Math.ceil(total / batchSize);
        let html = '';
        
        for (let i = 1; i <= totalBatches; i++) {
            const start = (i - 1) * batchSize + 1;
            const end = Math.min(i * batchSize, total);
            html += `<div class="batch-item" data-start="${start}" data-end="${end}">${start}-${end}</div>`;
        }
        
        return html;
    }
    
    function initCopyButton() {
        $('#copyBtn').on('click', function() {
            $('#copyModalOverlay').css('display', 'flex');
        });
        
        $('#copyModalClose').on('click', function() {
            $('#copyModalOverlay').hide();
        });
        
        $('#copyModalOverlay').on('click', function(e) {
            if (e.target === this) {
                $(this).hide();
            }
        });
        
        // 批次大小变化时动态更新批次列表
        $('input[name="batchSize"]').on('change', function() {
            const batchSize = parseInt($(this).val());
            const total = window.fhDataList.length;
            $('#batchList').html(generateBatchList(total, batchSize));
            
            // 重新绑定点击事件
            $('.batch-item').off('click').on('click', handleBatchItemClick);
        });
        
        $('.batch-item').on('click', handleBatchItemClick);
        
        function handleBatchItemClick() {
            const $this = $(this);
            const start = $this.data('start');
            const end = $this.data('end');
            
            // 获取批次范围内的数据
            const batchData = window.fhDataList.slice(start - 1, end);
            
            // 提取链接
            const links = batchData.map(item => {
                if (item.links && item.links.length > 0) {
                    // 查找 isDefault 为 true 的链接
                    const defaultLink = item.links.find(link => link.isDefault === true);
                    if (defaultLink && defaultLink.link) {
                        return defaultLink.link;
                    }
                    // 如果没有 isDefault 为 true 的，取第一个
                    return item.links[0].link;
                }
                return '';
            }).filter(link => link);
            
            // 复制到剪贴板
            if (links.length > 0) {
                const textToCopy = links.join('\n');
                navigator.clipboard.writeText(textToCopy).then(() => {
                    $this.addClass('copied');
                    showToast(`批次 ${start}-${end} 已复制 (${links.length}条)`);
                    console.log(`复制批次: ${start}-${end}, 链接数: ${links.length}`);
                }).catch(err => {
                    console.error('复制失败:', err);
                    showToast('复制失败，请重试');
                });
            } else {
                showToast('该批次没有可用链接');
            }
        }
    }
    
    function showToast(message) {
        // 移除已存在的toast
        $('.toast-container').remove();
        
        // 创建新toast
        const toast = $(`
            <div class="toast-container">
                <div class="toast">${message}</div>
            </div>
        `);
        $('body').append(toast);
        
        // 显示toast
        setTimeout(() => {
            $('.toast').addClass('show');
        }, 10);
        
        // 3秒后隐藏并移除
        setTimeout(() => {
            $('.toast').removeClass('show');
            setTimeout(() => {
                $('.toast-container').remove();
            }, 300);
        }, 3000);
    }
    
    function initViewToggle() {
        $('.view-btn').on('click', function() {
            currentView = $(this).data('view');
            localStorage.setItem('currentView', currentView);
            loadFhContent();
        });
    }
    
    function initMediaItemHandlers() {
        $('.media-item').on('click', function() {
            const id = $(this).data('id');
            window.location.href = 'fhDetail.html?id=' + id + '&dataFile=' + encodeURIComponent(dataFile);
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
