import { NestFactory } from '@nestjs/core';
import * as fs from 'fs';
import { AppModule } from '../src/app.module';

async function generateRoutesAndExit() {
  const app = await NestFactory.create(AppModule);
  await app.listen(0);
  const server = app.getHttpServer();
  const router = server._events.request._router;
  const methodGroupedRoutes = {};
  router.stack.forEach((layer) => {
    if (layer.route) {
      const method = layer.route.stack[0].method;
      if (!methodGroupedRoutes[method]) methodGroupedRoutes[method] = [];
      const pathHasParam = layer.route.path.includes(':');
      let path = layer.route.path;
      if (pathHasParam === true) {
        path = layer.route.path.split(':')[0];
      }

      const last = path[path.length - 1];
      if (last === '/') {
        path = path.substring(0, path.length - 1);
      }

      if (methodGroupedRoutes[method].indexOf(path) === -1) {
        // Check exist route
        methodGroupedRoutes[method].push(path);
      }
    }
  });
  fs.writeFileSync('routes.json', JSON.stringify(methodGroupedRoutes), 'utf8');
  console.log(methodGroupedRoutes);
  process.exit();
}
generateRoutesAndExit();
