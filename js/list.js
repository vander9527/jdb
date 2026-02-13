$(document).ready(function() {
    let currentCategory = 'FH';
    let currentView = 'grid';
    let currentPage = 1;
    let pageSize = 20;

    renderSidebar();

    // 预加载 ACTORS 和 SERIES 数据到缓存
    preloadIndexedData();

    loadCategoryContent();

    function preloadIndexedData() {
        // 遍历所有分类，缓存所有 type=indexed 的数据
        categories.forEach(cat => {
            if (cat.type === 'indexed' && cat.dataFile && cat.indexFile) {
                const cachedData = localStorage.getItem(`${cat.id}_data`);
                const cachedIndex = localStorage.getItem(`${cat.id}_index`);

                if (cachedData && cachedIndex) {
                    // 从缓存恢复
                    const data = JSON.parse(cachedData);
                    if (cat.id === 'ACTORS') {
                        window.actorsList = data;
                    } else if (cat.id === 'SERIES') {
                        window.seriesList = data;
                    }
                } else {
                    // 加载并缓存数据文件
                    $.getJSON(`data/${cat.dataFile}`, function(data) {
                        if (cat.id === 'ACTORS') {
                            window.actorsList = data;
                        } else if (cat.id === 'SERIES') {
                            window.seriesList = data;
                        }
                        localStorage.setItem(`${cat.id}_data`, JSON.stringify(data));
                    });

                    // 加载并缓存索引文件
                    $.getJSON(`data/${cat.indexFile}`, function(indexData) {
                        localStorage.setItem(`${cat.id}_index`, JSON.stringify(indexData));
                    });
                }
            }
        });
    }
    
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

        // 从categoriesData.js获取当前分类的数据文件路径
        const currentCat = categories.find(cat => cat.id === currentCategory);

        // 对于indexed类型，优先从localStorage获取
        if (currentCat.type === 'indexed') {
            const cachedData = localStorage.getItem(`${currentCategory}_data`);
            const cachedIndex = localStorage.getItem(`${currentCategory}_index`);

            if (cachedData && cachedIndex) {
                window.categoriesList = JSON.parse(cachedData);
                window.indexData = JSON.parse(cachedIndex);

                // 保存到全局变量
                if (currentCategory === 'ACTORS') {
                    window.actorsList = window.categoriesList;
                } else if (currentCategory === 'SERIES') {
                    window.seriesList = window.categoriesList;
                }

                renderContent();
                return;
            }

            // 缓存不存在，加载并缓存数据
            loadDataAndCache(currentCat);
        } else {
            // base类型，直接加载
            const dataPath = `data/${currentCat.dataFile}`;
            $.getJSON(dataPath, function(data) {
                window.categoriesList = data;

                // 根据分类类型，将数据保存为对应的全局变量
                if (currentCategory === 'ACTORS') {
                    window.actorsList = data;
                } else if (currentCategory === 'SERIES') {
                    window.seriesList = data;
                } else if (currentCategory === 'FH') {
                    window.fhList = data;
                }

                renderContent();
            }).fail(function() {
                html = '<div class="empty-state">数据加载失败</div>';
                $('.main-content').html(html);
            });
        }
    }

    function loadDataAndCache(currentCat) {
        let html = '';
        let loadedCount = 0;
        let needLoad = 2; // data 和 index 两个文件

        function checkLoaded() {
            if (loadedCount >= needLoad) {
                renderContent();
            }
        }

        // 加载数据文件
        $.getJSON(`data/${currentCat.dataFile}`, function(data) {
            window.categoriesList = data;

            // 保存到全局变量
            if (currentCat.id === 'ACTORS') {
                window.actorsList = data;
            } else if (currentCat.id === 'SERIES') {
                window.seriesList = data;
            }

            // 缓存到localStorage
            localStorage.setItem(`${currentCat.id}_data`, JSON.stringify(data));

            loadedCount++;
            checkLoaded();
        }).fail(function() {
            html = '<div class="empty-state">数据加载失败</div>';
            $('.main-content').html(html);
        });

        // 加载索引文件
        $.getJSON(`data/${currentCat.indexFile}`, function(indexData) {
            window.indexData = indexData;

            // 缓存到localStorage
            localStorage.setItem(`${currentCat.id}_index`, JSON.stringify(indexData));

            loadedCount++;
            checkLoaded();
        }).fail(function() {
            html = '<div class="empty-state">索引数据加载失败</div>';
            $('.main-content').html(html);
        });
    }

    function renderContent() {
        let html = '';

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
            
            // 如果是FH分类(type=base)下的元素，跳转到FH列表页，传递dataFile参数
            if (currentCat && currentCat.type === 'base') {
                // 从categoriesList中查找对应项获取dataFile
                const item = categoriesList.find(item => item.id === id);
                const dataFile = item ? item.dataFile : '';
                window.location.href = 'fhList.html?fhId=' + id + '&dataFile=' + encodeURIComponent(dataFile);
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
