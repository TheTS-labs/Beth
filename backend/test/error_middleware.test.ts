import request from "supertest";

import App from "../app";
import { disableAuthFor, endpoints } from "../common/endpoints";
import { TPost } from "../db/models/post";
import userData, { credentials } from "./data/user_data";
import auth from "./helpers/auth";

process.env.REDIS_REQUIRED = "false";
const server = new App(endpoints, disableAuthFor);
const req = request(server.app);

afterAll((done) => { server.scheduledTasks.stop(); done(); });
beforeEach(async () => {
  await server.db("user").del();
  await server.db("token").del();
  await server.db("permission").del();
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

  it("should throw UnknownError", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["post:edit"]
    });
    const id = (await server.db<TPost>("post").insert({
      text: "Example",
      author: "another@user.com"
    }, "id"))[0].id;
    // Preparing

    const res = await req.post("/post/edit")
                         .send({ id, newText: "123" })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).not.toBeUndefined();
    expect(res.statusCode).toBe(500);
  });
});