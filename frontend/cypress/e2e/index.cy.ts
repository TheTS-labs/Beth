// Reusable selectors
const postSelector = 'div[class*="post_post__"] > div[class*="post_post_container__"]';

const tagSelector = 'div[class*="hot_tags_hot_tags__"] > div[class*="tag_hot_tag__"]';

const postUserSelector = 'div[class*="post_post__"] > div[class*="post_user__"]';

before(() => cy.seed());

describe("Loaders", () => {
  it("Post text loader", () => {
    cy.interceptIndefinitely("/recommendation/globalRecommend", "recommendationGlobalRecommend").then(sendResponse => {
      cy.visit("/");

      cy.get(postSelector).should("have.length", 10);

      cy.get(
        `${postSelector} > p[class*="post_post_text__"] > span[class*="loading_loading__"]`
      ).should("have.length", 50).should("be.visible").then(() => sendResponse());

      cy.get(`${postSelector} > p[class*="post_post_text__"] > span[class*="loading_loading__"]`).should("not.exist");
    });

    cy.get('div[class*="errors_error_message_"]').should("have.length", 0);
  });

  it("Tags loaders", () => {
    cy.interceptIndefinitely("/recommendation/getHotTags", "getHotTags").then(sendResponse => {
      cy.visit("/");

      cy.get(tagSelector).should("have.length", 8);

      cy.get([
        tagSelector,
        'div[class*="tag_hot_tag_name_and_posts_container__"]',
        'span[class*="tag_hot_tag_name__"]',
        'span[class*="loading_loading__"]'
      ].join(" > ")).should("have.length", 8).should("be.visible");

      cy.get([
        tagSelector,
        'div[class*="tag_hot_tag_name_and_posts_container__"]',
        'span[class*="tag_hot_tag_posts__"]',
        'span[class*="loading_loading__"]'
      ].join(" > ")).should("have.length", 8).should("be.visible").then(() => sendResponse());

      cy.get([
        tagSelector,
        'div[class*="tag_hot_tag_name_and_posts_container__"]',
        'span[class*="tag_hot_tag_name__"]',
        'span[class*="loading_loading__"]'
      ].join(" > ")).should("not.exist");

      cy.get([
        tagSelector,
        'div[class*="tag_hot_tag_name_and_posts_container__"]',
        'span[class*="tag_hot_tag_posts__"]',
        'span[class*="loading_loading__"]'
      ].join(" > ")).should("not.exist");
    });

    cy.get('div[class*="errors_error_message_"]').should("have.length", 0);
  });

  it("Post author loader", () => {
    cy.interceptIndefinitely("/recommendation/globalRecommend", "recommendationGlobalRecommend").then(sendResponse => {
      cy.visit("/");

      cy.get(postSelector).should("have.length", 10);

      cy.get([
        postUserSelector,
        'div[class*="post_username_and_checkmark__"]',
        'span[class*="post_username__"]',
        'span[class*="loading_loading__"]'
      ].join(" > ")).should("have.length", 10).should("be.visible");

      cy.get([
        postUserSelector,
        'span[class*="post_email__"]',
        'span[class*="loading_loading__"]'
      ].join(" > ")).should("have.length", 10).should("be.visible").then(() => sendResponse());

      cy.get([
        postUserSelector,
        'div[class*="post_username_and_checkmark__"]',
        'span[class*="post_username__"]',
        'span[class*="loading_loading__"]'
      ].join(" > ")).should("not.exist");

      cy.get(
        `${postUserSelector} > span[class*="post_email__"] > span[class*="loading_loading__"]`
      ).should("not.exist");
    });

    cy.get('div[class*="errors_error_message_"]').should("have.length", 0);
  });
});

