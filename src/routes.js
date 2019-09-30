import { Router } from 'express';
import ProductController from './app/controllers/ProductController';

const routes = new Router();

routes.post('/create', ProductController.store);
routes.post('/read', ProductController.read);
routes.get('/readAll', ProductController.readAll);

export default routes;
