import React from "react";
import { Redirect } from "expo-router";

// Own profile lives at profile/[id] with id "me" (the same route the MyFame tab uses).
// This screen used to show hardcoded "John Doe" data, so it now forwards there.
export default function ProfileIndexRedirect() {
  return <Redirect href={{ pathname: "/(main)/profile/[id]", params: { id: "me" } }} />;
}
