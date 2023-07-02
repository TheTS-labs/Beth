import request from "supertest";

import App from "../app";
import { disableAuthFor, endpoints } from "../common/endpoints";
import { DBBool } from "../common/types";
import { PermissionStatus, TPermissions } from "../db/models/permission";
import { TToken } from "../db/models/token";
import { TUser } from "../db/models/user";
import userData, { credentials } from "./data/user_data";
import auth from "./helpers/auth";

process.env.REDIS_REQUIRED = "false";
const server = new App(endpoints, disableAuthFor);
const req = request(server.app);

afterAll((done) => { server.scheduledTasks.stop(); done(); });
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
    const { email, token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["UserView"]
    });
    // Preparing

    const res = await req.post("/user/view").send({ email }).set({ "Authorization": "Bearer " + token });

    expect(res.body.displayName).toBe(userData.displayName);
    expect(res.body.email).toBe(userData.email);
    expect(res.body.username).toBe(userData.username);
    expect(res.body.email).toBe(email);
    expect(res.body.isFrozen).toBeFalsy();
  });

  it("should return empty object", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["UserView"]
    });
    // Preparing

    const res = await req.post("/user/view").send({ email: "q@gmail.com" }).set({ "Authorization": "Bearer " + token });

    expect(JSON.stringify(res.body)).toBe("{}");
  });
});

describe("POST /user/editPassword", () => {
  it("should change user password", async () => {
    // Preparing
    const { email, token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["UserEditPassword"]
    });
    // Preparing

    const res = await req.post("/user/editPassword")
                         .send({ newPassword: credentials.newPassword })
                         .set({ "Authorization": "Bearer " + token });

    const newHash = await server.db<TUser>("user").select("password").where({ email }).first();

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(newHash?.password).not.toBe(credentials.hash);
  });
});

describe("POST /user/froze", () => {
  it("should froze user", async () => {
    // Preparing
    const { email, token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["UserFroze"]
    });
    // Preparing

    const res = await req.post("/user/froze")
                         .send({ email, froze: 1 })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const user = await server.db<TUser>("user").where({ email }).first();
    expect(user?.isFrozen).toBeTruthy();
  });

  it("should unfroze user", async () => {
    // Preparing
    const { email } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["UserFroze"]
    });
    await server.db<TUser>("user").where({ email }).update({ isFrozen: DBBool.Yes });
    const { token } = await auth(server, {
      userData: {
        email: "beth_admin@gmail.com",
        displayName: userData.displayName,
        username: "bethAdmin",
      },
      password: credentials.hash,
      scope: ["UserFroze"]
    });
    await server.db<TPermissions>("permission").insert({
      email: "beth_admin@gmail.com",
      UserSuperFroze: PermissionStatus.Has
    });
    // Preparing

    const res = await req.post("/user/froze")
                         .send({ email, froze: 0 })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const user = await server.db<TUser>("user").where({ email }).first();
    expect(user?.isFrozen).toBeFalsy();
  });

  it("should throw PermissionError", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["UserFroze"]
    });
    await server.db<TPermissions>("permission").insert({ email: userData.email });
    // Preparing

    const res = await req.post("/user/froze")
                         .send({ email: "q@gmail.com", froze: 0 })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).not.toBeUndefined();
    expect(res.statusCode).toBe(403);
  });
});

