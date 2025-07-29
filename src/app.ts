import createApp from "@/lib/create-app";
import index from "@/routes/index.route";
import login from "@/routes/login/login.routes";
import logout from "@/routes/logout/logout.routes";

const app = createApp();

const routes = [index, login, logout];

routes.forEach((route) => {
  app.route("/", route);
});

export default app;
