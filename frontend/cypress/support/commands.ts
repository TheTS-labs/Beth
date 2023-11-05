/* eslint-disable @typescript-eslint/no-namespace */
/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// cy.request("post", `${Cypress.env("SERVER_URL")}/user/create`, {
//   ...realCredentials,
//   email,
//   password,
//   repeatPassword: password
// });

Cypress.Commands.add("register", (options) => {
  cy.request("post", `${Cypress.env("SERVER_URL")}/user/create`, options);
});

Cypress.Commands.add("login", (email, password) => {
  cy.request("post", `${Cypress.env("SERVER_URL")}/user/issueToken`, {
    email,
    password,
    shorthand: "login"
  }).then((resp) => {
    window.localStorage.setItem("AUTH_TOKEN", JSON.stringify(resp.body.token));
  });
});

Cypress.Commands.overwrite("visit", (originalFn, url) => {
  // cy.intercept({ pathname: "/_next/static/development/_devMiddlewareManifest.json" }).as("manifest");

  originalFn(url);

  // cy.wait("@manifest").then(interception => {
  //   expect(interception?.response?.statusCode).to.eq(200);

  //   // This is needed for AUTH_TOKEN to get it's value
  //   // eslint-disable-next-line cypress/no-unnecessary-waiting
  //   cy.wait(2000);
  // });

  cy.wait(2000);
});

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      register(options: {
        username: string
        displayName: string
        email: string
        password: string
        repeatPassword: string
      }): Chainable<void>
    }
  }
}

export {};