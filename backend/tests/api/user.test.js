const request = require("supertest");
const { app, server, closeDatabase } = require("../../../server");

// Fermer MongoDB et le serveur après tous les tests
afterAll(async () => {
  await closeDatabase();
  server.close();
});

describe("Tests des routes /api/users", () => {
  test("GET /api/users doit retourner 200 (accessible uniquement admin)", async () => {
    const response = await request(app).get("/api/users");
    expect(response.statusCode).toBe(200);
  });

  test("POST /api/users doit créer un nouvel utilisateur et retourner 201", async () => {
    const newUser = {
      name: "Test User",
      email: "testuser@example.com",
      password: "TestPassword123!",
      phoneNumber: "0123456789",
    };

    const response = await request(app)
      .post("/api/users")
      .send(newUser);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("user");
    expect(response.body.user).toHaveProperty("email", "testuser@example.com");
  });

  test("POST /api/users/login doit retourner un 200 et connecter un utilisateur", async () => {
    const userCredentials = {
      email: "testuser@example.com",
      password: "TestPassword123!",
    };

    const response = await request(app)
      .post("/api/users/login")
      .send(userCredentials);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("token");
  });
});

