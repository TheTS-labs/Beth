// Reusable selectors
const postSelector = 'div[class*="post_post__"] > div[class*="post_post_container__"]';

const postUserSelector = 'div[class*="post_post__"] > div[class*="post_user__"]';

beforeEach(() => cy.seed());

describe("Use post admins", () => {
  it("Try to soft delete", () => {
    cy.login("admin@example.com", "Pa$$w0rd!", "all");

    cy.intercept("/recommendation/recommend").as("recommendationGlobalRecommend");
    cy.intercept("/post/delete").as("postDelete");

    cy.visitAndWaitForToken("/");

    cy.wait("@recommendationGlobalRecommend").then((interception) => {
      expect(interception?.response?.statusCode).to.eq(200);

      cy.get(`${postSelector} > p[class*="post_post_text__"] > span[class*="loading_loading__"]`).should("not.exist");
      cy.get(`${postSelector} > p[class*="post_post_text__"]`).first().click();

      cy.contains("Soft delete").click();

      cy.wait("@postDelete").then(postDeleteInterception => {
        expect(postDeleteInterception?.response?.statusCode).to.eq(200);
      });
    });
  });

  it("Try to FORCE delete", () => {
    cy.login("admin@example.com", "Pa$$w0rd!", "all");

    cy.intercept("/recommendation/recommend").as("recommendationGlobalRecommend");
    cy.intercept("/post/forceDelete").as("postForceDelete");

    cy.visitAndWaitForToken("/");

    cy.wait("@recommendationGlobalRecommend").then((interception) => {
      expect(interception?.response?.statusCode).to.eq(200);

      cy.get(`${postSelector} > p[class*="post_post_text__"] > span[class*="loading_loading__"]`).should("not.exist");
      cy.get(`${postSelector} > p[class*="post_post_text__"]`).first().click();

      cy.contains("FORCE DELETE").click();

      cy.wait("@postForceDelete").then(postForceDeleteInterception => {
        expect(postForceDeleteInterception?.response?.statusCode).to.eq(200);
      });
    });
  });

  it("Try to delete own post", () => {
    cy.login("admin@example.com", "Pa$$w0rd!", "all");

    cy.intercept("/recommendation/recommend").as("recommendationGlobalRecommend");
    cy.intercept("/post/search").as("postSearch");
    cy.intercept("/post/delete").as("postDelete");

    cy.visitAndWaitForToken("/");

    cy.wait("@recommendationGlobalRecommend").then(() => {
      cy.get("#query").type("%testing%{enter}");

      cy.wait("@postSearch").then(() => {
        cy.contains("953ea058").click();
        cy.contains("Delete").click();

        cy.wait("@postDelete").then(postDeleteInterception => {
          expect(postDeleteInterception?.response?.statusCode).to.eq(200);
        });
      });
    });
  });
});

