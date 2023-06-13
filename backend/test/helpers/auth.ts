import jwt from "jsonwebtoken";

import App from "../../app";
import { TToken } from "../../db/models/token";
import { TUser } from "../../db/models/user";

export interface Credentials {
  userData: {
    username: string
    displayName: string
    email: string
  }
  password: string
  scope: string[]
}

export default async (server: App, creds: Credentials): Promise<{ id: number, tokenId: number, token: string }> => {
  const id = (await server.db<TUser>("user").insert({ ...creds.userData, password: creds.password }, "id"))[0].id;
  const tokenId = (await server.db<TToken>("token").insert({
    owner: creds.userData.email,
    scope: creds.scope.join(" "),
  }, "id"))[0].id;

  const token = jwt.sign({
    userId: id,
    tokenId: tokenId,
    scope: creds.scope
  }, server.config.get("JWT_TOKEN_SECRET").required().asString(), { algorithm: "HS256" });

  return { id, tokenId, token };
};