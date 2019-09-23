import express from 'express';
import routes from './routes';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

class App {
  constructor() {
    dotenv.config();
    this.server = express();
    this.middlewares();
    this.routes();
    this.connect();
  }

  middlewares() {
    this.server.use(express.json());
  }

  routes() {
    this.server.use(cors());
    this.server.use(routes);
  }

  connect() {
    mongoose
      .connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .catch(err => console.log(err));
  }
}

export default new App().server;
