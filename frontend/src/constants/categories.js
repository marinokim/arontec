export const CATEGORY_ORDER = [
    'Audio',
    'Premium Audio',
    'Mobile',
    'Beauty',
    'Food',
    'Living',
    'GIFT SET',
    'Travel',
    'Kitchen',
    'Other'
];

export const CATEGORY_COLORS = {
    'Audio': '#007bff',          // Blue
    'Premium Audio': '#6610f2',  // Indigo
    'Mobile': '#fd7e14',         // Orange
    'Beauty': '#e83e8c',         // Pink
    'Food': '#dc3545',           // Red
    'Living': '#28a745',         // Green
    'GIFT SET': '#20c997',       // Teal
    'Travel': '#17a2b8',         // Cyan
    'Kitchen': '#ffc107',        // Yellow
    'Other': '#6c757d'           // Gray
};

export const getCategoryColor = (categoryName) => {
    return CATEGORY_COLORS[categoryName] || '#6c757d'; // Default to Gray
};

export const sortCategories = (categories) => {
    return [...categories].sort((a, b) => {
        const indexA = CATEGORY_ORDER.indexOf(a.name);
        const indexB = CATEGORY_ORDER.indexOf(b.name);

        // If both are in the list, sort by index
        if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
        }

        // If only A is in the list, it comes first
        if (indexA !== -1) return -1;

        // If only B is in the list, it comes first
        if (indexB !== -1) return 1;

        // If neither is in the list, sort alphabetically
        // But keep "Other" at the end if it wasn't in the list (though it is)
        if (a.name === 'Other') return 1;
        if (b.name === 'Other') return -1;

        return a.name.localeCompare(b.name);
    });
};
