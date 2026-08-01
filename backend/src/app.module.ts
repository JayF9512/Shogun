import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';

import { AuthModule } from './auth/auth.module';
import { PlayerModule } from './player/player.module';
import { SettlementModule } from './settlement/settlement.module';
import { EconomyModule } from './economy/economy.module';
import { ProgressionModule } from './progression/progression.module';
import { TroopsModule } from './troops/troops.module';
import { HeroesModule } from './heroes/heroes.module';
import { PetsModule } from './pets/pets.module';
import { MarchModule } from './march/march.module';
import { CombatModule } from './combat/combat.module';
import { ClanModule } from './clan/clan.module';
import { StoreModule } from './store/store.module';
import { PurchaseModule } from './purchase/purchase.module';
import { MailModule } from './mail/mail.module';
import { EventsModule } from './events/events.module';
import { SeasonModule } from './season/season.module';
import { AdminModule } from './admin/admin.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { ContentModule } from './content/content.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { StatesModule } from './states/states.module';
import { TutorialModule } from './tutorial/tutorial.module';
import { MapModule } from './map/map.module';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }),
    PrismaModule,
    AuthModule,
    PlayerModule,
    SettlementModule,
    EconomyModule,
    ProgressionModule,
    TroopsModule,
    HeroesModule,
    PetsModule,
    MarchModule,
    CombatModule,
    ClanModule,
    StoreModule,
    PurchaseModule,
    MailModule,
    EventsModule,
    SeasonModule,
    AdminModule,
    AnalyticsModule,
    FeatureFlagsModule,
    ContentModule,
    LeaderboardModule,
    StatesModule,
    TutorialModule,
    MapModule,
  ],
})
export class AppModule {}
