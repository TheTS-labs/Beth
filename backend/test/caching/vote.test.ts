import request from "supertest";

import App from "../../app";
import { disableAuthFor, endpoints } from "../../common/endpoints";
import { TPost } from "../../db/models/post";
import { TVote, Vote } from "../../db/models/vote";
import userData, { credentials } from "../data/user_data";
import auth from "../helpers/auth";

process.env.REDIS_REQUIRED = "true";
const server = new App(endpoints, disableAuthFor);
const req = request(server.app);

afterAll((done) => { server.scheduledTasks.stop(); server.redisClient.quit(); done(); });
beforeEach(async () => {
  await server.redisClient.flushAll();
  await server.db("user").del();
  await server.db("token").del();
  await server.db("post").del();
  await server.db("vote").del();
});

describe("POST /voting/vote", () => {
  it("should create vote", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["VotingVote"]
    });
    const postId = (await server.db<TPost>("post").insert({
      author: userData.email,
      text: "text",
      tags: "tag"
    }, "id"))[0].id;
    // Preparing

    const res = await req.post("/voting/vote")
                         .send({ postId, voteType: 1 })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should throw DatabaseError: Post doesn't exist", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["VotingVote"]
    });
    // Preparing

    const res = await req.post("/voting/vote")
                         .send({ postId: 1, voteType: 1 })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).not.toBeUndefined();
    expect(res.statusCode).toBe(404);
  });

  it("should throw DatabaseError: You already voted", async () => {
    // Preparing
    const { email, token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["VotingVote"]
    });
    const postId = (await server.db<TPost>("post").insert({
      author: userData.email,
      text: "text",
      tags: "tag"
    }, "id"))[0].id;
    await server.db<TVote>("vote").insert({ userEmail: email, postId, voteType: Vote.Up });
    // Preparing

    const res = await req.post("/voting/vote")
                         .send({ postId, voteType: 0 })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).not.toBeUndefined();
    expect(res.statusCode).toBe(403);
  });

  it("should delete vote", async () => {
    // Preparing
    const { email, token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["VotingVote"]
    });
    const postId = (await server.db<TPost>("post").insert({
      author: userData.email,
      text: "text",
      tags: "tag"
    }, "id"))[0].id;
    const voteId = (await server.db<TVote>("vote").insert({ userEmail: email, postId, voteType: Vote.Up }, "id"))[0].id;
    // Preparing

    const res = await req.post("/voting/vote")
                         .send({ postId, voteType: 0, unvote: true })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const vote = await server.db<TVote>("vote").where({ id: voteId }).first();
    expect(vote).toBeUndefined();
  });
});

describe("POST /voting/voteCount", () => {
  it("should return: 4 Up votes", async () => {
    // Preparing
    const { email, token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["VotingVoteCount"]
    });
    const postId = (await server.db<TPost>("post").insert({
      author: userData.email,
      text: "text",
      tags: "tag"
    }, "id"))[0].id;

    await server.db<TVote>("vote").insert({ userEmail: email, postId, voteType: Vote.Up });
    await server.db<TVote>("vote").insert({ userEmail: email, postId, voteType: Vote.Up });
    await server.db<TVote>("vote").insert({ userEmail: email, postId, voteType: Vote.Up });
    await server.db<TVote>("vote").insert({ userEmail: email, postId, voteType: Vote.Up });
    // Preparing

    const res = await req.post("/voting/voteCount")
                         .send({ postId, voteType: 1 })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBe(4);
  });

  it("should return: 4 Down votes", async () => {
    // Preparing
    const { email, token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["VotingVoteCount"]
    });
    const postId = (await server.db<TPost>("post").insert({
      author: userData.email,
      text: "text",
      tags: "tag"
    }, "id"))[0].id;

    await server.db<TVote>("vote").insert({ userEmail: email, postId, voteType: Vote.Down });
    await server.db<TVote>("vote").insert({ userEmail: email, postId, voteType: Vote.Down });
    await server.db<TVote>("vote").insert({ userEmail: email, postId, voteType: Vote.Down });
    await server.db<TVote>("vote").insert({ userEmail: email, postId, voteType: Vote.Down });
    // Preparing

    const res = await req.post("/voting/voteCount")
                         .send({ postId, voteType: 0 })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBe(4);
  });

  it("should return: 2 Up votes and 2 Down votes", async () => {
    // Preparing
    const { email, token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["VotingVoteCount"]
    });
    const postId = (await server.db<TPost>("post").insert({
      author: userData.email,
      text: "text",
      tags: "tag"
    }, "id"))[0].id;

    await server.db<TVote>("vote").insert({ userEmail: email, postId, voteType: Vote.Up });
    await server.db<TVote>("vote").insert({ userEmail: email, postId, voteType: Vote.Up });
    await server.db<TVote>("vote").insert({ userEmail: email, postId, voteType: Vote.Down });
    await server.db<TVote>("vote").insert({ userEmail: email, postId, voteType: Vote.Down });
    // Preparing

    const upvotes = await req.post("/voting/voteCount")
                         .send({ postId, voteType: 1 })
                         .set({ "Authorization": "Bearer " + token });

    expect(upvotes.body.errorMessage).toBeUndefined();
    expect(upvotes.statusCode).toBe(200);
    expect(upvotes.body.count).toBe(2);

    const downvotes = await req.post("/voting/voteCount")
                         .send({ postId, voteType: 0 })
                         .set({ "Authorization": "Bearer " + token });

    expect(downvotes.body.errorMessage).toBeUndefined();
    expect(downvotes.statusCode).toBe(200);
    expect(downvotes.body.count).toBe(2);
  });

  it("should throw DatabaseError", async () => {
    // Preparing
    const { token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["VotingVoteCount"]
    });
    // Preparing

    const res = await req.post("/voting/voteCount")
                         .send({ postId: 1, voteType: 1 })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).not.toBeUndefined();
    expect(res.statusCode).toBe(404);
  });
});