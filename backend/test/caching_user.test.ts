import request from "supertest";

import App from "../app";
import { disableAuthFor, endpoints } from "../common/endpoints";
import { TUser } from "../db/models/user";
import userData, { credentials } from "./data/user_data";
import auth from "./helpers/auth";

process.env.REDIS_REQUIRED = "true";
const server = new App(endpoints, disableAuthFor);
const port = server.config.get("APP_PORT").required().asPortNumber();
const req = request(`http://localhost:${port}`);

beforeAll(() => { server.listen(); });
afterAll((done) => { server.server.close(); server.scheduledTasks.stop(); server.redisClient.disconnect(); done(); });
beforeEach(async () => {
  await server.db("user").del();
  await server.db("permission").del();
  await server.db("token").del();
});

describe("POST /user/editPassword", () => {
  it("should change user password", async () => {
    // Preparing
    const { id, token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["user:editPassword"]
    });

    await server.redisClient.set(userData.email, "TestCacheValue");
    // Preparing

    const res = await req
                .post("/user/editPassword")
                .send({ newPassword: credentials.newPassword })
                .set({ "Authorization": "Bearer " + token });

    const newHash = await server.db<TUser>("user").select("password").where({ id }).first();
    const user = await server.redisClient.get(userData.email);

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(newHash?.password).not.toBe(credentials.hash);
    expect(user).toBeNull();
  });
});