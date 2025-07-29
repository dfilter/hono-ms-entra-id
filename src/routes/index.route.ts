import { createRouter } from "@/lib/create-app";

const router = createRouter().get((c) => {
    return c.json(
        {
        message: "Welcome to the Microsoft Entra ID authenticated API!",
        },
        200
    );
});

export default router;
