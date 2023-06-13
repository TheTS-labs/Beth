import request from "supertest";

import App from "../app";
import { disableAuthFor, endpoints } from "../common/endpoints";
import { PermissionStatus,TPermissions } from "../db/models/permission";
import { TPost } from "../db/models/post";
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
  await server.db("permission").del();
  await server.db("post").del();
});

describe("POST /post/create", () => {
  it("should create post", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["post:create"]
    });
    // Preparing

    const res = await req.post("/post/create").send({ text: "Example" }).set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.body.success).toBeTruthy();
    expect(res.statusCode).toBe(200);
    expect(typeof res.body.id).toBe("number");

    const post = await server.db<TPost>("post").where({ id: res.body.id }).first();
    expect(post).not.toBeUndefined();
    expect(post?.text).toBe("Example");
  });

  it("should create reply", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["post:create"]
    });
    const replyTo = (await server.db<TPost>("post").insert({
      text: "Example 1",
      author: userData.email
    }, "id"))[0].id;
    // Preparing

    const res = await req.post("/post/create")
                         .send({ text: "Example", replyTo })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.body.success).toBeTruthy();
    expect(res.statusCode).toBe(200);
    expect(typeof res.body.id).toBe("number");

    const post = await server.db<TPost>("post").where({ id: res.body.id }).first();
    expect(post).not.toBeUndefined();
    expect(post?.text).toBe("Example");
    expect(post?.repliesTo).toBe(replyTo);
    expect(post?.parent).toBe(replyTo);
  });

  it("should create reply to reply", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["post:create"]
    });
    const parent = (await server.db<TPost>("post").insert({
      text: "Example 1",
      author: userData.email
    }, "id"))[0].id;
    const replyTo = (await server.db<TPost>("post").insert({
      text: "Example 2",
      author: userData.email,
      repliesTo: parent,
      parent
    }, "id"))[0].id;
    // Preparing

    const res = await req.post("/post/create")
                         .send({ text: "Example", replyTo })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.body.success).toBeTruthy();
    expect(res.statusCode).toBe(200);
    expect(typeof res.body.id).toBe("number");

    const post = await server.db<TPost>("post").where({ id: res.body.id }).first();
    expect(post).not.toBeUndefined();
    expect(post?.text).toBe("Example");
    expect(post?.repliesTo).toBe(replyTo);
    expect(post?.parent).toBe(parent);
  });
});

describe("POST /post/view", () => {
  it("should return post", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["post:view"]
    });
    const id = (await server.db<TPost>("post").insert({
      text: "Example",
      author: userData.email
    }, "id"))[0].id;
    // Preparing

    const res = await req.post("/post/view").send({ id }).set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);

    const post = await server.db<TPost>("post").where({ id }).first();
    expect(JSON.stringify(res.body)).toBe(JSON.stringify(post));
  });

  it("should return empty object", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["post:view"]
    });
    // Preparing

    const res = await req.post("/post/view").send({ id: 1 }).set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(JSON.stringify(res.body)).toBe("{}");
  });

  it("should return empty object if post frozen", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["post:view"]
    });
    const id = (await server.db<TPost>("post").insert({
      text: "Example",
      author: userData.email,
      frozenAt: new Date(Date.now())
    }, "id"))[0].id;
    // Preparing

    const res = await req.post("/post/view").send({ id }).set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(JSON.stringify(res.body)).toBe("{}");
  });
});

describe("POST /post/edit", () => {
  it("should edit post", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["post:edit"]
    });
    const id = (await server.db<TPost>("post").insert({
      text: "Example",
      author: userData.email
    }, "id"))[0].id;
    // Preparing

    const res = await req.post("/post/edit").send({ id, newText: "123" }).set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBeTruthy();

    const post = await server.db<TPost>("post").where({ id }).first();
    expect(post?.text).toBe("123");
  });

  it("should throw DatabaseError: Post doesn't exist", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["post:edit"]
    });
    // Preparing

    const res = await req.post("/post/edit")
                         .send({ id: 1, newText: "123" })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).not.toBeUndefined();
    expect(res.statusCode).toBe(404);
  });

  it("should throw PermissionError: You can only edit your own posts", async () => {
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
    await server.db<TPermissions>("permission").insert({
      email: userData.email,
      PostSuperEdit: PermissionStatus.Hasnt
    });
    // Preparing

    const res = await req.post("/post/edit")
                         .send({ id, newText: "123" })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).not.toBeUndefined();
    expect(res.statusCode).toBe(403);
  });

  it("should edit post: PostSuperEdit", async () => {
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
    await server.db<TPermissions>("permission").insert({
      email: userData.email,
      PostSuperEdit: PermissionStatus.Has
    });
    // Preparing

    const res = await req.post("/post/edit")
                         .send({ id, newText: "123" })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBeTruthy();

    const post = await server.db<TPost>("post").where({ id }).first();
    expect(post?.text).toBe("123");
  });
});

