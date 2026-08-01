import {
  validateContent,
  heroes,
  pets,
  troops,
  buildings,
  buildingCostAtLevel,
  regions,
  campaign,
  tutorial,
  storeProducts,
  seasonPass,
  rallyConfig,
  seasonZero,
} from '../src/index';

describe('Season Zero content integrity', () => {
  it('passes full schema + cross-reference validation', () => {
    const result = validateContent();
    if (!result.ok) {
      // Surface the actual errors in the test output.
      throw new Error('Content validation failed:\n' + result.errors.join('\n'));
    }
    expect(result.ok).toBe(true);
  });

  it('ships exactly 12 launch heroes with 4 skills + ultimate + army skill', () => {
    expect(heroes).toHaveLength(12);
    for (const h of heroes) {
      expect(h.skills).toHaveLength(4);
      expect(h.ultimate.kind).toBe('ULTIMATE');
      expect(h.armySkill.kind).toBe('ARMY');
    }
  });

  it('covers all three troop affinities across the roster', () => {
    const aff = new Set(heroes.map((h) => h.troopAffinity));
    expect(aff.has('SAMURAI_GUARD')).toBe(true);
    expect(aff.has('YUMI_ARCHERS')).toBe(true);
    expect(aff.has('KOMAINU_RIDERS')).toBe(true);
  });

  it('ships 3 starter pets including at least one free-obtainable (spec §42)', () => {
    expect(pets).toHaveLength(3);
    expect(pets.some((p) => p.freeObtainable)).toBe(true);
  });

  it('defines 10 troop tiers per class across 3 classes', () => {
    expect(troops).toHaveLength(30);
    for (const cls of ['SAMURAI_GUARD', 'YUMI_ARCHERS', 'KOMAINU_RIDERS']) {
      const tiers = troops.filter((t) => t.troopClass === cls).map((t) => t.tier).sort((a, b) => a - b);
      expect(tiers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    }
  });

  it('troop stats increase monotonically with tier', () => {
    const samurai = troops.filter((t) => t.troopClass === 'SAMURAI_GUARD').sort((a, b) => a.tier - b.tier);
    for (let i = 1; i < samurai.length; i++) {
      expect(samurai[i].attack).toBeGreaterThan(samurai[i - 1].attack);
      expect(samurai[i].health).toBeGreaterThan(samurai[i - 1].health);
    }
  });

  it('includes the full launch building catalogue with ascension flags', () => {
    const keys = buildings.map((b) => b.key);
    for (const k of ['tenshu', 'research_hall', 'field_hospital', 'samurai_dojo', 'seasonal_district']) {
      expect(keys).toContain(k);
    }
    const ascension = buildings.filter((b) => b.requiredForAscension).map((b) => b.key);
    // Spec §10.1 ascension prerequisites.
    expect(ascension).toEqual(
      expect.arrayContaining(['tenshu', 'research_hall', 'field_hospital', 'samurai_dojo', 'seasonal_district']),
    );
  });

  it('building cost/time curves grow with level and are deterministic', () => {
    const tenshu = buildings.find((b) => b.key === 'tenshu')!;
    const l1 = buildingCostAtLevel(tenshu, 1);
    const l10 = buildingCostAtLevel(tenshu, 10);
    const l10b = buildingCostAtLevel(tenshu, 10);
    expect(l10.rice).toBeGreaterThan(l1.rice);
    expect(l10.seconds).toBeGreaterThan(l1.seconds);
    expect(l10).toEqual(l10b); // deterministic
  });

  it('production buildings scale production +10% per level', () => {
    const rice = buildings.find((b) => b.key === 'rice_terraces')!;
    expect(buildingCostAtLevel(rice, 1).production).toBe(100);
    expect(buildingCostAtLevel(rice, 11).production).toBe(200); // +10%/lvl * 10 levels
  });

  it('has 4 launch regions ordered and level-gated', () => {
    expect(regions).toHaveLength(4);
    const ordered = [...regions].sort((a, b) => a.order - b.order);
    for (let i = 1; i < ordered.length; i++) {
      expect(ordered[i].recommendedLevel).toBeGreaterThan(ordered[i - 1].recommendedLevel);
    }
  });

  it('campaign has 6 chapters x 3 stages, all referencing real regions', () => {
    expect(campaign).toHaveLength(18);
    const regionKeys = new Set(regions.map((r) => r.key));
    for (const c of campaign) {
      expect(regionKeys.has(c.regionKey)).toBe(true);
      expect(c.enemyPower).toBeGreaterThan(0);
    }
    // Finale repairs the seal (spec §71 finale).
    const finale = campaign.find((c) => c.key === 's0_c6_s3')!;
    expect(finale.narrative.toLowerCase()).toContain('seal');
  });

  it('tutorial is a contiguous ordered flow triggering real systems', () => {
    const orders = tutorial.map((t) => t.order);
    expect(orders).toEqual(Array.from({ length: tutorial.length }, (_, i) => i + 1));
    for (const step of tutorial) {
      expect(step.triggersSystem.length).toBeGreaterThan(0);
    }
  });

  it('store ships currency, hero, pet, progression, pass and cosmetic products', () => {
    const cats = new Set(storeProducts.map((s) => s.category));
    for (const c of ['CURRENCY', 'HERO', 'PET', 'PROGRESSION', 'PASS', 'COSMETIC']) {
      expect(cats.has(c as never)).toBe(true);
    }
  });

  it('season pass has 30 tiers with rising point requirements', () => {
    expect(seasonPass).toHaveLength(30);
    for (let i = 1; i < seasonPass.length; i++) {
      expect(seasonPass[i].requiredPoints).toBeGreaterThan(seasonPass[i - 1].requiredPoints);
    }
  });

  it('rally config respects the visible-representative caps (spec §59)', () => {
    expect(rallyConfig.maxParticipants).toBeGreaterThan(0);
    expect(rallyConfig.visibleRepresentatives.rally[1]).toBeLessThanOrEqual(70);
  });

  it('Season Zero has no industrial cap and a standard level cap of 30', () => {
    expect(seasonZero.industrialCap).toBe(0);
    expect(seasonZero.standardLevelCap).toBe(30);
  });
});
