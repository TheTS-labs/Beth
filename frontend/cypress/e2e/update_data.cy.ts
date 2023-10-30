beforeEach(() => {
  cy.exec("yarn backend:seed", { timeout: 120000 });

  cy.fixture("credentials").then(credentials => {
    cy.register({ ...credentials.realCredentials, repeatPassword: credentials.realCredentials.password });
  });

  cy.fixture("credentials").then(credentials => {
    cy.login(credentials.realCredentials.email, credentials.realCredentials.password);
  });
});

describe("Try to update data", () => {
  it("Current data", () => {
    cy.intercept({
      pathname: "/user/view"
    }).as("view");

    cy.visit("/auth/update_data");

    cy.wait("@view").then((interception) => {
      expect(interception?.response?.statusCode).to.eq(200);

      cy.fixture("credentials").then(credentials => {
        cy.get(":nth-child(2) > form > #username").should(
          "have.value",
          `@${credentials.realCredentials.username}`
        ).should("have.value", `@${interception?.response?.body?.username}`);
        cy.get(":nth-child(2) > form > #displayName").should(
          "have.value",
          credentials.realCredentials.displayName
        ).should("have.value", interception?.response?.body?.displayName);
      });
    });
  });

  it("Update data", () => {
    cy.intercept({
      pathname: "/user/edit"
    }).as("edit");

    cy.visit("/auth/update_data");

    cy.fixture("credentials").then(credentials => {
      cy.fixture("others").then(({ updateData }) => {
        (updateData.fieldsToFillOneByOne as string[][]).forEach(([field, value]) => {
          cy.get("#currentPassword").type(credentials.realCredentials.password);

          cy.get(field).clear();
          cy.get(field).type(value);

          cy.get("#submit").click();

          cy.wait("@edit").then((interception) => {
            expect(interception?.response?.statusCode).to.eq(200);
            const body = new URLSearchParams(interception?.request?.body);
            
            expect(body.get(`edit[${field.split("#")[1]}]`)).to.eq(value);
          });

          cy.get('[href="/auth/update_data"] > p').click();
          cy.url().should("include", "/auth/update_data");
        });
      });
    });
  });

  it("New and Current passwords match", () => {
    cy.visit("/auth/update_data");

    cy.fixture("credentials").then(credentials => {
      cy.get("#currentPassword").type(credentials.realCredentials.password);
      cy.get(":nth-child(1) > form > #password").type(credentials.realCredentials.password);
      
      cy.get("#submit").click();
    });

    cy.get('div[class*="errors_errors_"]').should("have.length", 1);
    cy.get('div[class*="errors_error_message_"]').should("have.length", 1);
    cy.get('div[class*="errors_error_message_"] > p').first().contains("New and Current passwords match");
  });

  it("Wrong password", () => {
    cy.intercept({
      pathname: "/user/edit"
    }).as("edit");

    cy.visit("/auth/update_data");

    cy.fixture("credentials").then(credentials => {
      cy.get("#currentPassword").type("Pa$$w0rD!!");
      cy.get(":nth-child(1) > form > #password").type(credentials.realCredentials.password);
      
      cy.get("#submit").click();
    });

    cy.wait("@edit").then((interception) => {
      expect(interception?.response?.statusCode).to.eq(403);
    });

    cy.get('div[class*="errors_errors_"]').should("have.length", 1);
    cy.get('div[class*="errors_error_message_"]').should("have.length", 1);
    cy.get('div[class*="errors_error_message_"] > p').first().contains("Wrong email or password");
  });

  it("New and Current passwords match", () => {
    cy.visit("/auth/update_data");

    cy.fixture("credentials").then(credentials => {
      cy.get("#currentPassword").type(credentials.realCredentials.password);
      cy.get(":nth-child(1) > form > #password").type(credentials.realCredentials.password);
      
      cy.get("#submit").click();
    });

    cy.get('div[class*="errors_errors_"]').should("have.length", 1);
    cy.get('div[class*="errors_error_message_"]').should("have.length", 1);
    cy.get('div[class*="errors_error_message_"] > p').first().contains("New and Current passwords match");
  });

  it("Network error", () => {
    cy.intercept({
      pathname: "/user/edit"
    }, req => req.destroy()).as("edit");

    cy.visit("/auth/update_data");

    cy.fixture("credentials").then(credentials => {
      cy.get("#currentPassword").type("Pa$$w0rD!!");
      cy.get(":nth-child(1) > form > #password").type(credentials.realCredentials.password);
      
      cy.get("#submit").click();
    });

    cy.get('div[class*="errors_errors_"]').should("have.length", 1);
    cy.get('div[class*="errors_error_message_"]').should("have.length", 1);
    cy.get('div[class*="errors_error_message_"] > p').first().contains("Network Error");
  });
});