describe("Use user admins", () => {
  it("Try to verify", () => {
    cy.login("admin@example.com", "Pa$$w0rd!", "all");

    cy.intercept("/recommendation/recommend").as("recommendationGlobalRecommend");
    cy.intercept("/user/verify").as("userVerify");

    cy.visitAndWaitForToken("/");

    cy.wait("@recommendationGlobalRecommend").then((interception) => {
      expect(interception?.response?.statusCode).to.eq(200);

      cy.get(postUserSelector).first().click();
      
      cy.contains("Verify").click();
  
      cy.wait("@userVerify").then(userVerifyInterception => {
        expect(userVerifyInterception?.response?.statusCode).to.eq(200);
      });
    });
  });

  it("Try to unverify", () => {
    cy.login("admin@example.com", "Pa$$w0rd!", "all");

    cy.intercept("/recommendation/recommend").as("recommendationGlobalRecommend");
    cy.intercept("/user/verify").as("userVerify");

    cy.visitAndWaitForToken("/");

    cy.wait("@recommendationGlobalRecommend").then((interception) => {
      expect(interception?.response?.statusCode).to.eq(200);

      cy.get(postUserSelector).first().click();
      
      cy.contains("Unverify").click();
  
      cy.wait("@userVerify").then(userVerifyInterception => {
        expect(userVerifyInterception?.response?.statusCode).to.eq(200);
        expect(userVerifyInterception?.request?.body?.verify).to.eq(0);
      });
    });
  });

  it("Try to froze", () => {
    cy.login("admin@example.com", "Pa$$w0rd!", "all");

    cy.intercept("/recommendation/recommend").as("recommendationGlobalRecommend");
    cy.intercept("/user/froze").as("userFroze");

    cy.visitAndWaitForToken("/");

    cy.wait("@recommendationGlobalRecommend").then((interception) => {
      expect(interception?.response?.statusCode).to.eq(200);

      cy.get(postUserSelector).first().click();
      
      cy.contains("Froze").click();
  
      cy.wait("@userFroze").then(userFrozeInterception => {
        expect(userFrozeInterception?.response?.statusCode).to.eq(200);
      });
    });
  });

  it("Try to unfroze", () => {
    cy.login("admin@example.com", "Pa$$w0rd!", "all");

    cy.intercept("/recommendation/recommend").as("recommendationGlobalRecommend");
    cy.intercept("/user/froze").as("userFroze");

    cy.visitAndWaitForToken("/");

    cy.wait("@recommendationGlobalRecommend").then((interception) => {
      expect(interception?.response?.statusCode).to.eq(200);

      cy.get(postUserSelector).first().click();
      
      cy.contains("Unfroze").click();
  
      cy.wait("@userFroze").then(userFrozeInterception => {
        expect(userFrozeInterception?.response?.statusCode).to.eq(200);
        expect(userFrozeInterception?.request?.body?.froze).to.eq(0);
      });
    });
  });

  it("Try to edit tags", () => {
    cy.login("admin@example.com", "Pa$$w0rd!", "all");

    cy.intercept("/recommendation/recommend").as("recommendationGlobalRecommend");
    cy.intercept("/user/editTags").as("userEditTags");

    cy.visitAndWaitForToken("/");

    cy.wait("@recommendationGlobalRecommend").then((interception) => {
      expect(interception?.response?.statusCode).to.eq(200);

      cy.get(postUserSelector).first().click();

      cy.window().then(win => {
        cy.stub(win, "prompt").returns("testingonly,testingtag");
       
        cy.contains("Edit tags").click();

        cy.wait("@userEditTags").then(userEditTagsInterception => {
          expect(userEditTagsInterception?.response?.statusCode).to.eq(200);
        });
      });
    });
  });

  it("Try to grand permission", () => {
    cy.login("admin@example.com", "Pa$$w0rd!", "all");

    cy.intercept("/recommendation/recommend").as("recommendationGlobalRecommend");
    cy.intercept("/permission/grand").as("permissionGrand");

    cy.visitAndWaitForToken("/");

    cy.wait("@recommendationGlobalRecommend").then((interception) => {
      expect(interception?.response?.statusCode).to.eq(200);

      cy.get(postUserSelector).first().click();

      cy.window().then(win => {
        cy.stub(win, "prompt").returns("UserView");
       
        cy.contains("Grand permission").click();

        cy.wait("@permissionGrand").then(permissionGrandInterception => {
          expect(permissionGrandInterception?.response?.statusCode).to.eq(200);
        });
      });
    });
  });

  it("Try to rescind permission", () => {
    cy.login("admin@example.com", "Pa$$w0rd!", "all");

    cy.intercept("/recommendation/recommend").as("recommendationGlobalRecommend");
    cy.intercept("/permission/rescind").as("permissionRescind");

    cy.visitAndWaitForToken("/");

    cy.wait("@recommendationGlobalRecommend").then((interception) => {
      expect(interception?.response?.statusCode).to.eq(200);

      cy.get(postUserSelector).first().click();

      cy.window().then(win => {
        cy.stub(win, "prompt").returns("UserView");
       
        cy.contains("Rescind permission").click();

        cy.wait("@permissionRescind").then(permissionRescindInterception => {
          expect(permissionRescindInterception?.response?.statusCode).to.eq(200);
        });
      });
    });
  });
});

export {};