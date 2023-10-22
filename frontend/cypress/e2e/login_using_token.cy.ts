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
  cy.get('[href="/auth/login_using_token"] > button').click();
  cy.url().should("include", "/auth/login_using_token");
});

describe("Try to login", () => {
  it("Login to account", () => {
    cy.fixture("credentials").then(credentials => {
      // eslint-disable-next-line max-len
      cy.get("#token").type("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoyNCwic2NvcGUiOlsiVXNlclZpZXciLCJVc2VyRWRpdFBhc3N3b3JkIiwiVXNlckZyb3plIiwiUGVybWlzc2lvblZpZXciLCJQb3N0Q3JlYXRlIiwiUG9zdFZpZXciLCJQb3N0RWRpdCIsIlBvc3REZWxldGUiLCJQb3N0R2V0TGlzdCIsIlBvc3RWaWV3UmVwbGllcyIsIlBvc3RFZGl0VGFncyIsIlZvdGluZ1ZvdGUiLCJWb3RpbmdVbnZvdGUiLCJWb3RpbmdWb3RlQ291bnQiLCJWb3RpbmdHZXRWb3RlcyIsIlJlY29tbWVuZGF0aW9uUmVjb21tZW5kIl0sImVtYWlsIjoidGVzdEBjeXByZXNzLmlvIiwiaWF0IjoxNjk3OTkxNDMxLCJleHAiOjE3MDA1ODM0MzF9.GlUvRjmDhVlKNhrVdqCI31maCe77kz7hoipnw7y4EXg");
      // eslint-disable-next-line max-len
      cy.get("#token").should("have.value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoyNCwic2NvcGUiOlsiVXNlclZpZXciLCJVc2VyRWRpdFBhc3N3b3JkIiwiVXNlckZyb3plIiwiUGVybWlzc2lvblZpZXciLCJQb3N0Q3JlYXRlIiwiUG9zdFZpZXciLCJQb3N0RWRpdCIsIlBvc3REZWxldGUiLCJQb3N0R2V0TGlzdCIsIlBvc3RWaWV3UmVwbGllcyIsIlBvc3RFZGl0VGFncyIsIlZvdGluZ1ZvdGUiLCJWb3RpbmdVbnZvdGUiLCJWb3RpbmdWb3RlQ291bnQiLCJWb3RpbmdHZXRWb3RlcyIsIlJlY29tbWVuZGF0aW9uUmVjb21tZW5kIl0sImVtYWlsIjoidGVzdEBjeXByZXNzLmlvIiwiaWF0IjoxNjk3OTkxNDMxLCJleHAiOjE3MDA1ODM0MzF9.GlUvRjmDhVlKNhrVdqCI31maCe77kz7hoipnw7y4EXg");

      cy.get("#submit").click();

      cy.getAllLocalStorage().then(localStorage => {
        cy.location().then(location => {
          // eslint-disable-next-line max-len
          expect(localStorage[location.origin].AUTH_TOKEN).to.eq(JSON.stringify("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoyNCwic2NvcGUiOlsiVXNlclZpZXciLCJVc2VyRWRpdFBhc3N3b3JkIiwiVXNlckZyb3plIiwiUGVybWlzc2lvblZpZXciLCJQb3N0Q3JlYXRlIiwiUG9zdFZpZXciLCJQb3N0RWRpdCIsIlBvc3REZWxldGUiLCJQb3N0R2V0TGlzdCIsIlBvc3RWaWV3UmVwbGllcyIsIlBvc3RFZGl0VGFncyIsIlZvdGluZ1ZvdGUiLCJWb3RpbmdVbnZvdGUiLCJWb3RpbmdWb3RlQ291bnQiLCJWb3RpbmdHZXRWb3RlcyIsIlJlY29tbWVuZGF0aW9uUmVjb21tZW5kIl0sImVtYWlsIjoidGVzdEBjeXByZXNzLmlvIiwiaWF0IjoxNjk3OTkxNDMxLCJleHAiOjE3MDA1ODM0MzF9.GlUvRjmDhVlKNhrVdqCI31maCe77kz7hoipnw7y4EXg"));
        });
      });

      cy.get('[href="/auth/update_data"] > p').should("have.text", credentials.realCredentials.email);
      cy.get("a > button").should("have.text", "Log Out");
    });
  });
});