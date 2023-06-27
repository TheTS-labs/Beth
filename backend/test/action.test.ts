import request from "supertest";

import App from "../app";
import { disableAuthFor, endpoints } from "../common/endpoints";
import { TAction } from "../db/models/action";
import userData, { credentials } from "./data/user_data";
import auth from "./helpers/auth";

process.env.REDIS_REQUIRED = "true";
const server = new App(endpoints, disableAuthFor);
const port = server.config.get("APP_PORT").required().asPortNumber();
const req = request(`http://localhost:${port}`);

beforeAll(() => { server.listen(); });
afterAll((done) => { server.server.close(); server.scheduledTasks.stop(); done(); });
beforeEach(async () => {
  await server.db("user").del();
  await server.db("token").del();
  await server.db("permission").del();
  await server.db("action").del();
});

describe("POST /action/simpleSearch", () => {
  it("should return action: select is a string", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["action:simpleSearch"]
    });
    await server.db<TAction>("action").insert({
      userId: 8,
      actionType: "UserView",
      context: '{"id": "8"}'
    });
    // Preparing

    const res = await req.post("/action/simpleSearch").send({
      select: "userId",
      key: "actionType",
      operator: "=",
      value: "UserView"
    }).set({ "Authorization": "Bearer " + token });

    expect(res.body[0]).not.toBeUndefined();
    expect(res.body[0].userId).toBe(8);
    expect(res.statusCode).toBe(200);
  });

  it("should return action: select is a string array", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["action:simpleSearch"]
    });
    await server.db<TAction>("action").insert({
      userId: 8,
      actionType: "UserView",
      context: '{"id": "8"}'
    });
    // Preparing

    const res = await req.post("/action/simpleSearch").send({
      select: [ "userId", "actionType" ],
      key: "actionType",
      operator: "=",
      value: "UserView"
    }).set({ "Authorization": "Bearer " + token });

    expect(res.body[0]).not.toBeUndefined();
    expect(res.body[0].userId).toBe(8);
    expect(res.body[0].actionType).toBe("UserView");
    expect(res.statusCode).toBe(200);
  });
});

describe("POST /action/chainWhereSearch", () => {
  it("should return action: one chain, select is a string", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["action:chainWhereSearch"]
    });
    await server.db<TAction>("action").insert({
      userId: 8,
      actionType: "UserView",
      context: '{"id": "8"}'
    });
    // Preparing

    const res = await req.post("/action/chainWhereSearch").send({
      select: "userId",
      chain: [{
        clause: "where",
        key: "actionType",
        operator: "=",
        value: "UserView"
      }]
    }).set({ "Authorization": "Bearer " + token });

    expect(res.body[0]).not.toBeUndefined();
    expect(res.body[0].userId).toBe(8);
    expect(res.statusCode).toBe(200);
  });

  it("should return action: one chain, select is a string array", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["action:chainWhereSearch"]
    });
    await server.db<TAction>("action").insert({
      userId: 8,
      actionType: "UserView",
      context: '{"id": "8"}'
    });
    // Preparing

    const res = await req.post("/action/chainWhereSearch").send({
      select: [ "userId", "actionType" ],
      chain: [{
        clause: "where",
        key: "actionType",
        operator: "=",
        value: "UserView"
      }]
    }).set({ "Authorization": "Bearer " + token });

    expect(res.body[0]).not.toBeUndefined();
    expect(res.body[0].userId).toBe(8);
    expect(res.body[0].actionType).toBe("UserView");
    expect(res.statusCode).toBe(200);
  });

  it("should return action: two AND chains", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["action:chainWhereSearch"]
    });
    await server.db<TAction>("action").insert({
      userId: 9,
      actionType: "UserView",
      context: '{"id": "9"}'
    });
    await server.db<TAction>("action").insert({
      userId: 8,
      actionType: "UserView",
      context: '{"id": "8"}'
    });
    // Preparing

    const res = await req.post("/action/chainWhereSearch").send({
      select: "userId",
      chain: [
        {
          clause: "where",
          key: "actionType",
          operator: "=",
          value: "UserView"
        },
        {
          type: "AND",
          clause: "where",
          key: "userId",
          operator: "=",
          value: "8"
        }
      ]
    }).set({ "Authorization": "Bearer " + token });

    expect(res.body[0]).not.toBeUndefined();
    expect(res.body[0].userId).toBe(8);
    expect(res.statusCode).toBe(200);
  });

  it("should return action: two OR chains", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["action:chainWhereSearch"]
    });
    await server.db<TAction>("action").insert({
      userId: 9,
      actionType: "UserView",
      context: '{"id": "9"}'
    });
    await server.db<TAction>("action").insert({
      userId: 8,
      actionType: "UserView",
      context: '{"id": "8"}'
    });
    // Preparing

    const res = await req.post("/action/chainWhereSearch").send({
      select: "userId",
      chain: [
        {
          clause: "where",
          key: "actionType",
          operator: "=",
          value: "UserView"
        },
        {
          type: "OR",
          clause: "where",
          key: "userId",
          operator: "=",
          value: "8"
        }
      ]
    }).set({ "Authorization": "Bearer " + token });

    expect(res.body[0]).not.toBeUndefined();
    expect(res.body[1]).not.toBeUndefined();
    expect(res.body[0].userId).toBe(9); // May fail if returns in wrong order
    expect(res.body[1].userId).toBe(8);
    expect(res.statusCode).toBe(200);
  });
});