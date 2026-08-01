// DTOs for the player module. Extend with class-validator decorated fields
// as concrete endpoints are hardened. Requests are validated globally via
// ValidationPipe (whitelist + transform).
export class CreatePlayerDto {}
export class UpdatePlayerDto {}
