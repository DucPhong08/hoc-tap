import { EntityManager } from '@mikro-orm/core';
import * as bcrypt from 'bcrypt';
import { User } from '@/modules/users/entities/user.entity';
import { Role } from '@/common/constants/role.constant';
import { AuthProvider } from '@/modules/auth/enums/auth-provider.enum';

/**
 * Seed tài khoản Admin mặc định nếu chưa tồn tại.
 */
export async function seedAuthData(em: EntityManager): Promise<void> {
  const adminEmail = 'admin@example.com';
  const existingAdmin = await em.findOne(User, { email: adminEmail });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    const admin = em.create(User, {
      email: adminEmail,
      firstName: 'System',
      lastName: 'Admin',
      password: hashedPassword,
      role: Role.ADMIN,
      isActive: true,
      provider: AuthProvider.LOCAL,
    });
    em.persist(admin);
    await em.flush();
  }
}
