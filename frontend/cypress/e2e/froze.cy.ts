beforeEach(() => {
  cy.exec("yarn backend:seed", { timeout: 120000 });

  cy.fixture("credentials").then(credentials => {
    cy.register({ ...credentials.realCredentials, repeatPassword: credentials.realCredentials.password });
  });

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

  it("Cancel", () => {
    cy.intercept({
      pathname: "/user/froze"
    }).as("froze");

    cy.on("window:confirm", text => {
      expect(text).to.contains("If you freeze the account, there's no way you can unfreeze it yourself");

      return false;
    });
  
    cy.visit("/auth/froze");

    cy.get('[class*="common_logout_"]').click();

    cy.get("@froze").then((interceptions) => {
      expect(interceptions).to.eq(null);
    });
  });

  it("Network Error", () => {
    cy.intercept({
      pathname: "/user/froze"
    }, req => req.destroy()).as("froze");
  
    cy.visit("/auth/froze");

    cy.get('[class*="common_logout_"]').click();

    cy.get('div[class*="errors_errors_"]').should("have.length", 1);
    cy.get('div[class*="errors_error_message_"]').should("have.length", 1);
    cy.get('div[class*="errors_error_message_"] > p').first().contains("Network Error");
  });

  it("Request Error", () => {
    cy.intercept({
      pathname: "/user/froze"
    }, req => {
      req.headers["authorization"] = "Bearer undefined";
    }).as("froze");
  
    cy.visit("/auth/froze");

    cy.get('[class*="common_logout_"]').click();

    cy.wait("@froze").then((interception) => {
      expect(interception?.response?.statusCode).to.eq(401);
    });

    cy.get('div[class*="errors_errors_"]').should("have.length", 1);
    cy.get('div[class*="errors_error_message_"]').should("have.length", 1);
    cy.get('div[class*="errors_error_message_"] > p').first().should("have.text", "invalid_token");
  });
});