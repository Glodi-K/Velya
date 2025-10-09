const request = require("supertest");
const { app, server, closeDatabase } = require("../../../server");

// Ferme MongoDB et le serveur après tous les tests
afterAll(async () => {
  await closeDatabase();
  server.close();
});

describe("Tests des routes /api/reservations", () => {
  test("GET /api/reservations doit retourner 200 (accessible uniquement admin)", async () => {
    const response = await request(app).get("/api/reservations");
    expect(response.statusCode).toBe(200);
  });

  test("POST /api/reservations doit retourner un 201 et créer une réservation", async () => {
    const newReservation = {
      user: "66212a1127cbd4da5df51abc", // remplace par un ID valide
      provider: "66212a1127cbd4da5df51def", // idem
      date: new Date().toISOString(),
      service: "Nettoyage maison",
      location: "Montréal",
      validationPin: "123456",
      categorie: "Nettoyage maison",
      prixTotal: 60,
      partPrestataire: 48,
      partPlateforme: 12,
      status: "confirmed"
    };

    const response = await request(app)
      .post("/api/reservations")
      .send(newReservation);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("reservation");
    expect(response.body.reservation).toHaveProperty("service", "Nettoyage maison");
  });
});

