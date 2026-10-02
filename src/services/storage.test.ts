import { describe, expect, it } from 'vitest';
import { DEFAULT_PREFS, addExperiment, getPrefs, listExperiments, listSaved } from './storage';

// Vitest runs in Node (no IndexedDB), which exercises the graceful-degradation path.
describe('storage without IndexedDB', () => {
  it('returns empty data and defaults instead of throwing', async () => {
    await expect(addExperiment({ timestamp: 1, reactants: { H: 2, O: 1 }, conditions: null, success: true })).resolves.toBeUndefined();
    expect(await listExperiments()).toEqual([]);
    expect(await listSaved()).toEqual([]);
    expect(await getPrefs()).toEqual(DEFAULT_PREFS);
  });
});
