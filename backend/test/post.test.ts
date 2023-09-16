import request from "supertest";

import App from "../app";
import { disableAuthFor, endpoints } from "../common/endpoints";
import { Permissions,PermissionStatus } from "../db/models/permission";
import { Post } from "../db/models/post";
import userData, { credentials } from "./data/user_data";
import auth from "./helpers/auth";

process.env.REDIS_REQUIRED = "false";
process.env.LOG_LEVEL = process.env.TEST_LOG_LEVEL;
const server = new App(endpoints, disableAuthFor);
const req = request(server.app);

afterAll((done) => { server.scheduledTasks.stop(); done(); });
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
      scope: ["PostCreate"]
    });
    // Preparing

    const res = await req.post("/post/create").send({ text: "Example" }).set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.body.success).toBeTruthy();
    expect(res.statusCode).toBe(200);
    expect(typeof res.body.id).toBe("number");

    const post = await server.db<Post>("post").where({ id: res.body.id }).first();
    expect(post).not.toBeUndefined();
    expect(post?.text).toBe("Example");
  });

  it("should create reply", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["PostCreate"]
    });
    const replyTo = (await server.db<Post>("post").insert({
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

    const post = await server.db<Post>("post").where({ id: res.body.id }).first();
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
      scope: ["PostCreate"]
    });
    const parent = (await server.db<Post>("post").insert({
      text: "Example 1",
      author: userData.email
    }, "id"))[0].id;
    const replyTo = (await server.db<Post>("post").insert({
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

    const post = await server.db<Post>("post").where({ id: res.body.id }).first();
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
      scope: ["PostView"]
    });
    const id = (await server.db<Post>("post").insert({
      text: "Example",
      author: userData.email
    }, "id"))[0].id;
    // Preparing

    const res = await req.post("/post/view").send({ id }).set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);

    const post = await server.db<Post>("post").where({ id }).first();
    expect(JSON.stringify(res.body)).toBe(JSON.stringify(post));
  });

  it("should return empty object", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["PostView"]
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
      scope: ["PostView"]
    });
    const id = (await server.db<Post>("post").insert({
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
      scope: ["PostEdit"]
    });
    const id = (await server.db<Post>("post").insert({
      text: "Example",
      author: userData.email
    }, "id"))[0].id;
    // Preparing

    const res = await req.post("/post/edit").send({ id, newText: "123" }).set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBeTruthy();

    const post = await server.db<Post>("post").where({ id }).first();
    expect(post?.text).toBe("123");
  });

  it("should throw DatabaseError: Post doesn't exist", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["PostEdit"]
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
      scope: ["PostEdit"]
    });
    const id = (await server.db<Post>("post").insert({
      text: "Example",
      author: "another@user.com"
    }, "id"))[0].id;
    await server.db<Permissions>("permission").insert({
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
      scope: ["PostEdit"]
    });
    const id = (await server.db<Post>("post").insert({
      text: "Example",
      author: "another@user.com"
    }, "id"))[0].id;
    await server.db<Permissions>("permission").insert({
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

    const post = await server.db<Post>("post").where({ id }).first();
    expect(post?.text).toBe("123");
  });
});

describe("POST /post/delete", () => {
  it("should delete post", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["PostDelete"]
    });
    const id = (await server.db<Post>("post").insert({
      text: "Example",
      author: userData.email
    }, "id"))[0].id;
    // Preparing

    const res = await req.post("/post/delete").send({ id }).set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBeTruthy();

    const post = await server.db<Post>("post").where({ id }).first();
    expect(post?.frozenAt).not.toBeUndefined();
  });

  it("should throw DatabaseError: Post doesn't exist", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["PostDelete"]
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
      scope: ["PostDelete"]
    });
    const id = (await server.db<Post>("post").insert({
      text: "Example",
      author: "another@user.com"
    }, "id"))[0].id;
    await server.db<Permissions>("permission").insert({
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
      scope: ["PostDelete"]
    });
    const id = (await server.db<Post>("post").insert({
      text: "Example",
      author: "another@user.com"
    }, "id"))[0].id;
    await server.db<Permissions>("permission").insert({
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

    const post = await server.db<Post>("post").where({ id }).first();
    expect(post?.frozenAt).not.toBeUndefined();
  });
});

