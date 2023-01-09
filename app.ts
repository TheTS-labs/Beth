import express, { Express, Router, Request, Response } from "express";
import dotenv from "dotenv";
import knex, { Knex } from "knex";
import createUser from "./endpoints/user/create";
import viewUser from "./endpoints/user/view";
import knexfile from "./db/knexfile";

dotenv.config();

interface TEndpoints {
  [key: string]: { // routerName
    [key: string]: (req: Request, res: Response, db: Knex) => Promise<void> // endpointName
  }
}

class App {
  db: Knex;
  app: Express;
  endpoints: TEndpoints;
  port: string;

  constructor(db: Knex, app: Express, endpoints: TEndpoints, port="8080") {
    this.db = db;
    this.app = app;
    this.endpoints = endpoints;
    this.port = port;

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  registerRouters(): App {
    Object.keys(this.endpoints).map((routerName: string) => {
      const endpointRouter = Router();

      endpointRouter.post("/:endPoint", async (req: Request, res: Response) => {
        this.endpoints[routerName][req.params.endPoint](req, res, this.db);
      });

      this.app.use(routerName, endpointRouter);
      console.log(`[endpoints]: ${routerName} router was registered`);
    });

    return this;
  }

  listen(): void {
    this.app.listen(this.port, () => {
      console.log(`[server]: Server is running at http://localhost:${this.port}`);
    });
  }
}

const app: Express = express();
const db = knex(knexfile[process.env.NODE_ENV || "development"]);
const endpoints: TEndpoints = {
  "/user": {
    "create": createUser,
    "view": viewUser,
    // "edit": createUser,
    // "delete": createUser,
  }
};

new App(db, app, endpoints, process.env.APP_PORT).registerRouters().listen();
