export const APARTMENTS = [
  { key: 'hope_202',     label: 'Ed. Hope 202',  apParam: 'Ed. Hope 202'  },
  { key: 'hope_203',     label: 'Ed. Hope 203',  apParam: 'Ed. Hope 203'  },
  { key: 'rio_arno_402', label: 'Rio Arno 402',  apParam: 'Rio Arno 402'  },
] as const;

export type ApKey = typeof APARTMENTS[number]['key'];
