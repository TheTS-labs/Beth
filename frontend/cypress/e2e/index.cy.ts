describe("Test header", () => {
  it("There's no account link", () => {
    cy.visit("/");

    cy.getCookie("AUTH_TOKEN").should("not.exist");
    cy.get('[href="/auth/update_data"] > p').should("have.text", "");
  });
});

describe("Test content", () => {
  it("Loaded successful", () => {
    cy.intercept({
      pathname: "/recommendation/getHotTags"
    }).as("getHotTags");
    cy.intercept({
      pathname: "/recommendation/globalRecommend"
    }).as("globalRecommend");

    cy.visit("/");

    cy.wait("@getHotTags").then((interception) => {
      expect(interception?.response?.statusCode).to.eq(200);
    });
    cy.wait("@globalRecommend").then((interception) => {
      expect(interception?.response?.statusCode).to.eq(200);
    });
  });
});