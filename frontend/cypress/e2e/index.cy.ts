// Reusable selectors
const postSelector = 'div[class*="post_post__"] > div[class*="post_post_container__"]';

const tagSelector = 'div[class*="hot_tags_hot_tags__"] > div[class*="tag_hot_tag__"]';

const postUserSelector = 'div[class*="post_post__"] > div[class*="post_user__"]';

before(() => {
  cy.exec("yarn backend:seed", { timeout: 120000 });
});

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
  it.only("Like post", () => {
    cy.intercept({
      pathname: "/voting/vote"
    }).as("votingVote");

    cy.visit("/");

    cy.get(`${postSelector} > div[class*="post_voting__"] > button[data-type="like"]`)
      .first()
      .then(elementBeforeClick => {
      cy.get(`${postSelector} > div[class*="post_voting__"] > button[data-type="like"]`).first().click();

      cy.wait("@votingVote").then(interception => {
        expect(interception?.response?.statusCode).to.eq(401);
        expect(interception?.request?.body?.voteType).to.eq("1");
      });
  
      cy.get('div[class*="errors_errors_"]').should("have.length", 1);
      cy.get('div[class*="errors_error_message_"]').should("have.length", 1);
      cy.get('div[class*="errors_error_message_"] > p').first().contains("invalid_token");

      cy.get(`${postSelector} > div[class*="post_voting__"] > button[data-type="like"]`).first()
        .then(elementAfterClick => {
        expect(elementAfterClick).to.eql(elementBeforeClick);
      });
    });
  });

  it.only("Dislike post", () => {
    cy.intercept({
      pathname: "/voting/vote"
    }).as("votingVote");

    cy.visit("/");

    cy.get(`${postSelector} > div[class*="post_voting__"] > button[data-type="dislike"]`)
      .first()
      .then(elementBeforeClick => {
      cy.get(`${postSelector} > div[class*="post_voting__"] > button[data-type="dislike"]`).first().click();

      cy.wait("@votingVote").then(interception => {
        expect(interception?.response?.statusCode).to.eq(401);
        expect(interception?.request?.body?.voteType).to.eq("0");
      });
  
      cy.get('div[class*="errors_errors_"]').should("have.length", 1);
      cy.get('div[class*="errors_error_message_"]').should("have.length", 1);
      cy.get('div[class*="errors_error_message_"] > p').first().contains("invalid_token");

      cy.get(`${postSelector} > div[class*="post_voting__"] > button[data-type="dislike"]`).first()
        .then(elementAfterClick => {
        expect(elementAfterClick).to.eql(elementBeforeClick);
      });
    });
  });
});
