before(() => {
  cy.exec("yarn backend:seed", { timeout: 120000 });

  cy.fixture("credentials").then(credentials => {
    cy.register({ ...credentials.realCredentials, repeatPassword: credentials.realCredentials.password });
  });
});

beforeEach(() => {
  cy.visit("/");
  cy.get('[href="/auth/login"] > button').click();
  cy.url().should("include", "/auth/login");
});

describe("Try to login", () => {
  it("Login to account", () => {
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
            expect(localStorage[location.origin]?.AUTH_TOKEN).to.eq(
              JSON.stringify(interception?.response?.body?.token)
            );
          });
        });
      });

      cy.get('[href="/auth/update_data"] > p').should("have.text", credentials.realCredentials.email);
      cy.get("a > button").should("have.text", "Log Out");
    });
  });

  it("Account doesn't exist", () => {
    cy.intercept({
      pathname: "/user/issueToken"
    }, req => {
      req.continue(res => {
        res.delay = 2000;
        res.send();
      });
    }).as("issueToken");

    cy.fixture("credentials").then(credentials => {
      cy.get("#email").type("not.existing@email.com");
      cy.get("#email").should("have.value", "not.existing@email.com");

      cy.get("#password").type(credentials.realCredentials.password);
      cy.get("#password").should("have.value", credentials.realCredentials.password);

      cy.get("#submit").click();
      cy.get("#submit").should("have.value", "working, just wait...");

      cy.wait("@issueToken").then((interception) => {
        expect(interception?.response?.statusCode).to.eq(404);

        cy.get("#submit").should("have.value", "Looks good");
      });

      cy.get('div[class*="errors_errors_"]').should("have.length", 1);
      cy.get('div[class*="errors_error_message_"]').should("have.length", 1);
      cy.get('div[class*="errors_error_message_"] > p').first().should("have.text", "User doesn't exist");
    });
  });

  it("Password is wrong", () => {
    cy.intercept({
      pathname: "/user/issueToken"
    }).as("issueToken");

    cy.fixture("credentials").then(credentials => {
      cy.get("#email").type(credentials.realCredentials.email);
      cy.get("#email").should("have.value", credentials.realCredentials.email);

      cy.get("#password").type("Pa$$w0rD!!");
      cy.get("#password").should("have.value", "Pa$$w0rD!!");

      cy.get("#submit").click();
      cy.get("#submit").should("have.value", "working, just wait...");

      cy.wait("@issueToken").then((interception) => {
        expect(interception?.response?.statusCode).to.eq(403);
      });

      cy.get('div[class*="errors_errors_"]').should("have.length", 1);
      cy.get('div[class*="errors_error_message_"]').should("have.length", 1);
      cy.get('div[class*="errors_error_message_"] > p').first().should("have.text", "Wrong email or password");
    });
  });
});