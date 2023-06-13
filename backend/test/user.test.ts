import request from "supertest";

import App from "../app";
import { disableAuthFor, endpoints } from "../common/endpoints";
import { DBBool } from "../common/types";
import { PermissionStatus, TPermissions } from "../db/models/permission";
import { TUser } from "../db/models/user";
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
  await server.db("permission").del();
  await server.db("token").del();
});

describe("POST /user/create", () => {
  it("should create new user", async () => {
    const res = await req.post("/user/create").send({
      ...userData,
      password: credentials.password,
      repeatPassword: credentials.password,
    });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const record = await server.db<TUser>("user").where({ email: "beth@gmail.com" }).first();
    expect(record).toBeTruthy();
    const permissionRecord = await server.db<TPermissions>("permission").where({ email: "beth@gmail.com" }).first();
    expect(permissionRecord).toBeTruthy();
  });

  it("should throw DatabaseError at insertUser", async () => {
    // Preparing
    await server.db<TUser>("user").insert({ ...userData, password: credentials.hash });
    // Preparing

    const res = await req.post("/user/create").send({
      ...userData,
      password: credentials.password,
      repeatPassword: credentials.password,
    });

    expect(res.body.errorType).toBe("DatabaseError");
    expect(res.body.errorMessage).toBeTruthy();
    expect(res.statusCode).toBe(500);
  });

  it("should throw DatabaseError at insertPermissions", async () => {
    // Preparing
    await server.db<TPermissions>("permission").insert({ email: userData.email });
    // Preparing

    const res = await req.post("/user/create").send({
      ...userData,
      password: credentials.password,
      repeatPassword: credentials.password,
    });

    expect(res.body.errorType).toBe("DatabaseError");
    expect(res.body.errorMessage).toBeTruthy();
    expect(res.statusCode).toBe(500);
  });
});

describe("POST /user/view", () => {
  it("should return user object", async () => {
    // Preparing
    const { id, token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["user:view"]
    });
    // Preparing

    const res = await req.post("/user/view").send({ id: id }).set({ "Authorization": "Bearer " + token });

    expect(res.body.displayName).toBe(userData.displayName);
    expect(res.body.email).toBe(userData.email);
    expect(res.body.username).toBe(userData.username);
    expect(res.body.id).toBe(id);
    expect(res.body.isFrozen).toBeFalsy();
  });

  it("should return empty object", async () => {
    // Preparing
    const { id, token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["user:view"]
    });
    // Preparing

    const res = await req.post("/user/view").send({ id: id + 1 }).set({ "Authorization": "Bearer " + token });

    expect(JSON.stringify(res.body)).toBe("{}");
  });
});

describe("POST /user/editPassword", () => {
  it("should change user password", async () => {
    // Preparing
    const { id, token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["user:editPassword"]
    });
    // Preparing

    const res = await req.post("/user/editPassword")
                         .send({ newPassword: credentials.newPassword })
                         .set({ "Authorization": "Bearer " + token });

    const newHash = await server.db<TUser>("user").select("password").where({ id }).first();

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(newHash?.password).not.toBe(credentials.hash);
  });
});

describe("POST /user/froze", () => {
  it("should froze user", async () => {
    // Preparing
    const { id, token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["user:froze"]
    });
    // Preparing

    const res = await req.post("/user/froze")
                         .send({ id, froze: 1 })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const user = await server.db<TUser>("user").where({ id }).first();
    expect(user?.isFrozen).toBeTruthy();
  });

  it("should unfroze user", async () => {
    // Preparing
    const { id } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["user:froze"]
    });
    await server.db<TUser>("user").where({ id }).update({ isFrozen: DBBool.Yes });
    const { token } = await auth(server, {
      userData: {
        email: "beth_admin@gmail.com",
        displayName: userData.displayName,
        username: "bethAdmin",
      },
      password: credentials.hash,
      scope: ["user:froze"]
    });
    await server.db<TPermissions>("permission").insert({
      email: "beth_admin@gmail.com",
      UserSuperFroze: PermissionStatus.Has
    });
    // Preparing

    const res = await req.post("/user/froze")
                         .send({ id, froze: 0 })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const user = await server.db<TUser>("user").where({ id }).first();
    expect(user?.isFrozen).toBeFalsy();
  });

  it("should throw PermissionError", async () => {
    // Preparing
    const { id, token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["user:froze"]
    });
    await server.db<TPermissions>("permission").insert({ email: userData.email });
    // Preparing

    const res = await req.post("/user/froze")
                         .send({ id: id+1, froze: 0 })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).not.toBeUndefined();
    expect(res.statusCode).toBe(403);
  });
});

describe("POST /user/editTags", () => {
  it("should edit user tags", async () => {
    // Preparing
    const { id, token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["user:editTags"]
    });
    await server.db<TPermissions>("permission").insert({
      email: userData.email,
      UserEditTags: PermissionStatus.Has
    });
    // Preparing

    const res = await req.post("/user/editTags")
                         .send({ id, newTags: "tag" })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const user = await server.db<TUser>("user").where({ id }).first();
    expect(user?.tags).toBe("tag");
  });

  it("should throw DatabaseError", async () => {
    // Preparing
    const { id, token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["user:editTags"]
    });
    await server.db<TPermissions>("permission").insert({
      email: userData.email,
      UserEditTags: PermissionStatus.Has
    });
    // Preparing

    const res = await req.post("/user/editTags")
                         .send({ id: id+1, newTags: "tag" })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).not.toBeUndefined();
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /user/verify", () => {
  it("should verify tags", async () => {
    // Preparing
    const { id, token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["user:verify"]
    });
    await server.db<TPermissions>("permission").insert({
      email: userData.email,
      UserVerify: PermissionStatus.Has
    });
    // Preparing

    const res = await req.post("/user/verify")
                         .send({ id, verify: 1 })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const user = await server.db<TUser>("user").where({ id }).first();
    expect(user?.verified).toBeTruthy();
  });

  it("should unverify tags", async () => {
    // Preparing
    const { id, token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["user:verify"]
    });
    await server.db<TUser>("user").where({ id }).update({ verified: DBBool.Yes });
    await server.db<TPermissions>("permission").insert({
      email: userData.email,
      UserVerify: PermissionStatus.Has
    });
    // Preparing

    const res = await req.post("/user/verify")
                         .send({ id, verify: 0 })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const user = await server.db<TUser>("user").where({ id }).first();
    expect(user?.verified).toBeFalsy();
  });

  it("should throw DatabaseError", async () => {
    // Preparing
    const { id, token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["user:verify"]
    });
    await server.db<TPermissions>("permission").insert({
      email: userData.email,
      UserVerify: PermissionStatus.Has
    });
    // Preparing

    const res = await req.post("/user/verify")
                         .send({ id: id+1, verify: 1 })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).not.toBeUndefined();
    expect(res.statusCode).toBe(404);
  });
});