// DTOs for the feature-flags module. Extend with class-validator decorated fields
// as concrete endpoints are hardened. Requests are validated globally via
// ValidationPipe (whitelist + transform).
export class CreateFeatureFlagsDto {}
export class UpdateFeatureFlagsDto {}
