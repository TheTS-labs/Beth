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

describe("Try to froze", () => {
  it("Froze", () => {
    cy.intercept({
      pathname: "/user/froze"
    }).as("froze");

    cy.visit("/auth/froze");

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