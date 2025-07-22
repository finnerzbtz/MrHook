// Product Categories - for frontend display only
const categories = {
  'fishing-rods': 'Fishing Rods',
  'hooks': 'Hooks',
  'bait': 'Bait',
  'containers': 'Containers',
  'other': 'Other'
};

// Export categories for use in frontend
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { categories };
} 