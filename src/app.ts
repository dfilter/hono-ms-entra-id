import createApp from "@/lib/create-app";
import index from "@/routes/index.route";

const app = createApp();

[
  index,
].forEach((route) => {
  app.route("/", route);
});

export default app;
