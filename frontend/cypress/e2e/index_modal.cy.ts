// Reusable selectors
const postSelector = 'div[class*="post_post__"] > div[class*="post_post_container__"]';

const postUserSelector = 'div[class*="post_post__"] > div[class*="post_user__"]';

before(() => cy.seed());

describe("Open and close modal post", () => {
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

describe("Open and close modal user", () => {
  it("Try to open modal user", () => {
    cy.intercept("/recommendation/globalRecommend").as("recommendationGlobalRecommend");

    //? Seeding the database does not guarantee that each user will have their own posts.
    //? If you open a user modal window when the user has no posts /post/getUserPosts will
    //? return an error Cannot convert null or undefined to object
    cy.intercept("/post/getUserPosts", { fixture: "post_get_user_posts.json" }).as("postGetUserPosts");

    cy.visit("/");

    cy.wait("@recommendationGlobalRecommend").then(() => {
      cy.get(postUserSelector).first().click();
      cy.location("href").should("match", /modalUser\=.*/);
      cy.location("href").should("contain", "modalPost=null");
      cy.wait("@postGetUserPosts").then((interception) => {
        expect(interception?.response?.statusCode).to.eq(200);
      });
    });

    cy.get('div[class*="modal_modal__"]').should("be.visible");
  });

  it("Try to close modal user: Escape", () => {
    cy.intercept("/recommendation/globalRecommend").as("recommendationGlobalRecommend");
    cy.intercept("/post/getUserPosts", { fixture: "post_get_user_posts.json" }).as("postGetUserPosts");

    cy.visit("/");

    cy.wait("@recommendationGlobalRecommend").then(() => {
      cy.get(postUserSelector).first().click();
      cy.location("href").should("match", /modalUser\=.*/);
      cy.location("href").should("contain", "modalPost=null");
      cy.wait("@postGetUserPosts").then((interception) => {
        expect(interception?.response?.statusCode).to.eq(200);
      });
    });

    cy.get('div[class*="modal_modal__"]').should("be.visible");
    cy.get("body").type("{esc}");
    cy.get('div[class*="modal_modal__"]').should("not.exist");
  });

  it("Try to close modal user: Click outside", () => {
    cy.intercept("/recommendation/globalRecommend").as("recommendationGlobalRecommend");
    cy.intercept("/post/getUserPosts", { fixture: "post_get_user_posts.json" }).as("postGetUserPosts");

    cy.visit("/");

    cy.wait("@recommendationGlobalRecommend").then(() => {
      cy.get(postUserSelector).first().click();
      cy.location("href").should("match",/modalUser\=.*/);
      cy.location("href").should("contain", "modalPost=null");
      cy.wait("@postGetUserPosts").then((interception) => {
        expect(interception?.response?.statusCode).to.eq(200);
      });
    });

    cy.get('div[class*="modal_modal__"]').should("be.visible");
    cy.get("body").click(0, 0);
    cy.get('div[class*="modal_modal__"]').should("not.exist");
  });
});

export {};