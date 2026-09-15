/**
 * Interface representing the authenticated user context.
 * Decouples foundational layers (infra, common guards/decorators) from the concrete User entity.
 */
export interface IAuthUser {
  id?: string;
  email?: string;
  roles?: string[];
  [key: string]: any;
}