describe("POST /post/delete", () => {
  it("should delete post", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["post:delete"]
    });
    const id = (await server.db<TPost>("post").insert({
      text: "Example",
      author: userData.email
    }, "id"))[0].id;
    // Preparing

    const res = await req.post("/post/delete").send({ id }).set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBeTruthy();

    const post = await server.db<TPost>("post").where({ id }).first();
    expect(post?.frozenAt).not.toBeUndefined();
  });

  it("should throw DatabaseError: Post doesn't exist", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["post:delete"]
    });
    // Preparing

    const res = await req.post("/post/delete")
                         .send({ id: 1 })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).not.toBeUndefined();
    expect(res.statusCode).toBe(404);
  });

  it("should throw PermissionError: You can only delete your own posts", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["post:delete"]
    });
    const id = (await server.db<TPost>("post").insert({
      text: "Example",
      author: "another@user.com"
    }, "id"))[0].id;
    await server.db<TPermissions>("permission").insert({
      email: userData.email,
      PostSuperDelete: PermissionStatus.Hasnt
    });
    // Preparing

    const res = await req.post("/post/delete")
                         .send({ id })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).not.toBeUndefined();
    expect(res.statusCode).toBe(403);
  });

  it("should delete post: PostSuperDelete", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["post:delete"]
    });
    const id = (await server.db<TPost>("post").insert({
      text: "Example",
      author: "another@user.com"
    }, "id"))[0].id;
    await server.db<TPermissions>("permission").insert({
      email: userData.email,
      PostSuperDelete: PermissionStatus.Has
    });
    // Preparing

    const res = await req.post("/post/delete")
                         .send({ id })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBeTruthy();

    const post = await server.db<TPost>("post").where({ id }).first();
    expect(post?.frozenAt).not.toBeUndefined();
  });
});

describe("POST /post/getList", () => {
  it("should return posts and cursor", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["post:getList"]
    });
    await server.db<TPost>("post").insert({ text: "Example", author: userData.email });
    await server.db<TPost>("post").insert({ text: "Example", author: userData.email });
    await server.db<TPost>("post").insert({ text: "Example", author: userData.email });
    // Preparing

    const res = await req.post("/post/getList").send().set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.endCursor).not.toBeUndefined();
    expect(res.body.results).not.toBeUndefined();
  });

  it("should return 1 post and cursor", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["post:getList"]
    });
    await server.db<TPost>("post").insert({ text: "Example", author: userData.email });
    await server.db<TPost>("post").insert({ text: "Example", author: userData.email });
    await server.db<TPost>("post").insert({ text: "Example", author: userData.email });
    // Preparing

    const res = await req.post("/post/getList").send({ numberRecords: 1 }).set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.endCursor).not.toBeUndefined();
    expect(res.body.results).not.toBeUndefined();
    expect(res.body.results.length).toBe(1);
  });

  it("should throw DatabaseError", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["post:getList"]
    });
    // Preparing

    const res = await req.post("/post/getList").send({ numberRecords: 5 }).set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).not.toBeUndefined();
    expect(res.statusCode).toBe(500);
  });
});

describe("POST /post/forceDelete", () => {
  it("should fully delete post", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["post:forceDelete"]
    });
    const id = (await server.db<TPost>("post").insert({
      text: "Example",
      author: userData.email
    }, "id"))[0].id;
    // Preparing

    const res = await req.post("/post/forceDelete").send({ id }).set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBeTruthy();

    const post = await server.db<TPost>("post").where({ id }).first();
    expect(post).toBeUndefined();
  });

  it("should throw DatabaseError: Post doesn't exist", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["post:forceDelete"]
    });
    // Preparing

    const res = await req.post("/post/forceDelete")
                         .send({ id: 1 })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).not.toBeUndefined();
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /post/viewReplies", () => {
  it("should return replies", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["post:viewReplies"]
    });
    const parent = (await server.db<TPost>("post").insert({
      text: "Example",
      author: userData.email
    }, "id"))[0].id;
    await server.db<TPost>("post").insert({ text: "Example 1", author: userData.email, repliesTo: parent, parent });
    await server.db<TPost>("post").insert({ text: "Example 2", author: userData.email, repliesTo: parent, parent });
    await server.db<TPost>("post").insert({ text: "Example 3", author: userData.email, repliesTo: parent, parent });
    // Preparing

    const res = await req.post("/post/viewReplies").send({ parent }).set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(JSON.stringify(res.body)).not.toBe("[]");
    expect(res.body.length).toBe(3);
    
  });
});

describe("POST /post/editTags", () => {
  it("should change tags", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["post:editTags"]
    });
    const id = (await server.db<TPost>("post").insert({
      text: "Example",
      author: userData.email
    }, "id"))[0].id;
    // Preparing

    const res = await req.post("/post/editTags")
                         .send({ id, newTags: "123,456" })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBeTruthy();

    const post = await server.db<TPost>("post").where({ id }).first();
    expect(post?.tags).toBe("123,456");
  });

  it("should throw DatabaseError", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["post:editTags"]
    });
    // Preparing

    const res = await req.post("/post/editTags")
                         .send({ id: 1, newTags: "123,456" })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).not.toBeUndefined();
    expect(res.statusCode).toBe(404);
  });

  it("should throw PermissionError", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["post:editTags"]
    });
    const id = (await server.db<TPost>("post").insert({
      text: "Example",
      author: "another@author.com"
    }, "id"))[0].id;
    await server.db<TPermissions>("permission").insert({
      email: userData.email,
      PostSuperTagsEdit: PermissionStatus.Hasnt
    });
    // Preparing

    const res = await req.post("/post/editTags")
                         .send({ id, newTags: "123,456" })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).not.toBeUndefined();
    expect(res.statusCode).toBe(403);
  });

  it("should edit tags: PostSuperTagsEdit", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["post:editTags"]
    });
    const id = (await server.db<TPost>("post").insert({
      text: "Example",
      author: "another@author.com"
    }, "id"))[0].id;
    await server.db<TPermissions>("permission").insert({
      email: userData.email,
      PostSuperTagsEdit: PermissionStatus.Has
    });
    // Preparing

    const res = await req.post("/post/editTags")
                         .send({ id, newTags: "123,456" })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBeTruthy();

    const post = await server.db<TPost>("post").where({ id }).first();
    expect(post?.tags).toBe("123,456");
  });
});