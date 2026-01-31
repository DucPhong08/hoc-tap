import { ClusterService } from './cluster';
import { bootstrap } from './main';

ClusterService.clusterize(() => {
  void bootstrap();
});
