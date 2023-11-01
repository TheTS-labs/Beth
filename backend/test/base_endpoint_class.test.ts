import request from "supertest";

import App from "../app";
import { disableAuthFor, endpoints } from "../common/endpoints";
import userData, { credentials } from "./data/user_data";
import auth from "./helpers/auth";

const server = new App(endpoints, disableAuthFor);
const req = request(server.app);

afterAll((done) => { server.scheduledTasks.stop(); done(); });
beforeEach(async () => {
  await server.db("user").del();
  await server.db("token").del();
});

describe("General tests", () => {
  it("should throw EndpointNotFound", async () => {
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["UserNotFound"]
    });

    const res = await req.post("/user/notFound").send({}).set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).not.toBeUndefined();
    expect(res.statusCode).toBe(404);
  });

  it("should throw ValidationError", async () => {
    const res = await req.post("/user/create").send({});

    expect(res.body.errorMessage).not.toBeUndefined();
    expect(res.statusCode).toBe(400);
  });
});