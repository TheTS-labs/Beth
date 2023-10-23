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
          expect(localStorage[location.origin].AUTH_TOKEN).to.eq(JSON.stringify(interception?.response?.body?.token));
        });
      });
    });

    cy.get('[href="/auth/update_data"] > p').should("have.text", credentials.realCredentials.email);
    cy.get("a > button").should("have.text", "Log Out");

    cy.get('[href="/auth/update_data"] > p').click();
  });
});

describe("Try to update data", () => {
  it("Current data", () => {
    cy.intercept({
      pathname: "/user/view"
    }).as("view");

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

  it.only("Update data", () => {
    cy.intercept({
      pathname: "/user/edit"
    }).as("edit");

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
});