describe("Like & Dislike", () => {
  it("Like: invalid_token", () => {
    cy.intercept("/voting/vote").as("votingVote");

    cy.visit("/");

    cy.get(`${postSelector} > div[class*="post_voting__"] > button[data-type="like"]`).first().click();

    cy.wait("@votingVote").then(interception => {
      expect(interception?.response?.statusCode).to.eq(401);
      expect(interception?.request?.body?.voteType).to.eq("1");
    });

    cy.get('div[class*="errors_errors_"]').should("have.length", 1);
    cy.get('div[class*="errors_error_message_"]').should("have.length", 1);
    cy.get('div[class*="errors_error_message_"] > p').first().contains("invalid_token");
  });

  it("Dislike post: invalid_token", () => {
    cy.intercept("/voting/vote").as("votingVote");

    cy.visit("/");

    cy.get(`${postSelector} > div[class*="post_voting__"] > button[data-type="dislike"]`).first().click();

    cy.wait("@votingVote").then(interception => {
      expect(interception?.response?.statusCode).to.eq(401);
      expect(interception?.request?.body?.voteType).to.eq("0");
    });

    cy.get('div[class*="errors_errors_"]').should("have.length", 1);
    cy.get('div[class*="errors_error_message_"]').should("have.length", 1);
    cy.get('div[class*="errors_error_message_"] > p').first().contains("invalid_token");
  });

  it("Like", () => {
    cy.seed();

    cy.fixture("credentials").then(credentials => {
      cy.register({ ...credentials.realCredentials, repeatPassword: credentials.realCredentials.password });
    });

    cy.fixture("credentials").then(credentials => {
      cy.login(credentials.realCredentials.email, credentials.realCredentials.password);
    });

    cy.intercept("/voting/vote").as("votingVote");
    cy.intercept("voting/voteCount").as("votingVoteCount");

    cy.visitAndWaitForToken("/");

    cy.get(`${postSelector} > div[class*="post_voting__"] > button[data-type="like"]`).first().click();

    cy.wait("@votingVote").then(interception => {
      expect(interception?.response?.statusCode).to.eq(200);
      expect(interception?.request?.body?.voteType).to.eq("1");
    });

    cy.wait("@votingVoteCount").then(interception => {
      expect(interception?.response?.statusCode).to.eq(200);
    });

    cy.get('div[class*="errors_error_message_"]').should("have.length", 0);

    cy.get(`${postSelector} > div[class*="post_voting__"] > span`)
      .first()
      .should("have.css", "color")
      .and("eq", "rgb(0, 128, 0)");
  });

  it("Dislike post", () => {
    cy.seed();

    cy.fixture("credentials").then(credentials => {
      cy.register({ ...credentials.realCredentials, repeatPassword: credentials.realCredentials.password });
    });

    cy.fixture("credentials").then(credentials => {
      cy.login(credentials.realCredentials.email, credentials.realCredentials.password);
    });

    cy.intercept("/voting/vote").as("votingVote");
    cy.intercept("voting/voteCount").as("votingVoteCount");

    cy.visitAndWaitForToken("/");

    cy.get(`${postSelector} > div[class*="post_voting__"] > button[data-type="dislike"]`).first().click();

    cy.wait("@votingVote").then(interception => {
      expect(interception?.response?.statusCode).to.eq(200);
      expect(interception?.request?.body?.voteType).to.eq("0");
    });

    cy.wait("@votingVoteCount").then(interception => {
      expect(interception?.response?.statusCode).to.eq(200);
    });

    cy.get('div[class*="errors_error_message_"]').should("have.length", 0);

    cy.get(`${postSelector} > div[class*="post_voting__"] > span`)
      .first()
      .should("have.css", "color")
      .and("eq", "rgb(255, 0, 0)");
  });
});

describe("Errors", () => {
  it("Failed request to /recommendation/globalRecommend", () => {
    cy.intercept("/recommendation/globalRecommend", req => req.destroy()).as("recommendationGlobalRecommend");

    cy.visit("/");

    cy.wait("@recommendationGlobalRecommend").then(() => {
      cy.get('div[class*="posts_posts_broken_container__"]').should("exist").and("be.visible");
    });
  });

  it("Failed request to /recommendation/getHotTags", () => {
    cy.intercept("/recommendation/getHotTags", req => req.destroy()).as("recommendationGetHotTags");

    cy.visit("/");

    cy.wait("@recommendationGetHotTags").then(() => {
      cy.get('div[class*="hot_tags_broken_container__"]').should("exist").and("be.visible");
    });
  });
});

export {};