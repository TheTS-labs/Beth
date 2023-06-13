import request from "supertest";

import App from "../app";
import { disableAuthFor, endpoints } from "../common/endpoints";
import userData, { credentials } from "./data/user_data";
import auth from "./helpers/auth";

process.env.REDIS_REQUIRED = "false";
const server = new App(endpoints, disableAuthFor);
const port = server.config.get("APP_PORT").required().asPortNumber();
const req = request(`http://localhost:${port}`);

beforeAll(() => { server.listen(); });
afterAll((done) => { server.server.close(); server.scheduledTasks.stop(); done(); });
beforeEach(async () => {
  await server.db("user").del();
  await server.db("token").del();
});

describe("General tests", () => {
  it("should throw UnauthorizedError", async () => {
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["user:notFound"]
    });

    const res = await req.post("/user/notFound").send({}).set({ "Authorization": "Bearer " + token+"t" });

    expect(res.body.errorMessage).toBe("invalid_token");
    expect(res.statusCode).toBe(401);
  });
});