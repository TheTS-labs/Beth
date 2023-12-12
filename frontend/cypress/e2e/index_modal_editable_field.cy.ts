// Reusable selectors
const postSelector = 'div[class*="post_post__"] > div[class*="post_post_container__"]';

beforeEach(() => cy.seed());

describe("Use editable field", () => {
  it("Try to edit text", () => {
    cy.login("admin@example.com", "Pa$$w0rd!", "all");

    cy.intercept("/recommendation/recommend").as("recommendationGlobalRecommend");
    cy.intercept("/post/view").as("postView");
    cy.intercept("/post/edit").as("postEdit");

    cy.visitAndWaitForToken("/");

    cy.wait("@recommendationGlobalRecommend").then((interception) => {
      expect(interception?.response?.statusCode).to.eq(200);

      cy.get(`${postSelector} > p[class*="post_post_text__"] > span[class*="loading_loading__"]`).should("not.exist");
      cy.get(`${postSelector} > p[class*="post_post_text__"]`).first().click();

      cy.wait("@postView").then((interception) => {
        expect(interception?.response?.statusCode).to.eq(200);

        cy.location("href").should("contain", "modalUser=null");
        cy.location("href").should("match", /modalPost\=\d*/);

        cy.get('p[class*="expanded_post_post_text__"] > div[class*="editable_field_container__"]').click();

        cy.get('p[class*="expanded_post_post_text__"] > div[class*="editable_field_container__"] > textarea')
          .should("be.visible");
        cy.get('p[class*="expanded_post_post_text__"] > div[class*="editable_field_container__"] > button')
          .should("be.visible");

        cy.get('p[class*="expanded_post_post_text__"] > div[class*="editable_field_container__"] > textarea').clear();
        cy.get('p[class*="expanded_post_post_text__"] > div[class*="editable_field_container__"] > textarea')
          .type("New text");

        cy.get('p[class*="expanded_post_post_text__"] > div[class*="editable_field_container__"] > button').first()
          .click();
        cy.get('p[class*="expanded_post_post_text__"] > div[class*="editable_field_container__"] > p').first()
          .should("have.text", "New text");

        cy.wait("@postEdit").then((interception) => {
          expect(interception?.response?.statusCode).to.eq(200);
          expect(interception?.request?.body?.newText).to.eq("New text");
        });
      });
    });

    cy.get('div[class*="modal_modal__"]').should("be.visible");
  });

  it("Text editor can't be opened without a proper token", () => {
    cy.login("admin@example.com", "Pa$$w0rd!");

    cy.intercept("/recommendation/recommend").as("recommendationGlobalRecommend");
    cy.intercept("/post/view").as("postView");
    cy.intercept("/post/edit").as("postEdit");

    cy.visitAndWaitForToken("/");

    cy.wait("@recommendationGlobalRecommend").then((interception) => {
      expect(interception?.response?.statusCode).to.eq(200);

      cy.get(`${postSelector} > p[class*="post_post_text__"] > span[class*="loading_loading__"]`).should("not.exist");
      cy.get(`${postSelector} > p[class*="post_post_text__"]`).first().click();

      cy.wait("@postView").then((interception) => {
        expect(interception?.response?.statusCode).to.eq(200);

        cy.location("href").should("contain", "modalUser=null");
        cy.location("href").should("match", /modalPost\=\d*/);

        cy.get('p[class*="expanded_post_post_text__"] > div[class*="editable_field_container__"]').should("not.exist");
        cy.get('div[class*="modal_modal__"] > p').should("be.visible");
      });
    });

    cy.get('div[class*="modal_modal__"]').should("be.visible");
  });

  it("Try to cancel text editing", () => {
    cy.login("admin@example.com", "Pa$$w0rd!", "all");

    cy.intercept("/recommendation/recommend").as("recommendationGlobalRecommend");
    cy.intercept("/post/view").as("postView");
    cy.intercept("/post/edit").as("postEdit");

    cy.visitAndWaitForToken("/");

    cy.wait("@recommendationGlobalRecommend").then((interception) => {
      expect(interception?.response?.statusCode).to.eq(200);

      cy.get(`${postSelector} > p[class*="post_post_text__"] > span[class*="loading_loading__"]`).should("not.exist");
      cy.get(`${postSelector} > p[class*="post_post_text__"]`).first().click();

      cy.wait("@postView").then((interception) => {
        expect(interception?.response?.statusCode).to.eq(200);

        cy.location("href").should("contain", "modalUser=null");
        cy.location("href").should("match", /modalPost\=\d*/);

        cy.get('p[class*="expanded_post_post_text__"] > div[class*="editable_field_container__"]').click();

        cy.get('p[class*="expanded_post_post_text__"] > div[class*="editable_field_container__"] > textarea')
          .should("be.visible");
        cy.get('p[class*="expanded_post_post_text__"] > div[class*="editable_field_container__"] > button')
          .should("be.visible");

        cy.get('p[class*="expanded_post_post_text__"] > div[class*="editable_field_container__"] > textarea').clear();
        cy.get('p[class*="expanded_post_post_text__"] > div[class*="editable_field_container__"] > textarea')
          .type("New text");

        cy.get('p[class*="expanded_post_post_text__"] > div[class*="editable_field_container__"] > :nth-child(3)')
          .first()
          .click();
        cy.get('p[class*="expanded_post_post_text__"] > div[class*="editable_field_container__"] > p').first()
          .should("not.have.text", "New text");

        //? Wait to verify that the postEdit request never occurred
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(2000);
        cy.get("@postEdit.all").then((interceptions) => {
          expect(interceptions).to.have.length(0);
        });
      });
    });

    cy.get('div[class*="modal_modal__"]').should("be.visible");
  });
});

export {};