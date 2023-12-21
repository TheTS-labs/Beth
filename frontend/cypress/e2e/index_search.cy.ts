before(() => cy.seed());

describe("Search by text", () => {
  it("Try to search", () => {
    cy.intercept("/recommendation/globalRecommend").as("recommendationGlobalRecommend");
    cy.intercept("/post/search").as("postSearch");

    cy.visit("/");

    cy.wait("@recommendationGlobalRecommend").then(() => {
      cy.get("#query").type("%testing%{enter}");

      cy.wait("@postSearch").then(() => {
        cy.location("href").should("contain", "tags=%22%22");
        cy.location("href").should("contain", "q=%22%25testing%25%22");

        cy.get('div[class*="post_post__"]').should("have.length", 1);
        cy.contains("953ea058");
      });
    });
  });

  it("Back to the feed", () => {
    cy.intercept("/recommendation/globalRecommend").as("recommendationGlobalRecommend");
    cy.intercept("/post/search").as("postSearch");

    cy.visit("/");

    cy.wait("@recommendationGlobalRecommend").then(() => {
      cy.get("#query").type("%testing%{enter}");

      cy.wait("@postSearch").then(() => {
        cy.location("href").should("contain", "tags=%22%22");
        cy.location("href").should("contain", "q=%22%25testing%25%22");

        cy.get('div[class*="post_post__"]').should("have.length", 1);
        cy.contains("953ea058");

        cy.contains("⬅ Search results").click();

        cy.get('div[class*="post_post__"]').should("have.length", 10);
      });
    });
  });

  it("Search by tags", () => {
    cy.intercept("/recommendation/globalRecommend").as("recommendationGlobalRecommend");
    cy.intercept("/post/search").as("postSearch");

    cy.visit("/");

    cy.wait("@recommendationGlobalRecommend").then(() => {
      //                     ↓ this space is really that important
      cy.get("#query").type(" tags:[testingonly]{enter}");

      cy.wait("@postSearch").then(() => {
        cy.location("href").should("contain", "tags=%22testingonly%22");
        cy.location("href").should("contain", "q=%22%22");

        cy.get('div[class*="post_post__"]').should("have.length", 1);
        cy.contains("953ea058");
      });
    });
  });

  it("Search by tags and text", () => {
    cy.intercept("/recommendation/globalRecommend").as("recommendationGlobalRecommend");
    cy.intercept("/post/search").as("postSearch");

    cy.visit("/");

    cy.wait("@recommendationGlobalRecommend").then(() => {
      //                     ↓↓ Anything
      cy.get("#query").type("%% tags:[testingonly]{enter}");

      cy.wait("@postSearch").then(() => {
        cy.location("href").should("contain", "tags=%22testingonly%22");
        cy.location("href").should("contain", "q=%22%25%25%22");

        cy.get('div[class*="post_post__"]').should("have.length", 1);
        cy.contains("953ea058");
      });
    });
  });
});