describe("POST /post/getList", () => {
  it("should return posts and cursor", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["PostGetList"]
    });
    await server.db<Post>("post").insert({ text: "Example", author: userData.email });
    await server.db<Post>("post").insert({ text: "Example", author: userData.email });
    await server.db<Post>("post").insert({ text: "Example", author: userData.email });
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
      scope: ["PostGetList"]
    });
    await server.db<Post>("post").insert({ text: "Example", author: userData.email });
    await server.db<Post>("post").insert({ text: "Example", author: userData.email });
    await server.db<Post>("post").insert({ text: "Example", author: userData.email });
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
      scope: ["PostGetList"]
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
      scope: ["PostForceDelete"]
    });
    const id = (await server.db<Post>("post").insert({
      text: "Example",
      author: userData.email
    }, "id"))[0].id;
    // Preparing

    const res = await req.post("/post/forceDelete").send({ id }).set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBeTruthy();

    const post = await server.db<Post>("post").where({ id }).first();
    expect(post).toBeUndefined();
  });

  it("should throw DatabaseError: Post doesn't exist", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["PostForceDelete"]
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
      scope: ["PostViewReplies"]
    });
    const parent = (await server.db<Post>("post").insert({
      text: "Example",
      author: userData.email
    }, "id"))[0].id;
    await server.db<Post>("post").insert({ text: "Example 1", author: userData.email, repliesTo: parent, parent });
    await server.db<Post>("post").insert({ text: "Example 2", author: userData.email, repliesTo: parent, parent });
    await server.db<Post>("post").insert({ text: "Example 3", author: userData.email, repliesTo: parent, parent });
    // Preparing

    const res = await req.post("/post/viewReplies")
                         .send({ repliesTo: parent })
                         .set({ "Authorization": "Bearer " + token });

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
      scope: ["PostEditTags"]
    });
    const id = (await server.db<Post>("post").insert({
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

    const post = await server.db<Post>("post").where({ id }).first();
    expect(post?.tags).toBe("123,456");
  });

  it("should throw DatabaseError", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["PostEditTags"]
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
      scope: ["PostEditTags"]
    });
    const id = (await server.db<Post>("post").insert({
      text: "Example",
      author: "another@author.com"
    }, "id"))[0].id;
    await server.db<Permissions>("permission").insert({
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
      scope: ["PostEditTags"]
    });
    const id = (await server.db<Post>("post").insert({
      text: "Example",
      author: "another@author.com"
    }, "id"))[0].id;
    await server.db<Permissions>("permission").insert({
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

    const post = await server.db<Post>("post").where({ id }).first();
    expect(post?.tags).toBe("123,456");
  });
});

describe("POST /post/search", () => {
  it("should return post with tag test1", async () => {
    // Preparing
    await auth(server, {
      userData,
      password: credentials.hash,
      scope: []
    });
    await server.db<Post>("post").insert({
      text: "Example",
      author: userData.email,
      tags: "test2"
    }, "id");
    const id = (await server.db<Post>("post").insert({
      text: "Example",
      author: userData.email,
      tags: "test1"
    }, "id"))[0].id;
    // Preparing

    const res = await req.post("/post/search")
                         .send({ tags: "test1" });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.results[0].id).toBe(id);
    expect(res.body.results[1]).toBeUndefined();
  });

  it("should return everything", async () => {
    // Preparing
    await auth(server, {
      userData,
      password: credentials.hash,
      scope: []
    });
    const id = (await server.db<Post>("post").insert({
      text: "Example",
      author: userData.email,
      tags: "test1"
    }, "id"))[0].id;
    const id1 = (await server.db<Post>("post").insert({
      text: "Example",
      author: userData.email,
      tags: "test2"
    }, "id"))[0].id;
    // Preparing

    const res = await req.post("/post/search").send();

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.results[0].id).toBe(id1);
    expect(res.body.results[1].id).toBe(id);
  });
});

describe("POST /post/getUserPosts", () => {
  it("should return user posts", async () => {
    // Preparing
    await auth(server, {
      userData,
      password: credentials.hash,
      scope: []
    });
    const id = (await server.db<Post>("post").insert({
      text: "Example",
      author: userData.email
    }, "id"))[0].id;
    // Preparing

    const res = await req.post("/post/getUserPosts")
                         .send({ username: userData.username });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.results[0].id).toBe(id);
  });

  it("should throw DatabaseError", async () => {
    const res = await req.post("/post/getUserPosts")
                         .send({ username: "notFound" });

    expect(res.body.errorType).toBe("DatabaseError");
    expect(res.body.errorMessage).not.toBeUndefined();
    expect(res.statusCode).toBe(500);
  });
});