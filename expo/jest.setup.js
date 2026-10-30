// RN 0.88: expo-asset, `react-native` içindeki özel AssetRegistry'yi okur; jest-expo yalnız `react-native/asset-registry`
// takma adını sahteler. Yazı tipi dosyaları sahte kimlikle kaydolduğu için burada da sahte bir kayıt veriyoruz.
jest.mock('react-native/src/private/assets/AssetRegistry', () => ({
  AssetRegistry: {
    registerAsset: jest.fn(() => 1),
    getAssetByID: jest.fn(() => ({
      fileSystemLocation: '/full/path/to/directory',
      httpServerLocation: '/assets/full/path/to/directory',
      scales: [1],
      fileHashes: ['md5'],
      name: 'name',
      exists: true,
      type: 'type',
      hash: 'md5',
      uri: 'uri',
      width: 1,
      height: 1,
    })),
  },
}));
