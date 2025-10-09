const request = require("supertest");
const { app, server, closeDatabase } = require("../../../server");

// Fermer proprement la base MongoDB et le serveur après tous les tests
afterAll(async () => {
  await closeDatabase();
  server.close();
});

describe("Tests de la route /api/providers", () => {

  test("GET /api/providers doit retourner un 200", async () => {
    const response = await request(app).get("/api/providers");
    expect(response.statusCode).toBe(200);
  });

  test("POST /api/providers doit retourner un 201 et créer un provider", async () => {
    const newProvider = {
      name: "Test Provider",
      service: "Cleaning",
      phoneNumber: "0123456789",
      email: "test@provider.com",
      location: "Paris",
    };

    const response = await request(app)
      .post("/api/providers")
      .send(newProvider);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("name", "Test Provider");
  });

  test("POST /api/providers sans données doit retourner un 400", async () => {
    const response = await request(app)
      .post("/api/providers")
      .send({}); // Envoi vide pour simuler une erreur

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message");
  });

});

