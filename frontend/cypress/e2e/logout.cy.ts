beforeEach(() => {
  cy.exec("yarn backend:seed", { timeout: 120000 });

  cy.fixture("credentials").then(credentials => {
    cy.register({ ...credentials.realCredentials, repeatPassword: credentials.realCredentials.password });
  });

  cy.fixture("credentials").then(credentials => {
    cy.login(credentials.realCredentials.email, credentials.realCredentials.password);
  });
});

describe("Try to log out", () => {
  it("Log out", () => {
    cy.visit("/auth/logout");

    cy.getAllLocalStorage().then(localStorage => {
      cy.location().then(location => {
        expect(localStorage[location.origin]?.AUTH_TOKEN).not.to.eq(undefined);
      });
    });

    cy.get('[class*="common_logout_"]').click();

    cy.getAllLocalStorage().then(localStorage => {
      cy.location().then(location => {
        expect(localStorage[location.origin]?.AUTH_TOKEN).to.eq(undefined);
      });
    });
  });
});