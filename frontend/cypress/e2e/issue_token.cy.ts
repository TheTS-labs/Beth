before(() => {
  cy.exec("yarn backend:seed", { timeout: 120000 });

  cy.fixture("credentials").then(credentials => {
    cy.register({ ...credentials.realCredentials, repeatPassword: credentials.realCredentials.password });
  });
});

beforeEach(() => {
  cy.fixture("credentials").then(credentials => {
    cy.login(credentials.realCredentials.email, credentials.realCredentials.password);
  });
});

describe("Try to issue new token", () => {
  it("Set as session token", () => {
    cy.intercept({
      pathname: "/user/issueToken"
    }).as("issueToken");

    cy.intercept(
      { pathname: "/permission/view" },
      req => {
        req.continue(res => {
          res.delay = 2000;
          res.send();
        });
      }
    ).as("permissionView");

    cy.visit("/auth/issue_token");

    cy.get('div[class*="loader_loader__"]').should("have.length", 1);

    cy.wait("@permissionView").then(interception => {
      expect(interception?.response?.statusCode).to.eq(200);

      cy.get('div[class*="issue_token_scope_"] > span > input').each($element => {
        cy.wrap($element).click();
      });

      cy.fixture("credentials").then(credentials => {
        cy.get("#currentPassword").type(credentials.realCredentials.password);
      });

      cy.get("#setAsSessionToken").click();
      cy.get("#submit").click();
    });

    cy.wait("@issueToken").then(interception => {
      cy.getAllLocalStorage().then(localStorage => {
        cy.location().then(location => {
          expect(localStorage[location.origin]?.AUTH_TOKEN).to.eq(JSON.stringify(interception?.response?.body?.token));
        });
      });
    });
  });

  it("Just get the token", () => {
    cy.intercept({
      pathname: "/user/issueToken"
    }).as("issueToken");

    cy.intercept(
      { pathname: "/permission/view" },
      req => {
        req.continue(res => {
          res.delay = 2000;
          res.send();
        });
      }
    ).as("permissionView");

    cy.visit("/auth/issue_token");

    cy.get('div[class*="loader_loader__"]').should("have.length", 1);

    cy.wait("@permissionView").then(interception => {
      expect(interception?.response?.statusCode).to.eq(200);

      cy.get('div[class*="issue_token_scope_"] > span > input').each($element => {
        cy.wrap($element).click();
      });

      cy.fixture("credentials").then(credentials => {
        cy.get("#currentPassword").type(credentials.realCredentials.password);
      });

      cy.get("#submit").click();
    });

    cy.wait("@issueToken").then(interception => {
      cy.get('p[class*="issue_token_token_"]').should("have.text", interception?.response?.body?.token);
    });
  });
});