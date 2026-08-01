import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { resolveCurrentPlayer } from '../common/player-context';

/**
 * Per-State coordinate map (Stage 1). The map is a MAP_SIZE x MAP_SIZE logical
 * grid. Only non-empty tiles (player castles, mines, monsters, structures) are
 * stored as MapCoordinate rows; everything else is implicitly EMPTY. Player
 * castles occupy a 2x2 footprint.
 */
export const MAP_SIZE = 1200;
export const CASTLE_FOOTPRINT = 2;
export const CENTER = MAP_SIZE / 2;

export type MapObjectType = 'PLAYER_CASTLE' | 'MINE' | 'MONSTER' | 'STRUCTURE' | 'EMPTY';

@Injectable()
export class MapService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveStateId(input: { stateId?: string; stateNumber?: number }) {
    if (input.stateId) {
      const s = await this.prisma.state.findUnique({ where: { id: input.stateId } });
      if (!s) throw new NotFoundException('State not found');
      return s.id;
    }
    const number = input.stateNumber ?? 1;
    const s = await this.prisma.state.findUnique({ where: { number } });
    if (!s) throw new NotFoundException(`State ${number} not found`);
    return s.id;
  }

  /**
   * Generate the environment (mines, monsters, structures) for a state in
   * concentric rings of increasing tier outward from the centre. Idempotent:
   * environment tiles are cleared and regenerated, but existing PLAYER_CASTLE
   * tiles are preserved. Admin-only (guarded at the controller).
   */
  async initState(input: { stateId?: string; stateNumber?: number }) {
    const stateId = await this.resolveStateId(input);

    // Clear only environment tiles; never remove players' castles.
    await this.prisma.mapCoordinate.deleteMany({
      where: { stateId, objectType: { in: ['MINE', 'MONSTER', 'STRUCTURE', 'EMPTY'] } },
    });

    const rows: {
      stateId: string;
      x: number;
      y: number;
      objectType: MapObjectType;
      tier: number;
      isOccupied: boolean;
      metadata: any;
    }[] = [];

    // A few central structures (the state capital cluster).
    const capital = [
      { dx: 0, dy: 0, name: 'State Capital' },
      { dx: 8, dy: 0, name: 'Royal Market' },
      { dx: -8, dy: 0, name: 'Grand Shrine' },
      { dx: 0, dy: 8, name: 'War Council' },
      { dx: 0, dy: -8, name: 'Trading Post' },
    ];
    for (const c of capital) {
      rows.push({
        stateId,
        x: CENTER + c.dx,
        y: CENTER + c.dy,
        objectType: 'STRUCTURE',
        tier: 5,
        isOccupied: true,
        metadata: { name: c.name },
      });
    }

    // Rings of mines and monsters. Tier increases with radius (harder/richer
    // the further from the safe centre).
    const rings = [120, 240, 360, 480, 570];
    const seen = new Set<string>(capital.map((c) => `${CENTER + c.dx},${CENTER + c.dy}`));
    rings.forEach((radius, ringIndex) => {
      const tier = ringIndex + 1;
      const count = 12 + ringIndex * 8; // more objects on outer rings
      for (let i = 0; i < count; i++) {
        const angle = (2 * Math.PI * i) / count;
        const x = Math.round(CENTER + radius * Math.cos(angle));
        const y = Math.round(CENTER + radius * Math.sin(angle));
        if (x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE) continue;
        const key = `${x},${y}`;
        if (seen.has(key)) continue;
        seen.add(key);
        // Alternate mines / monsters, sprinkle a structure occasionally.
        const kind: MapObjectType =
          i % 5 === 0 ? 'STRUCTURE' : i % 2 === 0 ? 'MINE' : 'MONSTER';
        rows.push({
          stateId,
          x,
          y,
          objectType: kind,
          tier,
          isOccupied: true,
          metadata:
            kind === 'MINE'
              ? { resource: ['RICE', 'WOOD', 'STONE', 'IRON'][ringIndex % 4], yield: 1000 * tier }
              : kind === 'MONSTER'
                ? { level: tier * 5, power: 5000 * tier }
                : { name: `Ruins T${tier}` },
        });
      }
    });

    await this.prisma.mapCoordinate.createMany({ data: rows, skipDuplicates: true });

    const counts = await this.prisma.mapCoordinate.groupBy({
      by: ['objectType'],
      where: { stateId },
      _count: { _all: true },
    });
    return {
      success: true,
      stateId,
      mapSize: MAP_SIZE,
      generated: rows.length,
      counts: counts.map((c) => ({ objectType: c.objectType, count: c._count._all })),
    };
  }

  /** Read a square window of tiles centred on (x,y) with the given range. */
  async tiles(stateId: string, x: number, y: number, range: number) {
    if (!stateId) throw new BadRequestException('stateId is required');
    const r = Math.min(Math.max(range || 25, 1), 100);
    const tiles = await this.prisma.mapCoordinate.findMany({
      where: {
        stateId,
        x: { gte: x - r, lte: x + r },
        y: { gte: y - r, lte: y + r },
      },
      orderBy: [{ y: 'asc' }, { x: 'asc' }],
    });
    return { stateId, center: { x, y }, range: r, mapSize: MAP_SIZE, tiles };
  }

  /** True when every tile in the wxh rectangle at (x,y) is free & in-bounds. */
  private async isAreaFree(
    stateId: string,
    x: number,
    y: number,
    w = CASTLE_FOOTPRINT,
    h = CASTLE_FOOTPRINT,
    ignorePlayerId?: string,
  ) {
    if (x < 0 || y < 0 || x + w > MAP_SIZE || y + h > MAP_SIZE) return false;
    const occupied = await this.prisma.mapCoordinate.findMany({
      where: {
        stateId,
        x: { gte: x, lte: x + w - 1 },
        y: { gte: y, lte: y + h - 1 },
        isOccupied: true,
        ...(ignorePlayerId ? { NOT: { playerId: ignorePlayerId } } : {}),
      },
      take: 1,
    });
    return occupied.length === 0;
  }

  /** Create the player's 2x2 castle at (x,y). Fails if they already have one. */
  async placeCastle(accountId: string, x: number, y: number) {
    const player = await resolveCurrentPlayer(this.prisma, accountId);
    if (!player.stateId) throw new BadRequestException('Player is not in a state');
    const stateId = player.stateId;

    const existing = await this.prisma.mapCoordinate.findFirst({
      where: { stateId, playerId: player.id, objectType: 'PLAYER_CASTLE' },
    });
    if (existing) {
      throw new ConflictException('Player already has a castle; use teleport to move it');
    }

    if (!(await this.isAreaFree(stateId, x, y))) {
      throw new BadRequestException('Target 2x2 area is occupied or out of bounds');
    }

    await this.writeCastle(stateId, player.id, x, y);
    return { success: true, castle: { stateId, x, y, footprint: CASTLE_FOOTPRINT } };
  }

  /** Move the player's castle to a new free 2x2 area. */
  async teleport(accountId: string, x: number, y: number) {
    const player = await resolveCurrentPlayer(this.prisma, accountId);
    if (!player.stateId) throw new BadRequestException('Player is not in a state');
    const stateId = player.stateId;

    // The player's own current castle tiles do not block the destination.
    if (!(await this.isAreaFree(stateId, x, y, CASTLE_FOOTPRINT, CASTLE_FOOTPRINT, player.id))) {
      throw new BadRequestException('Target 2x2 area is occupied or out of bounds');
    }

    await this.prisma.mapCoordinate.deleteMany({
      where: { stateId, playerId: player.id, objectType: 'PLAYER_CASTLE' },
    });
    await this.writeCastle(stateId, player.id, x, y);
    return { success: true, castle: { stateId, x, y, footprint: CASTLE_FOOTPRINT } };
  }

  /** Persist the 4 tiles of a 2x2 player castle. */
  private async writeCastle(stateId: string, playerId: string, x: number, y: number) {
    const data: {
      stateId: string;
      x: number;
      y: number;
      objectType: MapObjectType;
      objectId: string;
      playerId: string;
      isOccupied: boolean;
      tier: number;
      metadata: any;
    }[] = [];
    for (let dx = 0; dx < CASTLE_FOOTPRINT; dx++) {
      for (let dy = 0; dy < CASTLE_FOOTPRINT; dy++) {
        data.push({
          stateId,
          x: x + dx,
          y: y + dy,
          objectType: 'PLAYER_CASTLE' as MapObjectType,
          objectId: playerId,
          playerId,
          isOccupied: true,
          tier: 0,
          metadata: { anchor: dx === 0 && dy === 0, footprint: CASTLE_FOOTPRINT },
        });
      }
    }
    await this.prisma.mapCoordinate.createMany({ data, skipDuplicates: true });
  }
}
