const { calculatePrice } = require('./calculatePrice');

describe("calculatePrice", () => {
  it("devrait calculer le prix pour une surface standard", () => {
    const res = calculatePrice({
      surface: 50,
      typeService: "standard",
      niveauSale: "propre",
      options: {},
    });

    expect(res).not.toBeNull();
    expect(res.total).toBeGreaterThan(0);
    expect(res.provider).toBeGreaterThan(0);
    expect(res.platform).toBeGreaterThan(0);
  });

  it("devrait majorer le prix pour un niveau de saleté élevé", () => {
    const res1 = calculatePrice({
      surface: 50,
      typeService: "standard",
      niveauSale: "propre",
      options: {},
    });

    const res2 = calculatePrice({
      surface: 50,
      typeService: "standard",
      niveauSale: "tres_sale",
      options: {},
    });

    expect(res2.total).toBeGreaterThan(res1.total);
  });

  it("devrait ajouter le prix des options sélectionnées", () => {
    const res = calculatePrice({
      surface: 30,
      typeService: "standard",
      niveauSale: "sale",
      options: {
        animaux: true,
        vitres: true,
      },
    });

    expect(res.total).toBeGreaterThan(0);
    expect(res.provider).toBeGreaterThan(0);
  });
});

