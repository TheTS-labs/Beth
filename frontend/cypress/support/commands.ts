/* eslint-disable @typescript-eslint/no-namespace */
/// <reference types="cypress" />

// eslint-disable-next-line import/no-unresolved
import { HttpResponseInterceptor,RouteMatcher, StaticResponse } from "cypress/types/net-stubbing";

Cypress.Commands.add("interceptIndefinitely", (
  requestMatcher: RouteMatcher,
  alias: string,
  response?: StaticResponse | HttpResponseInterceptor
): Cypress.Chainable<(value?: unknown) => void> => {
  let sendResponse!: (value?: unknown) => void;
  const trigger = new Promise((resolve) => {
    sendResponse = resolve;
  });

  cy.intercept(requestMatcher, async request => {
    return trigger.then(() => {
      request.reply(response);
    });
  }).as(alias);

  return cy.wrap(sendResponse);
});

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

Cypress.Commands.add("visitAndWaitForToken", (url) => {
  cy.visit(url);

  cy.get("#authTokenDefined", { timeout: 10000 });
});

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      visitAndWaitForToken(url: string): Chainable<void>
      register(options: {
        username: string
        displayName: string
        email: string
        password: string
        repeatPassword: string
      }): Chainable<void>
      interceptIndefinitely(
        requestMatcher: RouteMatcher,
        alias: string,
        response?: StaticResponse | HttpResponseInterceptor
      ): Chainable<(value?: unknown) => void>
    }
  }
}

export {};