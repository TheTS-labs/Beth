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

      cy.get(
        'div[class*="post_post__"] > div[class*="post_post_container__"]'
      ).should("have.length", 10);

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

describe("Open modal post", () => {
  it("Try to open modal post", () => {
    cy.intercept("/recommendation/globalRecommend").as("recommendationGlobalRecommend");
    cy.intercept("/post/view").as("postView");

    cy.visit("/");

    cy.wait("@recommendationGlobalRecommend").then(() => {
      cy.get(`${postSelector} > p[class*="post_post_text__"]`).first().click();
      cy.location("href").should("contain", "modalUser=null");
      cy.location("href").should("match", /modalPost\=\d*/);
      cy.wait("@postView").then((interception) => {
        expect(interception?.response?.statusCode).to.eq(200);
      });
    });

    cy.get('div[class*="modal_modal__"]').should("be.visible");
  });

  it("Try to close modal post: Escape", () => {
    cy.intercept("/recommendation/globalRecommend").as("recommendationGlobalRecommend");
    cy.intercept("/post/view").as("postView");

    cy.visit("/");

    cy.wait("@recommendationGlobalRecommend").then(() => {
      cy.get(`${postSelector} > p[class*="post_post_text__"]`).first().click();
      cy.location("href").should("contain", "modalUser=null");
      cy.location("href").should("match", /modalPost\=\d*/);
      cy.wait("@postView").then((interception) => {
        expect(interception?.response?.statusCode).to.eq(200);
      });
    });

    cy.get('div[class*="modal_modal__"]').should("be.visible");
    cy.get("body").type("{esc}");
    cy.get('div[class*="modal_modal__"]').should("not.exist");
  });

  it("Try to close modal post: Click outside", () => {
    cy.intercept("/recommendation/globalRecommend").as("recommendationGlobalRecommend");
    cy.intercept("/post/view").as("postView");

    cy.visit("/");

    cy.wait("@recommendationGlobalRecommend").then(() => {
      cy.get(`${postSelector} > p[class*="post_post_text__"]`).first().click();
      cy.location("href").should("contain", "modalUser=null");
      cy.location("href").should("match", /modalPost\=\d*/);
      cy.wait("@postView").then((interception) => {
        expect(interception?.response?.statusCode).to.eq(200);
      });
    });

    cy.get('div[class*="modal_modal__"]').should("be.visible");
    cy.get("body").click(0, 0);
    cy.get('div[class*="modal_modal__"]').should("not.exist");
  });
});