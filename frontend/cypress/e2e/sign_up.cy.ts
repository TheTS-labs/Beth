beforeEach(() => {
  cy.exec("yarn backend:seed", { timeout: 120000 });
});

describe("Try to sing up", () => {
  it("Register account", () => {
    cy.visit("/auth/signup");

    cy.interceptIndefinitely("/user/create", "create").then(sendResponse => {
      cy.fixture("credentials").then(credentials => {
        cy.get("#username").type(credentials.realCredentials.username);
        cy.get("#username").should("have.value", credentials.realCredentials.username);
  
        cy.get("#displayName").type(credentials.realCredentials.displayName);
        cy.get("#displayName").should("have.value", credentials.realCredentials.displayName);
  
        cy.get("#email").type(credentials.realCredentials.email);
        cy.get("#email").should("have.value", credentials.realCredentials.email);
  
        cy.get("#password").type(credentials.realCredentials.password);
        cy.get("#password").should("have.value", credentials.realCredentials.password);
  
        cy.get("#repeatPassword").type(credentials.realCredentials.password);
        cy.get("#repeatPassword").should("have.value", credentials.realCredentials.password);
      });
  
      cy.get("#submit").click();
      cy.get("#submit").should("have.value", "working, just wait...");
      sendResponse();
  
      cy.wait("@create").then((interception) => {
        expect(interception?.response?.statusCode).to.eq(200);
      });
    });
  });

  it("Passwords don't match", () => {
    cy.visit("/auth/signup");

    cy.fixture("credentials").then(credentials => {
      cy.get("#username").type(credentials.realCredentials.username);
      cy.get("#username").should("have.value", credentials.realCredentials.username);

      cy.get("#displayName").type(credentials.realCredentials.displayName);
      cy.get("#displayName").should("have.value", credentials.realCredentials.displayName);

      cy.get("#email").type(credentials.realCredentials.email);
      cy.get("#email").should("have.value", credentials.realCredentials.email);

      cy.get("#password").type(credentials.realCredentials.password);
      cy.get("#password").should("have.value", credentials.realCredentials.password);

      cy.get("#repeatPassword").type(credentials.realCredentials.password + "1");
      cy.get("#repeatPassword").should("have.value", credentials.realCredentials.password + "1");
    });

    cy.get("#submit").click();
    cy.get("#submit").should("have.value", "working, just wait...");

    cy.get('div[class*="errors_errors_"]').should("have.length", 1);
    cy.get('div[class*="errors_error_message_"]').should("have.length", 1);
    cy.get('div[class*="errors_error_message_"] > p').first().should("have.text", "Passwords don't match");
  });

  it("duplicate key value violates unique constraint \"user_username_unique\"", () => {
    cy.visit("/auth/signup");

    cy.fixture("credentials").then(credentials => {
      cy.register({ ...credentials.realCredentials, repeatPassword: credentials.realCredentials.password });

      cy.interceptIndefinitely("/user/create", "create").then(sendResponse => {
        cy.get("#username").type(credentials.realCredentials.username);
        cy.get("#username").should("have.value", credentials.realCredentials.username);

        cy.get("#displayName").type(credentials.realCredentials.displayName);
        cy.get("#displayName").should("have.value", credentials.realCredentials.displayName);

        cy.get("#email").type(credentials.realCredentials.email);
        cy.get("#email").should("have.value", credentials.realCredentials.email);

        cy.get("#password").type(credentials.realCredentials.password);
        cy.get("#password").should("have.value", credentials.realCredentials.password);

        cy.get("#repeatPassword").type(credentials.realCredentials.password);
        cy.get("#repeatPassword").should("have.value", credentials.realCredentials.password);

        cy.get("#submit").click();
        cy.get("#submit").should("have.value", "working, just wait...");
        sendResponse();
      });

      cy.wait("@create").then((interception) => {
        expect(interception?.response?.statusCode).to.eq(500);
        expect(interception?.response?.body?.errorType).to.eq("DatabaseError");
        expect(interception?.response?.body?.errorMessage).to.contain(
          'duplicate key value violates unique constraint "user_username_unique"'
        );
      });

      cy.get('div[class*="errors_errors_"]').should("have.length", 1);
      cy.get('div[class*="errors_error_message_"]').should("have.length", 1);
      cy.get('div[class*="errors_error_message_"] > p').first().contains(
        'duplicate key value violates unique constraint "user_username_unique"'
      );
    });
  });

  it("duplicate key value violates unique constraint \"user_email_unique\"", () => {
    cy.visit("/auth/signup");

    cy.fixture("credentials").then(credentials => {
      cy.register({ ...credentials.realCredentials, repeatPassword: credentials.realCredentials.password });
      
      cy.interceptIndefinitely("/user/create", "create").then(sendResponse => {
        cy.get("#username").type(credentials.realCredentials.username + "1");
        cy.get("#username").should("have.value", credentials.realCredentials.username + "1");

        cy.get("#displayName").type(credentials.realCredentials.displayName);
        cy.get("#displayName").should("have.value", credentials.realCredentials.displayName);

        cy.get("#email").type(credentials.realCredentials.email);
        cy.get("#email").should("have.value", credentials.realCredentials.email);

        cy.get("#password").type(credentials.realCredentials.password);
        cy.get("#password").should("have.value", credentials.realCredentials.password);

        cy.get("#repeatPassword").type(credentials.realCredentials.password);
        cy.get("#repeatPassword").should("have.value", credentials.realCredentials.password);
    
        cy.get("#submit").click();
        cy.get("#submit").should("have.value", "working, just wait...");
        sendResponse();
      });

      cy.wait("@create").then((interception) => {
        expect(interception?.response?.statusCode).to.eq(500);
        expect(interception?.response?.body?.errorType).to.eq("DatabaseError");
        expect(interception?.response?.body?.errorMessage).to.contain(
          'duplicate key value violates unique constraint "user_email_unique"'
        );
      });

      cy.get('div[class*="errors_errors_"]').should("have.length", 1);
      cy.get('div[class*="errors_error_message_"]').should("have.length", 1);
      cy.get('div[class*="errors_error_message_"] > p').first().contains(
        'duplicate key value violates unique constraint "user_email_unique"'
      );
    });
  });

  it("Weak password", () => {
    cy.visit("/auth/signup");

    cy.fixture("credentials").then(credentials => {
      cy.get("#username").type(credentials.realCredentials.username + "1");
      cy.get("#username").should("have.value", credentials.realCredentials.username + "1");

      cy.get("#displayName").type(credentials.realCredentials.displayName);
      cy.get("#displayName").should("have.value", credentials.realCredentials.displayName);

      cy.get("#email").type(credentials.realCredentials.email);
      cy.get("#email").should("have.value", credentials.realCredentials.email);

      (credentials.weakPasswords as string[]).forEach(weakPassword => {
        cy.get("#password").clear();
        cy.get("#repeatPassword").clear();

        cy.get("#password").type(weakPassword);
        cy.get("#password").should("have.value", weakPassword);

        cy.get("#repeatPassword").type(weakPassword);
        cy.get("#repeatPassword").should("have.value", weakPassword);

        cy.get("#submit").click();
        cy.get("#submit").should("have.value", "Looks good");
      });
    });
  });

  it("Network Error", () => {
    cy.intercept("/user/create", req => req.destroy()).as("create");
  
    cy.visit("/auth/signup");

    cy.fixture("credentials").then(credentials => {
      cy.get("#username").type(credentials.realCredentials.username);
      cy.get("#username").should("have.value", credentials.realCredentials.username);

      cy.get("#displayName").type(credentials.realCredentials.displayName);
      cy.get("#displayName").should("have.value", credentials.realCredentials.displayName);

      cy.get("#email").type(credentials.realCredentials.email);
      cy.get("#email").should("have.value", credentials.realCredentials.email);

      cy.get("#password").type(credentials.realCredentials.password);
      cy.get("#password").should("have.value", credentials.realCredentials.password);

      cy.get("#repeatPassword").type(credentials.realCredentials.password);
      cy.get("#repeatPassword").should("have.value", credentials.realCredentials.password);
    });

    cy.get("#submit").click();
    cy.get("#submit").should("have.value", "working, just wait...");

    cy.get('div[class*="errors_errors_"]').should("have.length", 1);
    cy.get('div[class*="errors_error_message_"]').should("have.length", 1);
    cy.get('div[class*="errors_error_message_"] > p').first().contains("Network Error");
  });
});