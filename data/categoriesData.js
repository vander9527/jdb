var categories = [
        {
            id: 'FH',
            name: 'FH',
            type:"base",
            dataFile:"categories/FHListData.json"
        },
        {
            id: 'ACTORS',
            name: 'ACTORS',
            type:"indexed",
            dataFile:"categories/ActorsListData.json",
            indexFile:"index/ActorFhIndexData.json"
        },
        {
            id: 'SERIES',
            name: 'SERIES',
            type:"indexed",
            dataFile:"categories/SeriesListData.json",
            indexFile:"index/SeriesFhIndexData.json"
        }
    ]