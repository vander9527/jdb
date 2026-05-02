$(document).ready(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    let categoryId = urlParams.get('categoryId');
    let itemId = urlParams.get('id');
    itemId = Number(itemId);

    let currentView = localStorage.getItem('currentView') || 'grid';
    let currentPage = 1;
    let pageSize = 30;

    if (!type || !categoryId || !itemId) {
        $('.container').html('<div class="empty-state">参数错误</div>');
        return;
    }

    loadDetail();

    function loadDetail() {
        const currentCat = categories.find(cat => cat.id === categoryId);
        if (!currentCat || currentCat.type !== 'indexed') {
            $('.container').html('<div class="empty-state">分类类型错误</div>');
            return;
        }

        const indexFile = currentCat.indexFile;
        const dataFile = currentCat.dataFile;

        $.getJSON(`data/${dataFile}`, function(catData) {
            const itemDetail = catData.find(item => item.id === itemId);

            if (!itemDetail) {
                $('.container').html('<div class="empty-state">未找到数据</div>');
                return;
            }

            $.getJSON(`data/${indexFile}`, function(indexData) {
                const fhList = indexData[itemDetail.transTitle] || [];

                if (fhList.length === 0) {
                    renderDetail(itemDetail, []);
                    return;
                }

                const filePrefixes = [...new Set(fhList.map(fhId => {
                    const parts = fhId.split('-');
                    return parts[0].toUpperCase();
                }))];

                let loadedCount = 0;
                let allFhData = [];

                filePrefixes.forEach(prefix => {
                    const fhDataPath = `data/fhDatas/${prefix}.json`;
                    $.getJSON(fhDataPath, function(data) {
                        allFhData = allFhData.concat(data);
                        loadedCount++;
                        if (loadedCount === filePrefixes.length) {
                            const filteredData = allFhData.filter(item => fhList.includes(item.id));
                            renderDetail(itemDetail, filteredData);
                        }
                    }).fail(function() {
                        loadedCount++;
                        if (loadedCount === filePrefixes.length) {
                            const filteredData = allFhData.filter(item => fhList.includes(item.id));
                            renderDetail(itemDetail, filteredData);
                        }
                    });
                });
            }).fail(function() {
                renderDetail(itemDetail, []);
            });
        }).fail(function() {
            $('.container').html('<div class="empty-state">数据加载失败</div>');
        });
    }

    function renderDetail(itemDetail, fhDataList) {
        let html = '';

        html += '<div class="header">';
        html += `<a href="index.html" class="back-link">&larr; 返回首页</a>`;
        html += '</div>';

        html += '<div class="detail-layout">';

        html += '<div class="detail-row">';

        html += '<div class="detail-section poster-section">';
        html += '<div class="poster-wrapper">';
        html += `<img src="${itemDetail.poster}" alt="${itemDetail.title}" referrerpolicy="no-referrer" style="object-fit: contain;"> `;
        html += '</div>';
        html += '<div class="poster-info">';
        html += `<div class="detail-title">${itemDetail.title}</div>`;
        html += '<div class="detail-meta">';
        html += `<div class="meta-row"><span class="meta-label">别名</span><span class="meta-value">${itemDetail.transTitle || '-'}</span></div>`;
        html += `<div class="meta-row"><span class="meta-label">描述</span><span class="meta-value">${itemDetail.description || '-'}</span></div>`;
        html += '</div>';
        html += '</div>';
        html += '</div>';

        if (type === 'actor') {
            html += '<div class="detail-section info-section">';
            html += '<div class="info-block">';
            html += '<h4>相关作品</h4>';
            html += `<div class="empty-info">共 ${fhDataList.length} 部作品</div>`;
            html += '</div>';
            html += '</div>';
        } else if (type === 'series') {
            html += '<div class="detail-section info-section">';
            html += '<div class="info-block">';
            html += '<h4>系列作品</h4>';
            html += `<div class="empty-info">共 ${fhDataList.length} 部作品</div>`;
            html += '</div>';
            html += '</div>';
        }

        html += '</div>';

        html += '<div class="detail-section resource-section full-width">';
        html += '<h3>作品列表</h3>';

        if (fhDataList.length === 0) {
            html += '<div class="empty-state">暂无关联作品</div>';
        } else {
            const totalPages = Math.ceil(fhDataList.length / pageSize);
            const start = (currentPage - 1) * pageSize;
            const end = Math.min(start + pageSize, fhDataList.length);
            const pageData = fhDataList.slice(start, end);

            if (currentView === 'grid') {
                html += `<div class="indexed-grid">`;
                pageData.forEach(item => {
                    const prefix = item.id.split('-')[0].toUpperCase();
                    html += `
                        <div class="indexed-card" data-id="${item.id}" data-prefix="${prefix}">
                            <div class="indexed-poster">
                                <img src="${item.poster}" alt="${item.title}">
                            </div>
                            <div class="indexed-card-title">${item.title}</div>
                        </div>
                    `;
                });
                html += '</div>';
            } else {
                html += `<div class="indexed-list">`;
                pageData.forEach(item => {
                    const prefix = item.id.split('-')[0].toUpperCase();
                    html += `
                        <div class="indexed-item" data-id="${item.id}" data-prefix="${prefix}">
                            <div class="indexed-title">${item.title}</div>
                        </div>
                    `;
                });
                html += '</div>';
            }
        }

        if (fhDataList.length > pageSize) {
            html += renderPagination(Math.ceil(fhDataList.length / pageSize));
        }

        html += '</div>';

        html += '</div>';

        $('.container').html(html);
        initMediaItemHandlers();
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

    function initMediaItemHandlers() {
        $('.indexed-card, .indexed-item').on('click', function() {
            const id = $(this).data('id');
            const prefix = $(this).data('prefix');
            const dataFile = `fhDatas/${prefix}.json`;
            window.location.href = 'fhDetail.html?id=' + id + '&dataFile=' + encodeURIComponent(dataFile);
        });
    }

    $(document).on('click', '.page-btn:not(:disabled)', function() {
        currentPage = $(this).data('page');
        loadDetail();
        $(window).scrollTop(0);
    });
});