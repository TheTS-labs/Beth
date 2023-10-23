before(() => {
  cy.exec("yarn backend:seed", { timeout: 120000 });

  cy.fixture("credentials").then(credentials => {
    cy.request("post", `${Cypress.env("SERVER_URL")}/user/create`, {
      ...credentials.realCredentials,
      repeatPassword: credentials.realCredentials.password
    });
  });
});

beforeEach(() => {
  cy.visit("/");
  cy.get('[href="/auth/login"] > button').click();
  cy.url().should("include", "/auth/login");

  cy.intercept({
    pathname: "/user/issueToken"
  }).as("issueToken");

  cy.fixture("credentials").then(credentials => {
    cy.get("#email").type(credentials.realCredentials.email);
    cy.get("#email").should("have.value", credentials.realCredentials.email);

    cy.get("#password").type(credentials.realCredentials.password);
    cy.get("#password").should("have.value", credentials.realCredentials.password);

    cy.get("#submit").click();
    cy.get("#submit").should("have.value", "working, just wait...");

    cy.wait("@issueToken").then((interception) => {
      expect(interception?.response?.statusCode).to.eq(200);

      cy.getAllLocalStorage().then(localStorage => {
        cy.location().then(location => {
          expect(localStorage[location.origin]?.AUTH_TOKEN).to.eq(JSON.stringify(interception?.response?.body?.token));
        });
      });
    });

    cy.get('[href="/auth/update_data"] > p').should("have.text", credentials.realCredentials.email);
    cy.get("a > button").should("have.text", "Log Out");

    cy.get('[href="/auth/update_data"] > p').click();
    cy.get('[href="/auth/froze"] > button').click();
    cy.url().should("include", "/auth/froze");
  });
});

describe("Try to froze", () => {
  it("Froze", () => {
    cy.intercept({
      pathname: "/user/froze"
    }).as("froze");

    cy.get('[class*="common_logout_"]').click();

    cy.wait("@froze").then((interception) => {
      expect(interception?.response?.statusCode).to.eq(200);
    });

    cy.getAllLocalStorage().then(localStorage => {
      cy.location().then(location => {
        expect(localStorage[location.origin]?.AUTH_TOKEN).to.eq(undefined);
      });
    });

    cy.get('[href="/auth/login"] > button').click();
    cy.url().should("include", "/auth/login");

    cy.intercept({
      pathname: "/user/issueToken"
    }).as("issueToken");
  
    cy.fixture("credentials").then(credentials => {
      cy.get("#email").type(credentials.realCredentials.email);
      cy.get("#email").should("have.value", credentials.realCredentials.email);
  
      cy.get("#password").type(credentials.realCredentials.password);
      cy.get("#password").should("have.value", credentials.realCredentials.password);
  
      cy.get("#submit").click();
      cy.get("#submit").should("have.value", "working, just wait...");
  
      cy.wait("@issueToken").then((interception) => {
        expect(interception?.response?.statusCode).to.eq(403);
      });

      cy.get('div[class*="errors_errors_"]').should("have.length", 1);
      cy.get('div[class*="errors_error_message_"]').should("have.length", 1);
      cy.get('div[class*="errors_error_message_"] > p').first().contains(
        `User ${credentials.realCredentials.email} is frozen`
      );
    });
  });
});