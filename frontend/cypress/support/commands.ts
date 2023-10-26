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