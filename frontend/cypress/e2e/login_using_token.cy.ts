before(() => {
  cy.exec("yarn backend:seed", { timeout: 120000 });

  cy.fixture("credentials").then(credentials => {
    cy.register({ ...credentials.realCredentials, repeatPassword: credentials.realCredentials.password });
  });
});

describe("Try to login", () => {
  it("Login to account", () => {
    cy.visit("/auth/login_using_token");

    cy.fixture("credentials").then(credentials => {
      cy.get("#token").type(credentials.exampleToken);
      cy.get("#token").should("have.value", credentials.exampleToken);

      cy.get("#submit").click();

      cy.getAllLocalStorage().then(localStorage => {
        cy.location().then(location => {
          expect(localStorage[location.origin]?.AUTH_TOKEN).to.eq(JSON.stringify(credentials.exampleToken));
        });
      });

      cy.get('[href="/auth/update_data"] > p').should("have.text", credentials.realCredentials.email);
      cy.get("a > button").should("have.text", "Log Out");
    });
  });
});