const request = require("supertest");
const { app, server, closeDatabase } = require("../../server");

afterAll(async () => {
    await closeDatabase(); // Ferme MongoDB
    server.close(); // Ferme le serveur
});

describe("Tests des routes Provider", () => {
    test("GET /api/auth doit retourner un 200", async () => {
        const response = await request(app).get("/api/auth");
        expect(response.statusCode).toBe(200);
    });

    test("POST /api/auth/login avec mauvais identifiants doit retourner un 401", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .send({ email: "fake@example.com", password: "wrongpass" });
        expect([400, 401]).toContain(response.statusCode);
    });
});

// 📌 Ferme l’application après tous les tests
afterAll((done) => {
    server.close(() => {
        console.log("✅ Serveur fermé après les tests");
        done();
    });
});

