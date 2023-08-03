import request from "supertest";

import App from "../app";
import { disableAuthFor, endpoints } from "../common/endpoints";
import { Post } from "../db/models/post";
import { Vote, VoteType } from "../db/models/vote";
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
    const postId = (await server.db<Post>("post").insert({
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
    const postId = (await server.db<Post>("post").insert({
      author: userData.email,
      text: "text",
      tags: "tag"
    }, "id"))[0].id;
    await server.db<Vote>("vote").insert({ userEmail: email, postId, voteType: VoteType.Up });
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
    const postId = (await server.db<Post>("post").insert({
      author: userData.email,
      text: "text",
      tags: "tag"
    }, "id"))[0].id;
    const voteId = (await server.db<Vote>("vote").insert({
      userEmail: email,
      postId,
      voteType: VoteType.Up
    }, "id"))[0].id;
    // Preparing

    const res = await req.post("/voting/vote")
                         .send({ postId, voteType: 0, unvote: true })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const vote = await server.db<Vote>("vote").where({ id: voteId }).first();
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
    const postId = (await server.db<Post>("post").insert({
      author: userData.email,
      text: "text",
      tags: "tag"
    }, "id"))[0].id;

    await server.db<Vote>("vote").insert({ userEmail: email, postId, voteType: VoteType.Up });
    await server.db<Vote>("vote").insert({ userEmail: email, postId, voteType: VoteType.Up });
    await server.db<Vote>("vote").insert({ userEmail: email, postId, voteType: VoteType.Up });
    await server.db<Vote>("vote").insert({ userEmail: email, postId, voteType: VoteType.Up });
    // Preparing

    const res = await req.post("/voting/voteCount")
                         .send({ postId })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.goodCount).toBe(4);
    expect(res.body.total).toBe(4);
    expect(res.body.badCount).toBe(0);
  });

  it("should return: 4 Down votes", async () => {
    // Preparing
    const { email, token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["VotingVoteCount"]
    });
    const postId = (await server.db<Post>("post").insert({
      author: userData.email,
      text: "text",
      tags: "tag"
    }, "id"))[0].id;

    await server.db<Vote>("vote").insert({ userEmail: email, postId, voteType: VoteType.Down });
    await server.db<Vote>("vote").insert({ userEmail: email, postId, voteType: VoteType.Down });
    await server.db<Vote>("vote").insert({ userEmail: email, postId, voteType: VoteType.Down });
    await server.db<Vote>("vote").insert({ userEmail: email, postId, voteType: VoteType.Down });
    // Preparing

    const res = await req.post("/voting/voteCount")
                         .send({ postId })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.goodCount).toBe(0);
    expect(res.body.total).toBe(-4);
    expect(res.body.badCount).toBe(4);
  });

  it("should return: 2 Up votes and 2 Down votes", async () => {
    // Preparing
    const { email, token } = await auth(server, {
      userData,
      password: credentials.hash,
      scope: ["VotingVoteCount"]
    });
    const postId = (await server.db<Post>("post").insert({
      author: userData.email,
      text: "text",
      tags: "tag"
    }, "id"))[0].id;

    await server.db<Vote>("vote").insert({ userEmail: email, postId, voteType: VoteType.Up });
    await server.db<Vote>("vote").insert({ userEmail: email, postId, voteType: VoteType.Up });
    await server.db<Vote>("vote").insert({ userEmail: email, postId, voteType: VoteType.Down });
    await server.db<Vote>("vote").insert({ userEmail: email, postId, voteType: VoteType.Down });
    // Preparing

    const res = await req.post("/voting/voteCount")
                         .send({ postId })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).toBeUndefined();
    expect(res.statusCode).toBe(200);
    expect(res.body.goodCount).toBe(2);
    expect(res.body.total).toBe(0);
    expect(res.body.badCount).toBe(2);
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
                         .send({ postId: 1 })
                         .set({ "Authorization": "Bearer " + token });

    expect(res.body.errorMessage).not.toBeUndefined();
    expect(res.statusCode).toBe(404);
  });
});