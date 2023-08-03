import request from "supertest";

import App from "../../app";
import { disableAuthFor, endpoints } from "../../common/endpoints";
import { Post } from "../../db/models/post";
import { User } from "../../db/models/user";
import { Vote, VoteType } from "../../db/models/vote";
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
  await server.db("permission").del();
  await server.db("token").del();
  await server.db("post").del();
  await server.db("vote").del();
});

describe("POST /recommendation/globalRecommend", () => {
  it("should throw UnknownError", async () => {
    const res = await req.post("/recommendation/globalRecommend");

    expect(res.body.errorMessage).not.toBeUndefined();
    expect(res.statusCode).toBe(500);
  });

  it("should return posts", async () => {
    // Preparing
    const { email } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: []
    });

    const id1 = (await server.db<Post>("post").insert({ text: "Example 1", author: userData.email }, "id"))[0].id;
    const id2 = (await server.db<Post>("post").insert({ text: "Example 2", author: userData.email }, "id"))[0].id;
    const id3 = (await server.db<Post>("post").insert({ text: "Example 3", author: userData.email }, "id"))[0].id;

    await server.db<Vote>("vote").insert({ userEmail: email, postId: id1, voteType: VoteType.Up });
    await server.db<Vote>("vote").insert({ userEmail: email, postId: id2, voteType: VoteType.Up });
    await server.db<Vote>("vote").insert({ userEmail: email, postId: id3, voteType: VoteType.Up });
    // Preparing

    const res = await req.post("/recommendation/globalRecommend");

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.endCursor).not.toBeUndefined();
    expect(typeof res.body.endCursor).toBe("string");
    expect(res.body.results).not.toBeUndefined();
    expect(res.body.results.length).toBe(3);
  });
});

describe("POST /recommendation/getHotTags", () => {
  it("should return hot tag", async () => {
    // Preparing
    const { email } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: []
    });

    const id1 = (await server.db<Post>("post").insert({
      text: "Example 1", author: userData.email, tags: "tag"
    }, "id"))[0].id;
    const id2 = (await server.db<Post>("post").insert({ 
      text: "Example 2", author: userData.email, tags: "tag"
    }, "id"))[0].id;
    const id3 = (await server.db<Post>("post").insert({
      text: "Example 3", author: userData.email, tags: "tag"
    }, "id"))[0].id;

    await server.db<Vote>("vote").insert({ userEmail: email, postId: id1, voteType: VoteType.Up });
    await server.db<Vote>("vote").insert({ userEmail: email, postId: id2, voteType: VoteType.Up });
    await server.db<Vote>("vote").insert({ userEmail: email, postId: id3, voteType: VoteType.Up });
    // Preparing

    const res = await req.post("/recommendation/getHotTags");

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.result).not.toBeUndefined();
    expect(res.body.result.length).toBe(1);
    expect(res.body.result[0].post_count).toBe("3");
    expect(res.body.result[0].tag).toBe("tag");
  });

  it("should return hot tags", async () => {
    // Preparing
    const { email } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: []
    });

    const id1 = (await server.db<Post>("post").insert({
      text: "Example 1", author: userData.email, tags: "notTag"
    }, "id"))[0].id;
    const id2 = (await server.db<Post>("post").insert({ 
      text: "Example 2", author: userData.email, tags: "notTag"
    }, "id"))[0].id;
    const id3 = (await server.db<Post>("post").insert({
      text: "Example 3", author: userData.email, tags: "tag"
    }, "id"))[0].id;

    await server.db<Vote>("vote").insert({ userEmail: email, postId: id1, voteType: VoteType.Up });
    await server.db<Vote>("vote").insert({ userEmail: email, postId: id2, voteType: VoteType.Up });
    await server.db<Vote>("vote").insert({ userEmail: email, postId: id3, voteType: VoteType.Up });
    // Preparing

    const res = await req.post("/recommendation/getHotTags");

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.result).not.toBeUndefined();
    expect(res.body.result.length).toBe(2);
    expect(res.body.result[0].post_count).toBe("2");
    expect(res.body.result[0].tag).toBe("notTag");

    expect(res.body.result[1].post_count).toBe("1");
    expect(res.body.result[1].tag).toBe("tag");
  });
});

