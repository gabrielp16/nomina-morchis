import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/dashboard", "routes/dashboard.tsx"),
  route("/users", "routes/users.tsx"),
  route("/roles", "routes/roles.tsx"),
  route("/permissions", "routes/permissions.tsx"),
  route("/activity", "routes/activity.tsx"),
] satisfies RouteConfig;
