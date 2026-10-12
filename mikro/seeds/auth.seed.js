const { MikroORM } = require('@mikro-orm/core');
const bcrypt = require('bcrypt');
const { DB_CONTEXTS } = require('../../dist/database/database.constants');
const { context } = require('../../dist/database/database.contexts');
const { databaseOptions } = require('../../dist/database/env/database.options');
const { Role } = require('../../dist/common/constants/role.constant');
const {
  AuthProvider,
} = require('../../dist/modules/auth/enums/auth-provider.enum');
const { User } = require('../../dist/modules/users/entities/user.entity');

async function seedAuthData(em) {
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

async function run() {
  const orm = await MikroORM.init(databaseOptions(context(DB_CONTEXTS.MAIN)));

  try {
    await seedAuthData(orm.em.fork());
  } finally {
    await orm.close(true);
  }
}

if (require.main === module) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { seedAuthData };