describe("POST /user/editTags", () => {
  it("should edit user tags", async () => {
    // Preparing
    const { email, token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["UserEditTags"]
    });
    await server.db<TPermissions>("permission").insert({
      email: userData.email,
      UserEditTags: PermissionStatus.Has
    });
    // Preparing

    const res = await req.post("/user/editTags")
                         .send({ email, newTags: "tag" })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const user = await server.db<TUser>("user").where({ email }).first();
    expect(user?.tags).toBe("tag");
  });

  it("should throw DatabaseError", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["UserEditTags"]
    });
    await server.db<TPermissions>("permission").insert({
      email: userData.email,
      UserEditTags: PermissionStatus.Has
    });
    // Preparing

    const res = await req.post("/user/editTags")
                         .send({ email: "q@gmail.com", newTags: "tag" })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).not.toBeUndefined();
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /user/verify", () => {
  it("should verify tags", async () => {
    // Preparing
    const { email, token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["UserVerify"]
    });
    await server.db<TPermissions>("permission").insert({
      email: userData.email,
      UserVerify: PermissionStatus.Has
    });
    // Preparing

    const res = await req.post("/user/verify")
                         .send({ email, verify: 1 })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const user = await server.db<TUser>("user").where({ email }).first();
    expect(user?.verified).toBeTruthy();
  });

  it("should unverify tags", async () => {
    // Preparing
    const { email, token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["UserVerify"]
    });
    await server.db<TUser>("user").where({ email }).update({ verified: DBBool.Yes });
    await server.db<TPermissions>("permission").insert({
      email: userData.email,
      UserVerify: PermissionStatus.Has
    });
    // Preparing

    const res = await req.post("/user/verify")
                         .send({ email, verify: 0 })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const user = await server.db<TUser>("user").where({ email }).first();
    expect(user?.verified).toBeFalsy();
  });

  it("should throw DatabaseError", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["UserVerify"]
    });
    await server.db<TPermissions>("permission").insert({
      email: userData.email,
      UserVerify: PermissionStatus.Has
    });
    // Preparing

    const res = await req.post("/user/verify")
                         .send({ email: "q@gmail.com", verify: 1 })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).not.toBeUndefined();
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /user/issueToken", () => {
  it("should issue new token", async () => {
    // Preparing
    await server.db<TUser>("user").insert({
      ...userData,
      password: credentials.hash
    });
    await server.db<TPermissions>("permission").insert({ email: userData.email });
    // Preparing

    const res = await req.post("/user/issueToken")
                         .send({
                            email: userData.email,
                            password: credentials.password,
                            scope: ["UserView"]
                          });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.token).not.toBeUndefined();
    expect(res.body.tokenId).not.toBeUndefined();

    const token = await server.db<TToken>("token").where({ id: res.body.tokenId }).first();
    expect(token).not.toBeUndefined();
  });

  it("should throw DatabaseError: User doesn't exist", async () => {
    const res = await req.post("/user/issueToken")
                         .send({
                            email: userData.email,
                            password: credentials.password,
                            scope: ["UserView"]
                          });

    expect(res.body.errorMessage).not.toBeUndefined();
    expect(res.statusCode).toBe(404);
  });

  it("should throw AuthError", async () => {
    // Preparing
    await server.db<TUser>("user").insert({
      ...userData,
      password: credentials.hash
    });
    await server.db<TPermissions>("permission").insert({ email: userData.email });
    // Preparing

    const res = await req.post("/user/issueToken")
                         .send({
                            email: userData.email,
                            password: "WrongPassword123",
                            scope: ["UserView"]
                          });

    expect(res.body.errorMessage).not.toBeUndefined();
    expect(res.statusCode).toBe(403);
  });

  it("should throw DatabaseError: Permissions doesn't exist", async () => {
    // Preparing
    await server.db<TUser>("user").insert({
      ...userData,
      password: credentials.hash
    });
    // Preparing

    const res = await req.post("/user/issueToken")
                         .send({
                            email: userData.email,
                            password: credentials.password,
                            scope: ["UserView"]
                          });

    expect(res.body.errorMessage).not.toBeUndefined();
    expect(res.statusCode).toBe(500);
  });

  it("should throw PermissionError", async () => {
    // Preparing
    await server.db<TUser>("user").insert({
      ...userData,
      password: credentials.hash
    });
    await server.db<TPermissions>("permission").insert({
      email: userData.email,
      UserView: PermissionStatus.Hasnt
    });
    // Preparing

    const res = await req.post("/user/issueToken")
                         .send({
                            email: userData.email,
                            password: credentials.password,
                            scope: ["UserView"]
                          });

    expect(res.body.errorMessage).not.toBeUndefined();
    expect(res.statusCode).toBe(403);
  });
});