// The test modes, in the order the mode bar shows them. Pure data, shared with the build.

export const TEST_MODES = [
  { id: 'time', label: 'time' },
  { id: 'words', label: 'words' },
  { id: 'quote', label: 'quote' },
  { id: 'custom', label: 'custom' },
  { id: 'code', label: 'code' },
] as const;

export type TestMode = (typeof TEST_MODES)[number]['id'];
