import { Controller, Get } from '@nestjs/common';

/**
 * Root/health controller. Registered outside the global `/api` prefix so that
 * the service base URL responds with a lightweight liveness payload instead of
 * a 404. Used by uptime checks and the deployment ingress health probe.
 */
@Controller()
export class HealthController {
  private readonly startedAt = new Date();

  @Get()
  root() {
    return {
      service: 'Shadows of the Shogun — backend API',
      status: 'ok',
      api: '/api',
      docs: '/api/content',
    };
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      uptimeSeconds: Math.floor((Date.now() - this.startedAt.getTime()) / 1000),
      timestamp: new Date().toISOString(),
    };
  }
}
