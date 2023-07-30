import { Permissions } from "../db/models/permission";

const shorthands: { [key: string]: (keyof Permissions)[] } = {
  login: [
    "UserView",
    "UserEditPassword",
    "UserFroze",
    "PermissionView",
    "PostCreate",
    "PostView",
    "PostEdit",
    "PostDelete",
    "PostGetList",
    "PostViewReplies",
    "PostEditTags",
    "VotingVote",
    "VotingUnvote",
    "VotingVoteCount",
    "VotingGetVotes",
    "RecommendationRecommend",
  ]
};

export default shorthands;