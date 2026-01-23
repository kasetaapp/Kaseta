// Pre-setup to mock expo/src/winter before jest-expo tries to load it
jest.mock('expo/src/winter', () => ({}), { virtual: true });
jest.mock('expo/src/winter/FormData', () => ({
  installFormDataPatch: jest.fn(),
}), { virtual: true });
jest.mock('expo/src/winter/installGlobal', () => ({
  installGlobal: jest.fn(),
}), { virtual: true });
jest.mock('expo/src/async-require/messageSocket', () => undefined, { virtual: true });
