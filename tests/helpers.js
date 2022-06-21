export const expectMoreFromArtistContent = (wrapper) => {
  const topTracksLabel = wrapper.find('.top-tracks');
  const topAlbumsLabel = wrapper.find('.top-albums');
  const relatedArtistsLabel = wrapper.find('.related-artists');

  expect(topTracksLabel.text()).toBe('Top Tracks');
  expect(topAlbumsLabel.text()).toBe('Top Albums');
  expect(relatedArtistsLabel.text()).toBe('Related Artists');
};