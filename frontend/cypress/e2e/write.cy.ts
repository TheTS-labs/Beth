// Reusable selectors
const postSelector = 'div[class*="post_post__"] > div[class*="post_post_container__"]';

beforeEach(() => cy.seed());

describe("Write a post or a comment", () => {
  it("Try to write a post", () => {
    cy.login("admin@example.com", "Pa$$w0rd!");

    cy.intercept("/recommendation/recommend").as("recommendationGlobalRecommend");
    cy.intercept("/post/view").as("postView");
    cy.interceptIndefinitely("/post/create", "postCreate").then(sendResponse => {
      cy.visitAndWaitForToken("/");

      cy.get('form[class*="write_form__"]').should("be.visible");
      cy.get('form[class*="write_form__"] > textarea[name="text"]').type("Text");
      cy.get('form[class*="write_form__"] > textarea[name="tags"]').type("some,tags");
      cy.get('form[class*="write_form__"] > #submit').click();

      cy.get('form[class*="write_form__"] > #submit').should("have.value", "Sending...");

      sendResponse();

      cy.wait("@postCreate").then(interception => {
        expect(interception?.response?.statusCode).to.eq(200);

        cy.get('form[class*="write_form__"] > #submit').should("not.have.value", "Sending...");
        cy.get('form[class*="write_form__"] > textarea[name="text"]').should("not.have.value", "Text");
        cy.get('form[class*="write_form__"] > textarea[name="tags"]').should("not.have.value", "some,tags");
      });
    });
  });

  it("Try to write a comment", () => {
    cy.login("admin@example.com", "Pa$$w0rd!");

    cy.intercept("/recommendation/recommend").as("recommendationGlobalRecommend");
    cy.intercept("/post/view").as("postView");
    cy.intercept("/post/viewReplies").as("postViewReplies");

    cy.interceptIndefinitely("/post/create", "postCreate").then(sendResponse => {
      cy.visitAndWaitForToken("/");

      cy.wait("@recommendationGlobalRecommend").then((interception) => {
        expect(interception?.response?.statusCode).to.eq(200);

        cy.get(`${postSelector} > p[class*="post_post_text__"] > span[class*="loading_loading__"]`).should("not.exist");
        cy.get(`${postSelector} > p[class*="post_post_text__"]`).first().click();

        cy.wait("@postView").then((interception) => {
          expect(interception?.response?.statusCode).to.eq(200);

          cy.location("href").should("contain", "modalUser=null");
          cy.location("href").should("match", /modalPost\=\d*/);

          cy.get('div[class*="modal_modal__"] > form[class*="write_form__"]').should("be.visible");
          cy.get('div[class*="modal_modal__"] > form[class*="write_form__"] > textarea[name="text"]').type("Text");
          cy.get('div[class*="modal_modal__"] > form[class*="write_form__"] > textarea[name="tags"]').type("some,tags");
          cy.get('div[class*="modal_modal__"] > form[class*="write_form__"] > #submit').click();

          cy.get('div[class*="modal_modal__"] > form[class*="write_form__"] > #submit')
            .should("have.value", "Sending...");

          sendResponse();

          cy.wait("@postCreate").then(interception => {
            expect(interception?.response?.statusCode).to.eq(200);

            cy.get('div[class*="modal_modal__"] > form[class*="write_form__"] > #submit')
              .should("not.have.value", "Sending...");
            cy.get('div[class*="modal_modal__"] > form[class*="write_form__"] > textarea[name="text"]')
              .should("not.have.value", "Text");
            cy.get('div[class*="modal_modal__"] > form[class*="write_form__"] > textarea[name="tags"]')
              .should("not.have.value", "some,tags");

            cy.wait("@postViewReplies").then(viewRepliesInterception => {
              expect(viewRepliesInterception?.response?.statusCode).to.eq(200);

              cy.get(`div[class*="modal_modal__"] > div[data-key="${interception?.response?.body?.id}"]`)
                .should("be.visible");
            });
          });
        });
      });
    });

    cy.get('div[class*="modal_modal__"]').should("be.visible");
  });

  it("Tags must be written like this example: tag1,tag2", () => {
    cy.login("admin@example.com", "Pa$$w0rd!");

    cy.intercept("/recommendation/recommend").as("recommendationGlobalRecommend");
    cy.intercept("/post/view").as("postView");
    cy.interceptIndefinitely("/post/create", "postCreate").then(sendResponse => {
      cy.visitAndWaitForToken("/");

      cy.get('form[class*="write_form__"]').should("be.visible");
      cy.get('form[class*="write_form__"] > textarea[name="text"]').type("Text");
      cy.get('form[class*="write_form__"] > textarea[name="tags"]').type("some wrong tags");
      cy.get('form[class*="write_form__"] > #submit').click();

      cy.get('form[class*="write_form__"] > #submit').should("have.value", "Sending...");

      sendResponse();

      cy.get('div[class*="errors_errors_"]').should("have.length", 1);
      cy.get('div[class*="errors_error_message_"]').should("have.length", 1);
      cy.get('div[class*="errors_error_message_"] > p').first().contains(
        "Tags must be written like this example: tag1,tag2"
      );
    });
  });
});

export {};