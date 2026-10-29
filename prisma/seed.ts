import { PrismaClient, Role, SubscriptionStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Sembrando TapMenu...");

  await prisma.payment.deleteMany();
  await prisma.staffAlert.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.sessionDiner.deleteMany();
  await prisma.tableSession.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.category.deleteMany();
  await prisma.table.deleteMany();
  await prisma.user.deleteMany();
  await prisma.restaurant.deleteMany();

  const password = await hash("tapmenu123", 10);

  const superAdmin = await prisma.user.create({
    data: {
      email: "jhon@tapmenu.co",
      name: "Jhon Fuentes",
      passwordHash: password,
      role: Role.SUPER_ADMIN,
    },
  });

  const resto = await prisma.restaurant.create({
    data: {
      name: "Resto Demo",
      slug: "resto-demo",
      description:
        "Cocina del Magdalena a orillas del río. Sabores costeños en El Banco.",
      address: "Calle 6 # 5-20, Centro",
      city: "El Banco",
      department: "Magdalena",
      phone: "+57 300 000 0000",
      primaryColor: "#0B6E4F",
      accentColor: "#E85D04",
      subscriptionStatus: SubscriptionStatus.ACTIVA,
      logoUrl: null,
    },
  });

  const owner = await prisma.user.create({
    data: {
      email: "owner@restodemo.co",
      name: "Ana Dueña",
      passwordHash: password,
      role: Role.OWNER,
      restaurantId: resto.id,
    },
  });

  await prisma.user.create({
    data: {
      email: "cocina@restodemo.co",
      name: "Carlos Cocina",
      passwordHash: password,
      role: Role.COCINA,
      restaurantId: resto.id,
    },
  });

  await prisma.user.create({
    data: {
      email: "mesero@restodemo.co",
      name: "María Mesera",
      passwordHash: password,
      role: Role.MESERO,
      restaurantId: resto.id,
    },
  });

  const tables = await Promise.all(
    [1, 2, 3, 4, 5, 6].map((n) =>
      prisma.table.create({
        data: {
          restaurantId: resto.id,
          code: `t${n}`,
          label: `Mesa ${n}`,
        },
      })
    )
  );

  const cats = await Promise.all(
    [
      { name: "Entradas", sortOrder: 1 },
      { name: "Platos fuertes", sortOrder: 2 },
      { name: "Pescados y mariscos", sortOrder: 3 },
      { name: "Bebidas", sortOrder: 4 },
      { name: "Postres", sortOrder: 5 },
    ].map((c) =>
      prisma.category.create({
        data: { ...c, restaurantId: resto.id },
      })
    )
  );

  const [entradas, fuertes, pescados, bebidas, postres] = cats;

  const dishData = [
    {
      categoryId: entradas.id,
      name: "Patacones con hogao",
      description: "Plátano verde frito con hogao costeño y queso costeño.",
      priceCops: 12000,
      imageUrl:
        "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&q=80",
    },
    {
      categoryId: entradas.id,
      name: "Arepa de huevo",
      description: "Clásica arepa frita rellena de huevo. Dos unidades.",
      priceCops: 8000,
      imageUrl:
        "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=80",
    },
    {
      categoryId: entradas.id,
      name: "Empanadas de carne (3 und)",
      description: "Masa de maíz, carne desmechada y ají.",
      priceCops: 9000,
      imageUrl:
        "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80",
    },
    {
      categoryId: fuertes.id,
      name: "Bandeja paisa costeña",
      description:
        "Arroz, frijoles, carne, chicharrón, huevo, aguacate y arepa.",
      priceCops: 28000,
      imageUrl:
        "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80",
      modelGlbUrl: "/models/avocado.glb",
    },
    {
      categoryId: fuertes.id,
      name: "Sancocho de gallina",
      description: "Caldo tradicional con yuca, plátano, mazorca y cilantro.",
      priceCops: 22000,
      imageUrl:
        "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80",
    },
    {
      categoryId: fuertes.id,
      name: "Mondongo",
      description: "Guiso de callo con verduras y especias de la casa.",
      priceCops: 20000,
      imageUrl:
        "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&q=80",
    },
    {
      categoryId: fuertes.id,
      name: "Carne asada con yuca",
      description: "Punta de anca a la parrilla, yuca frita y ensalada.",
      priceCops: 26000,
      imageUrl:
        "https://images.unsplash.com/photo-1558030006-450675292062?w=800&q=80",
    },
    {
      categoryId: fuertes.id,
      name: "Churrasco",
      description: "Corte premium a la brasa con chimichurri.",
      priceCops: 35000,
      imageUrl:
        "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80",
      soldOut: true,
    },
    {
      categoryId: pescados.id,
      name: "Mojarra frita",
      description: "Mojarra entera crocante con patacones y ensalada.",
      priceCops: 32000,
      imageUrl:
        "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80",
      modelGlbUrl: "/models/duck.glb",
    },
    {
      categoryId: pescados.id,
      name: "Bagre a la plancha",
      description: "Filete de bagre del Magdalena con arroz de coco.",
      priceCops: 30000,
      imageUrl:
        "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80",
    },
    {
      categoryId: pescados.id,
      name: "Cazuela de mariscos",
      description: "Camarón, calamari y pescado en salsa de coco.",
      priceCops: 38000,
      imageUrl:
        "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80",
    },
    {
      categoryId: pescados.id,
      name: "Camarones al ajillo",
      description: "Salteados en ajo, mantequilla y limón.",
      priceCops: 34000,
      imageUrl:
        "https://images.unsplash.com/photo-1565680018434-b513d5ea5fc3?w=800&q=80",
    },
    {
      categoryId: bebidas.id,
      name: "Limonada de coco",
      description: "Refrescante, natural, jarra personal.",
      priceCops: 8000,
      imageUrl:
        "https://images.unsplash.com/photo-1523677011780-c68ee4037693?w=800&q=80",
    },
    {
      categoryId: bebidas.id,
      name: "Jugo de corozo",
      description: "Fruto típico del Caribe colombiano.",
      priceCops: 7000,
      imageUrl:
        "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=800&q=80",
    },
    {
      categoryId: bebidas.id,
      name: "Cerveza nacional",
      description: "Botella 330 ml fría.",
      priceCops: 6000,
      imageUrl:
        "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&q=80",
    },
    {
      categoryId: bebidas.id,
      name: "Agua embotellada",
      description: "600 ml sin gas.",
      priceCops: 3500,
      imageUrl:
        "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800&q=80",
    },
    {
      categoryId: bebidas.id,
      name: "Café tinto",
      description: "Café colombiano de la casa.",
      priceCops: 3000,
      imageUrl:
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80",
    },
    {
      categoryId: postres.id,
      name: "Tres leches",
      description: "Porción individual bañada en tres leches.",
      priceCops: 10000,
      imageUrl:
        "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&q=80",
    },
    {
      categoryId: postres.id,
      name: "Flan de coco",
      description: "Receta familiar con coco rallado.",
      priceCops: 9000,
      imageUrl:
        "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80",
    },
    {
      categoryId: postres.id,
      name: "Bocadillo con queso",
      description: "Bocadillo veleño y queso costeño.",
      priceCops: 7000,
      imageUrl:
        "https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800&q=80",
    },
  ];

  for (let i = 0; i < dishData.length; i++) {
    const d = dishData[i];
    await prisma.dish.create({
      data: {
        restaurantId: resto.id,
        categoryId: d.categoryId,
        name: d.name,
        description: d.description,
        priceCops: d.priceCops,
        imageUrl: d.imageUrl,
        modelGlbUrl: "modelGlbUrl" in d ? (d as { modelGlbUrl?: string }).modelGlbUrl : undefined,
        soldOut: "soldOut" in d ? Boolean((d as { soldOut?: boolean }).soldOut) : false,
        sortOrder: i,
      },
    });
  }

  console.log("✅ Seed listo");
  console.log({
    superAdmin: superAdmin.email,
    owner: owner.email,
    password: "tapmenu123",
    restaurant: resto.slug,
    tables: tables.map((t) => t.code),
    demoUrl: `/r/${resto.slug}/m/t1`,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
