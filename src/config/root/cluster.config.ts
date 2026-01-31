import { registerAs } from '@nestjs/config';

export interface ClusterConfig {
  enabled: boolean;
  workers: number;
}

export default registerAs(
  'cluster',
  (): ClusterConfig => ({
    enabled: process.env.CLUSTER_ENABLED === 'true',
    workers: parseInt(process.env.CLUSTER_WORKERS || '0', 10),
  }),
);
