import request from "supertest";

import App from "../app";
import { disableAuthFor, endpoints } from "../common/endpoints";
import { Permissions,PermissionStatus } from "../db/models/permission";
import userData, { credentials } from "./data/user_data";
import auth from "./helpers/auth";

const server = new App(endpoints, disableAuthFor);
const req = request(server.app);

afterAll((done) => { server.scheduledTasks.stop(); done(); });
beforeEach(async () => {
  await server.db("user").del();
  await server.db("permission").del();
  await server.db("token").del();
});

describe("POST /permission/view", () => {
  it("should return permissions", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["PermissionView"]
    });
    await server.db<Permissions>("permission").insert({
      email: userData.email,
      UserSuperFroze: PermissionStatus.Has,
      UserEditTags: PermissionStatus.Hasnt
    });
    // Preparing

    const res = await req.post("/permission/view")
                         .send({ email: userData.email })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.UserSuperFroze).toBeTruthy();
    expect(res.body.UserEditTags).toBeFalsy();
  });

  it("should throw DatabaseError", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["PermissionView"]
    });
    // Preparing

    const res = await req.post("/permission/view")
                         .send({ email: userData.email })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).not.toBeUndefined();
    expect(res.statusCode).toBe(500);
  });
});

describe("POST /permission/grand", () => {
  it("should grand permission", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["PermissionGrand"]
    });
    const id = (await server.db<Permissions>("permission").insert({
      email: userData.email,
      PermissionGrand: PermissionStatus.Has,
      VotingVote: PermissionStatus.Hasnt
    }, "id"))[0].id;
    // Preparing

    const res = await req.post("/permission/grand")
                         .send({ grandTo: userData.email, grandPermission: "VotingVote" })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    
    const permissions = await server.db<Permissions>("permission").where({ id }).first();
    expect(permissions?.VotingVote).toBeTruthy();
  });
});

describe("POST /permission/rescind", () => {
  it("should rescind permission", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["PermissionRescind"]
    });
    const id = (await server.db<Permissions>("permission").insert({
      email: userData.email,
      PermissionRescind: PermissionStatus.Has,
      VotingVote: PermissionStatus.Has
    }, "id"))[0].id;
    // Preparing

    const res = await req.post("/permission/rescind")
                         .send({ rescindFrom: userData.email, rescindPermission: "VotingVote" })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    
    const permissions = await server.db<Permissions>("permission").where({ id }).first();
    expect(permissions?.VotingVote).toBeFalsy();
  });
});