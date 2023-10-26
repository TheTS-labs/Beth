import request from "supertest";

import App from "../../app";
import { disableAuthFor, endpoints } from "../../common/endpoints";
import { Action } from "../../db/models/action";
import userData, { credentials } from "../data/user_data";
import auth from "../helpers/auth";

process.env.REDIS_REQUIRED = "true";
process.env.LOG_LEVEL = process.env.TEST_LOG_LEVEL;
const server = new App(endpoints, disableAuthFor);
const req = request(server.app);

afterAll((done) => { server.scheduledTasks.stop(); server.redisClient.quit(); done(); });
beforeEach(async () => {
  await server.redisClient.flushAll();
  await server.db("user").del();
  await server.db("token").del();
  await server.db("permission").del();
  await server.db("action").del();
});

describe("POST /action/simpleSearch", () => {
  it("should return action", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["ActionSimpleSearch"]
    });
    await server.db<Action>("action").insert({
      userId: 8,
      actionType: "UserView",
      context: '{"id": "8"}'
    });
    // Preparing

    const res = await req.post("/action/simpleSearch").send({
      key: "actionType",
      operator: "=",
      value: "UserView"
    }).set({ "Authorization": "Bearer " + token });

    expect(res.body.data[0]).not.toBeUndefined();
    expect(res.body.data[0].userId).toBe(8);
    expect(res.statusCode).toBe(200);
  });
});

describe("POST /action/chainWhereSearch", () => {
  it("should return action: one chain", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["ActionChainWhereSearch"]
    });
    await server.db<Action>("action").insert({
      userId: 8,
      actionType: "UserView",
      context: '{"id": "8"}'
    });
    // Preparing

    const res = await req.post("/action/chainWhereSearch").send({
      chain: [{
        clause: "where",
        key: "actionType",
        operator: "=",
        value: "UserView"
      }]
    }).set({ "Authorization": "Bearer " + token });

    expect(res.body.data[0]).not.toBeUndefined();
    expect(res.body.data[0].userId).toBe(8);
    expect(res.statusCode).toBe(200);
  });

  it("should return action: two AND chains", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["ActionChainWhereSearch"]
    });
    await server.db<Action>("action").insert({
      userId: 9,
      actionType: "UserView",
      context: '{"id": "9"}'
    });
    await server.db<Action>("action").insert({
      userId: 8,
      actionType: "UserView",
      context: '{"id": "8"}'
    });
    // Preparing

    const res = await req.post("/action/chainWhereSearch").send({
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

    expect(res.body.data[0]).not.toBeUndefined();
    expect(res.body.data[0].userId).toBe(8);
    expect(res.statusCode).toBe(200);
  });

  it("should return action: two OR chains", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["ActionChainWhereSearch"]
    });
    await server.db<Action>("action").insert({
      userId: 9,
      actionType: "UserView",
      context: '{"id": "9"}'
    });
    await server.db<Action>("action").insert({
      userId: 8,
      actionType: "UserView",
      context: '{"id": "8"}'
    });
    // Preparing

    const res = await req.post("/action/chainWhereSearch").send({
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

    expect(res.body.data[0]).not.toBeUndefined();
    expect(res.body.data[1]).not.toBeUndefined();
    expect(res.body.data[0].userId).toBe(9); // May fail if returns in wrong order
    expect(res.body.data[1].userId).toBe(8);
    expect(res.statusCode).toBe(200);
  });
});