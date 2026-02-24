import { Migration20260201000000 } from '../../../migrations/Migration20260201000000';
import { Migration20260210000000 } from '../../../migrations/Migration20260210000000';

export const MainMigrations = [
  { name: 'Migration20260201000000', class: Migration20260201000000 },
  { name: 'Migration20260210000000', class: Migration20260210000000 },
];
