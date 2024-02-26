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
  ],
  all: [
    "UserView",
    "UserSuperView",
    "UserEditPassword",
    "UserFroze",
    "UserSuperFroze",
    "UserEditTags",
    "UserVerify",
    "PermissionView",
    "PermissionGrand",
    "PermissionRescind",
    "PostCreate",
    "PostView",
    "PostEdit",
    "PostDelete",
    "PostSuperEdit",
    "PostSuperDelete",
    "PostGetList",
    "PostForceDelete",
    "PostViewReplies",
    "PostEditTags",
    "PostSuperTagsEdit",
    "VotingVote",
    "VotingUnvote",
    "VotingVoteCount",
    "VotingGetVotes",
    "ActionSimpleSearch",
    "ActionChainWhereSearch",
    "RecommendationRecommend"
  ]
};

export default shorthands;