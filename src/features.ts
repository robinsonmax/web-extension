export interface Feature {
  id: string;
  title: string;
  description: string;
  matches: string[];
  migrateMatchesFrom?: string[][];
}

export interface FeatureSetting {
  enabled: boolean;
  matches: string[];
}

export type FeatureSettings = Record<string, FeatureSetting>;

// Add one entry per tweak. Its files are injected into matching pages when enabled.
// Match patterns use Chrome's format, for example: https://*.example.com/*
export const FEATURES: Feature[] = [
  {
    id: "matalan",
    title: "Matalan Search",
    description: "Hide's the matalan searchbar",
    matches: ["https://*.matalan.co.uk/*"],
    migrateMatchesFrom: [["https://matalan.co.uk/*"]],
  },
];

export const DEFAULT_SETTINGS: FeatureSettings = Object.fromEntries(
  FEATURES.map((feature) => [
    feature.id,
    { enabled: false, matches: feature.matches },
  ]),
);

export function mergeSettings(stored: unknown): FeatureSettings {
  const saved = stored as Partial<FeatureSettings> | undefined;
  return Object.fromEntries(
    FEATURES.map((feature) => {
      const setting = saved?.[feature.id];
      const oldMatchSet = feature.migrateMatchesFrom?.some(
        (oldMatches) =>
          setting?.matches.length === oldMatches.length &&
          oldMatches.every(
            (pattern, index) => setting.matches[index] === pattern,
          ),
      );
      return [
        feature.id,
        {
          ...DEFAULT_SETTINGS[feature.id],
          ...setting,
          matches: oldMatchSet
            ? feature.matches
            : (setting?.matches ?? feature.matches),
        },
      ];
    }),
  );
}
