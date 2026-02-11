$(document).ready(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const mediaId = urlParams.get('id');
    let currentLinkPage = 1;
    let linkPageSize = 10;
    
    if (!mediaId) {
        $('.container').html('<div class="empty-state">未找到资源</div>');
        return;
    }
    
    loadFhDetail(mediaId);
    
    function loadFhDetail(id) {
        // 提取fhId（如 fh1-1 -> fh1）
        const match = id.match(/^(fh\d+)/);
        if (!match) {
            $('.container').html('<div class="empty-state">参数错误</div>');
            return;
        }
        
        const fhId = match[1];
        const fileName = fhId + 'Data';
        const dataPath = `data/fhDatas/${fileName}.js`;
        
        $.getScript(dataPath, function() {
            renderFhDetail(id);
        }).fail(function() {
            $('.container').html('<div class="empty-state">数据加载失败</div>');
        });
    }
    
    function renderFhDetail(id) {
        const fhData = window.fhDataList.find(item => item.id === id);
        
        if (!fhData) {
            $('.container').html('<div class="empty-state">未找到资源</div>');
            return;
        }
        
        // 加载系列和演员数据
        loadRelatedData(fhData);
    }
    
    function loadRelatedData(fhData) {
        let html = '';
        
        // 加载系列列表
        $.getScript('data/categories/SeriesListData.js', function() {
            const seriesList = window.categoriesList || [];
            
            // 加载演员列表
            $.getScript('data/categories/ActorsListData.js', function() {
                const actorsList = window.categoriesList || [];
                
                // 获取所属系列名称
                const seriesNames = (fhData.belongSeriesId || []).map(seriesId => {
                    const series = seriesList.find(s => s.id === seriesId);
                    return series ? series.title : '';
                }).filter(name => name !== '');
                
                // 获取演员名称
                const actorNames = (fhData.actorsId || []).map(actorId => {
                    const actor = actorsList.find(a => a.id === actorId);
                    return actor ? actor.title : '';
                }).filter(name => name !== '');
                
                renderDetail(fhData, seriesNames, actorNames);
            });
        });
    }
    
    function renderDetail(fhData, seriesNames, actorNames) {
        let html = '';
        
        html += '<div class="header">';
        html += `<a href="index.html" class="back-link">&larr; 返回首页</a>`;
        html += '</div>';
        
        html += '<div class="detail-layout">';
        
        // 上方：左侧海报信息 + 右侧系列/演员信息
        html += '<div class="detail-row">';
        
        // 左侧：海报和基本信息
        html += '<div class="detail-section poster-section">';
        html += '<div class="poster-wrapper">';
        html += `<img src="${fhData.poster}" alt="${fhData.title}">`;
        html += '</div>';
        html += '<div class="poster-info">';
        html += `<div class="detail-title">${fhData.title}</div>`;
        html += '<div class="detail-meta">';
        html += `<div class="meta-row"><span class="meta-label">发布时间</span><span class="meta-value">${fhData.publishTime}</span></div>`;
        html += `<div class="meta-row"><span class="meta-label">描述</span><span class="meta-value">${fhData.description}</span></div>`;
        html += '</div>';
        html += '</div>';
        html += '</div>';
        
        // 右侧：系列和演员
        html += '<div class="detail-section info-section">';
        
        // 系列信息
        html += '<div class="info-block">';
        html += '<h4>所属系列</h4>';
        if (seriesNames.length > 0) {
            seriesNames.forEach(name => {
                html += `<div class="info-tag">${name}</div>`;
            });
        } else {
            html += '<div class="empty-info">暂无系列信息</div>';
        }
        html += '</div>';
        
        // 演员信息
        html += '<div class="info-block">';
        html += '<h4>演员列表</h4>';
        if (actorNames.length > 0) {
            actorNames.forEach(name => {
                html += `<div class="info-tag">${name}</div>`;
            });
        } else {
            html += '<div class="empty-info">暂无演员信息</div>';
        }
        html += '</div>';
        
        html += '</div>';
        
        html += '</div>';
        
        // 下方：链接列表（宽度与上方总宽度一致）
        html += '<div class="detail-section resource-section full-width">';
        html += '<h3>下载资源</h3>';
        html += '<div class="resource-list">';
        
        const links = fhData.links || [];
        const totalLinkPages = Math.ceil(links.length / linkPageSize);
        const start = (currentLinkPage - 1) * linkPageSize;
        const end = Math.min(start + linkPageSize, links.length);
        const pageLinks = links.slice(start, end);
        
        if (links.length === 0) {
            html += '<div class="empty-state">暂无资源</div>';
        } else {
            pageLinks.forEach((linkItem, index) => {
                html += `
                    <div class="resource-item">
                        <div class="resource-title">${linkItem.title}</div>
                        <div class="resource-link">${linkItem.link}</div>
                        <div class="resource-size">${linkItem.size}</div>
                        <button class="resource-copy" data-link="${linkItem.link}">复制</button>
                    </div>
                `;
            });
        }
        
        html += '</div>';
        
        if (totalLinkPages > 1) {
            html += renderLinkPagination(totalLinkPages);
        }
        html += '</div>';
        
        html += '</div>';
        
        $('.container').html(html);
        initCopyHandlers();
    }
    
    function renderLinkPagination(totalPages) {
        let html = '<div class="pagination">';
        
        html += `<button class="page-btn" ${currentLinkPage === 1 ? 'disabled' : ''} data-lpage="1">首页</button>`;
        html += `<button class="page-btn" ${currentLinkPage === 1 ? 'disabled' : ''} data-lpage="${currentLinkPage - 1}">上一页</button>`;
        
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentLinkPage - 1 && i <= currentLinkPage + 1)) {
                html += `<button class="page-btn ${i === currentLinkPage ? 'active' : ''}" data-lpage="${i}">${i}</button>`;
            } else if (i === currentLinkPage - 2 || i === currentLinkPage + 2) {
                html += '<span class="page-ellipsis">...</span>';
            }
        }
        
        html += `<button class="page-btn" ${currentLinkPage === totalPages ? 'disabled' : ''} data-lpage="${currentLinkPage + 1}">下一页</button>`;
        html += `<button class="page-btn" ${currentLinkPage === totalPages ? 'disabled' : ''} data-lpage="${totalPages}">末页</button>`;
        html += '</div>';
        
        return html;
    }
    
    function initCopyHandlers() {
        $('.resource-copy').on('click', function() {
            const link = $(this).data('link');
            copyToClipboard(link);
        });
    }
    
    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function() {
                showNotification('复制成功！');
            }).catch(function() {
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
        }
    }
    
    function fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            document.execCommand('copy');
            showNotification('复制成功！');
        } catch (err) {
            showNotification('复制失败，请手动复制');
        }
        
        document.body.removeChild(textarea);
    }
    
    function showNotification(message) {
        const notification = $(`
            <div class="notification">${message}</div>
        `);
        
        $('body').append(notification);
        
        setTimeout(function() {
            notification.fadeOut(300, function() {
                notification.remove();
            });
        }, 2000);
    }
    
    $(document).on('click', '.page-btn:not(:disabled)', function() {
        if ($(this).data('lpage')) {
            currentLinkPage = $(this).data('lpage');
            const urlParams = new URLSearchParams(window.location.search);
            urlParams.set('lpage', currentLinkPage);
            window.location.href = 'detail.html?' + urlParams.toString();
        }
    });
});
