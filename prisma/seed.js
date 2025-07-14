"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Start seeding...');
    // 1. Clear existing data
    await prisma.post.deleteMany();
    await prisma.source.deleteMany();
    await prisma.user.deleteMany();
    await prisma.category.deleteMany();
    console.log('Cleared previous data.');
    // 2. Create Categories
    const f1Category = await prisma.category.create({
        data: { name: 'F1' },
    });
    const politicsCategory = await prisma.category.create({
        data: { name: 'US Politics' },
    });
    const footballCategory = await prisma.category.create({
        data: { name: 'Football' },
    });
    console.log('Created categories.');
    // 3. Create a User and connect their interests
    await prisma.user.create({
        data: {
            email: 'testuser@example.com',
            name: 'Test User',
            interestedCategories: {
                connect: [
                    { id: f1Category.id },
                    { id: politicsCategory.id },
                    { id: footballCategory.id },
                ],
            },
        },
    });
    console.log('Created user and set interests.');
    // 4. Create Sources for each Category
    // F1 Sources
    const motorsportSource = await prisma.source.create({
        data: { name: 'Motorsport.com', url: 'https://www.motorsport.com/f1/', categoryId: f1Category.id },
    });
    const autosportSource = await prisma.source.create({
        data: { name: 'Autosport', url: 'https://www.autosport.com/f1', categoryId: f1Category.id },
    });
    // US Politics Sources
    const cnnSource = await prisma.source.create({
        data: { name: 'CNN Politics', url: 'https://www.cnn.com/politics', categoryId: politicsCategory.id },
    });
    const foxSource = await prisma.source.create({
        data: { name: 'Fox News Politics', url: 'https://www.foxnews.com/politics', categoryId: politicsCategory.id },
    });
    // Football Sources
    const espnSource = await prisma.source.create({
        data: { name: 'ESPN FC', url: 'https://www.espn.com/soccer/', categoryId: footballCategory.id },
    });
    const goalSource = await prisma.source.create({
        data: { name: 'Goal.com', url: 'https://www.goal.com/en', categoryId: footballCategory.id },
    });
    console.log('Created sources.');
    // 5. Create a dummy Post for each Category
    // F1 Post
    await prisma.post.create({
        data: {
            title: 'Hamilton Wins Thrilling Grand Prix',
            summary: 'In a stunning display of skill, Lewis Hamilton clinched victory at the final lap, overtaking his rival in a dramatic finish.',
            urls: ['https://www.motorsport.com/f1/news/hamilton-wins-thriller/1055123'],
            categoryId: f1Category.id,
            sources: {
                connect: [{ id: motorsportSource.id }],
            },
        },
    });
    // US Politics Post
    await prisma.post.create({
        data: {
            title: 'New Bill Passes Senate Floor',
            summary: 'A landmark infrastructure bill passed the Senate today with bipartisan support, promising significant investment in national projects.',
            urls: ['https://www.cnn.com/2024/11/05/politics/senate-infrastructure-bill/index.html'],
            categoryId: politicsCategory.id,
            sources: {
                connect: [{ id: cnnSource.id }],
            },
        },
    });
    // Football Post
    await prisma.post.create({
        data: {
            title: 'Real Madrid Signs Star Forward',
            summary: 'In a blockbuster transfer, Real Madrid has officially announced the signing of star forward Kylian Mbappé on a five-year deal.',
            urls: ['https://www.espn.com/soccer/story/_/id/39478493/real-madrid-signs-kylian-mbappe'],
            categoryId: footballCategory.id,
            sources: {
                connect: [{ id: espnSource.id }],
            },
        },
    });
    console.log('Created dummy posts.');
    console.log('Seeding finished.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
