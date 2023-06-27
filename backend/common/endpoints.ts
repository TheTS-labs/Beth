import { TEndpointTypes } from "../app";
import ActionEndpoint from "../endpoints/action/action_endpoint";
import PermissionEndpoint from "../endpoints/permission/permission_endpoint";
import PostEndpoint from "../endpoints/post/post_endpoint";
import RecommendationEndpoint from "../endpoints/recommendation/recommendation_endpoint";
import UserEndpoint from "../endpoints/user/user_endpoint";
import VoteEndpoint from "../endpoints/vote/vote_endpoint";

export const endpoints: TEndpointTypes = {
  "/user": UserEndpoint,
  "/permission": PermissionEndpoint,
  "/post": PostEndpoint,
  "/voting": VoteEndpoint,
  "/action": ActionEndpoint,
  "/recommendation": RecommendationEndpoint
};

export const disableAuthFor = [
  "/user/create",
  "/recommendation/getHotTags",
  "/recommendation/getPosts",
  "/user/issueToken" // Authenticates itself
];