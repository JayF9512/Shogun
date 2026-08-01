import { RallyConfig } from '../types';

/**
 * Rally system configuration (spec §57, §59). Visible-representative bands cap
 * how many models render for a march regardless of true troop count.
 */
export const rallyConfig: RallyConfig = {
  maxParticipants: 20,
  minLeaderLevel: 16, // rallies unlock at Levels 16-20 (spec §9)
  countdownSeconds: 300,
  autoKickIdleSeconds: 600,
  formations: ['BALANCED', 'VANGUARD', 'SKIRMISH', 'SIEGE'],
  visibleRepresentatives: {
    verySmall: [6, 10],
    small: [12, 18],
    medium: [20, 30],
    large: [32, 45],
    rally: [45, 70],
  },
};
