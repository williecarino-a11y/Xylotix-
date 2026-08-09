async function loadMarketplaceListings(searchQuery = '', categoryFilter = '') {
  if (typeof showLoadingState === 'function') showLoadingState(true);

  try {
    let url = '/api/marketplace/listings?';
    if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
    if (categoryFilter) url += `category=${encodeURIComponent(categoryFilter)}`;

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const result = await response.json();

    if (!result.success) throw new Error(result.message);

    if (result.data.length === 0) {
      if (typeof renderEmptyState === 'function') renderEmptyState("No marketplace listings found.");
      return;
    }

    if (typeof renderListingGrid === 'function') {
      renderListingGrid(result.data);
    }
  } catch (error) {
    if (typeof showErrorToast === 'function') showErrorToast("Failed to load marketplace listings.");
  } finally {
    if (typeof showLoadingState === 'function') showLoadingState(false);
  }
}
