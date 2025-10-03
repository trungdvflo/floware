import { NestFactory } from '@nestjs/core';
import * as fs from 'fs';
import { AppModule } from '../src/app.module';
import { loadConfig } from '../src/configs/config';
import { internalRoutes } from '../src/configs/routes';

async function generateRoutesAndExit() {
  await loadConfig();
  const app = await NestFactory.create(AppModule);
  await app.listen(0);
  const server = app.getHttpServer();
  const router = server._events.request._router;
  const methodGroupedRoutes = {};
  router.stack
    .forEach(layer => {
      if (layer.route) {
        // not public internal routes
        const intRoute = internalRoutes.find(
          r => r.path === layer.route.path);
        if (intRoute && intRoute.path) {
          return;
        };
        const method = layer.route.stack[0].method;
        if(!methodGroupedRoutes[method]) methodGroupedRoutes[method] = [];        
        if(methodGroupedRoutes[method].indexOf(layer.route.path) === -1){ // Check exist route
          methodGroupedRoutes[method].push(layer.route.path);
        }
      }
    });    
  fs.writeFileSync('routes.json', JSON.stringify(methodGroupedRoutes), 'utf8');
  process.exit();
}
generateRoutesAndExit();