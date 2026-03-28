import { Migration20260128114103 } from '../../migrations/Migration20260128114103';
import { Migration20260201000000 } from '../../migrations/Migration20260201000000';
import { Migration20260210000000 } from '../../migrations/Migration20260210000000';

export const MainMigrations = [
  { name: 'Migration20260128114103', class: Migration20260128114103 },
  { name: 'Migration20260201000000', class: Migration20260201000000 },
  { name: 'Migration20260210000000', class: Migration20260210000000 },
];