describe("POST /recommendation/recommend", () => {
  it("should return liked posts if there are no other posts", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: [ "RecommendationRecommend" ]
    });

    await server.db<User>("user").insert({ username: "1", displayName: "", email: "1@gmail.com", password: "" });
    await server.db<User>("user").insert({ username: "2", displayName: "", email: "2@gmail.com", password: "" });
    await server.db<User>("user").insert({ username: "3", displayName: "", email: "3@gmail.com", password: "" });

    const posts = [
      (await server.db<Post>("post").insert({ text: "Example 1", author: "1@gmail.com" }).returning("*"))[0],
      (await server.db<Post>("post").insert({ text: "Example 2", author: "2@gmail.com" }).returning("*"))[0],
      (await server.db<Post>("post").insert({ text: "Example 3", author: "3@gmail.com" }).returning("*"))[0],
    ];
    // Preparing

    const res = await req.post("/recommendation/recommend").set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);

    expect(res.body.results[0].id).toBe(posts[2].id);
    expect(res.body.results[1].id).toBe(posts[1].id);
    expect(res.body.results[2].id).toBe(posts[0].id);
  });

  it("should correctly set rates: empty tags", async () => {
    // Preparing
    const { email, token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: [ "RecommendationRecommend" ]
    });

    await server.db<User>("user").insert({ username: "1", displayName: "", email: "1@gmail.com", password: "" });
    await server.db<User>("user").insert({ username: "2", displayName: "", email: "2@gmail.com", password: "" });
    await server.db<User>("user").insert({ username: "3", displayName: "", email: "3@gmail.com", password: "" });

    const posts = [
      (await server.db<Post>("post").insert({ text: "Example 1", author: "1@gmail.com" }).returning("*"))[0],
      (await server.db<Post>("post").insert({ text: "Example 2", author: "2@gmail.com" }).returning("*"))[0],
      (await server.db<Post>("post").insert({ text: "Example 3", author: "3@gmail.com" }).returning("*"))[0],
    ];

    await server.db<Vote>("vote").insert({ userEmail: email, postId: posts[2].id, voteType: VoteType.Up });
    // Preparing

    const res = await req.post("/recommendation/recommend").set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);

    // May fail if sorting is changed
    expect(res.body.results[0].id).toBe(posts[2].id); // Liked User(+1)
    expect(res.body.results[1].id).toBe(posts[1].id); // Nothing(0)
    expect(res.body.results[2].id).toBe(posts[0].id); // Nothing(0)

    expect(res.body.results[0].rate).toBe(1);
    expect(res.body.results[1].rate).toBe(0);
    expect(res.body.results[2].rate).toBe(0);
  });

  it("should correctly set rates: liked and not liked tags", async () => {
    // Preparing
    const { email, token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: [ "RecommendationRecommend" ]
    });

    await server.db<User>("user").insert({ username: "1", displayName: "", email: "1@gmail.com", password: "" });
    await server.db<User>("user").insert({ username: "2", displayName: "", email: "2@gmail.com", password: "" });
    await server.db<User>("user").insert({ username: "3", displayName: "", email: "3@gmail.com", password: "" });

    const posts = [
      (await server.db<Post>("post").insert({
        text: "Example 1",
        author: "1@gmail.com",
        tags: "notLiked"
      }).returning("*"))[0],
      (await server.db<Post>("post").insert({
        text: "Example 2",
        author: "2@gmail.com",
        tags: "liked"
      }).returning("*"))[0],
      (await server.db<Post>("post").insert({
        text: "Example 3",
        author: "3@gmail.com",
        tags: "liked"
      }).returning("*"))[0],
    ];

    await server.db<Vote>("vote").insert({ userEmail: email, postId: posts[2].id, voteType: VoteType.Up });
    // Preparing

    const res = await req.post("/recommendation/recommend").set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);

    // May fail if sorting is changed
    expect(res.body.results[0].id).toBe(posts[2].id); // Liked User(+1) + Liked Tag(+1)
    expect(res.body.results[1].id).toBe(posts[1].id); // Liked Tag(+1)
    expect(res.body.results[2].id).toBe(posts[0].id); // Nothing(0)

    expect(res.body.results[0].rate).toBe(2);
    expect(res.body.results[1].rate).toBe(1);
    expect(res.body.results[2].rate).toBe(0);
  });

  it("should correctly set rates: disliked and not disliked tag", async () => {
    // Preparing
    const { email, token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: [ "RecommendationRecommend" ]
    });

    await server.db<User>("user").insert({ username: "1", displayName: "", email: "1@gmail.com", password: "" });
    await server.db<User>("user").insert({ username: "2", displayName: "", email: "2@gmail.com", password: "" });
    await server.db<User>("user").insert({ username: "3", displayName: "", email: "3@gmail.com", password: "" });

    const posts = [
      (await server.db<Post>("post").insert({
        text: "Example 1",
        author: "1@gmail.com",
        tags: "notDisliked"
      }).returning("*"))[0],
      (await server.db<Post>("post").insert({
        text: "Example 2",
        author: "2@gmail.com",
        tags: "disliked"
      }).returning("*"))[0],
      (await server.db<Post>("post").insert({
        text: "Example 3",
        author: "3@gmail.com",
        tags: "disliked"
      }).returning("*"))[0],
    ];

    await server.db<Vote>("vote").insert({ userEmail: email, postId: posts[2].id, voteType: VoteType.Down });
    // Preparing

    const res = await req.post("/recommendation/recommend").set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);

    // May fail if sorting is changed
    expect(res.body.results[0].id).toBe(posts[0].id); // Nothing(0)
    expect(res.body.results[1].id).toBe(posts[1].id); // Disliked Tag(-1)
    expect(res.body.results[2].id).toBe(posts[2].id); // Disliked User(-1) + Disliked Tag(-1)

    expect(res.body.results[0].rate).toBe(0);
    expect(res.body.results[1].rate).toBe(-1);
    expect(res.body.results[2].rate).toBe(-2);
  });

  it("should correctly set rates: disliked and not disliked user", async () => {
    // Preparing
    const { email, token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: [ "RecommendationRecommend" ]
    });

    await server.db<User>("user").insert({ username: "1", displayName: "", email: "1@gmail.com", password: "" });
    await server.db<User>("user").insert({ username: "2", displayName: "", email: "2@gmail.com", password: "" });
    await server.db<User>("user").insert({ username: "3", displayName: "", email: "3@gmail.com", password: "" });
    const posts = [
      (await server.db<Post>("post").insert({ text: "Example 1", author: "1@gmail.com" }).returning("*"))[0],
      (await server.db<Post>("post").insert({ text: "Example 2", author: "2@gmail.com" }).returning("*"))[0],
      (await server.db<Post>("post").insert({ text: "Example 3", author: "2@gmail.com" }).returning("*"))[0],
    ];

    await server.db<Vote>("vote").insert({ userEmail: email, postId: posts[2].id, voteType: VoteType.Down });
    // Preparing

    const res = await req.post("/recommendation/recommend").set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);

    // May fail if sorting is changed
    expect(res.body.results[0].id).toBe(posts[0].id); // Nothing(0)
    expect(res.body.results[1].id).toBe(posts[2].id); // Disliked User(-1)
    expect(res.body.results[2].id).toBe(posts[1].id); // Disliked User(-1)

    expect(res.body.results[0].rate).toBe(0);
    expect(res.body.results[1].rate).toBe(-1);
    expect(res.body.results[2].rate).toBe(-1);
  });
});