import { Domains } from "../app";
import ActionEndpoint from "../endpoints/action/action_endpoint";
import DevEndpoint from "../endpoints/dev/dev_endpoint";
import PermissionEndpoint from "../endpoints/permission/permission_endpoint";
import PostEndpoint from "../endpoints/post/post_endpoint";
import RecommendationEndpoint from "../endpoints/recommendation/recommendation_endpoint";
import UserEndpoint from "../endpoints/user/user_endpoint";
import VoteEndpoint from "../endpoints/vote/vote_endpoint";

export const endpoints: Domains = {
  "/user": UserEndpoint,
  "/permission": PermissionEndpoint,
  "/post": PostEndpoint,
  "/voting": VoteEndpoint,
  "/action": ActionEndpoint,
  "/recommendation": RecommendationEndpoint,
  ...process.env.NODE_ENV == "development" || process.env.NODE_ENV == "production" ? { "/dev": DevEndpoint } : {}
};

export const disableAuthFor = [
  "/user/create",
  "/recommendation/getHotTags",
  "/recommendation/globalRecommend",
  "/user/issueToken", // Authenticates itself
  "/post/viewReplies",
  "/post/search",
  "/post/view",
  "/post/getUserPosts",
  "/ping",
  "/dev/seed"
];