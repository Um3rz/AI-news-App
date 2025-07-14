import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { curateNews } from '@/lib/agent';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { categoryId } = body;

    if (!categoryId) {
      return NextResponse.json({ message: 'categoryId is required' }, { status: 400 });
    }

    console.log(`Starting curation for category: ${categoryId}`);
    const sources = await prisma.source.findMany({
      where: { categoryId },
      include: {
        category: true, 
      },
    });

    if (sources.length === 0) {
      return NextResponse.json(
        { message: `No sources found for category ID: ${categoryId}.` },
        { status: 404 }
      );
    }

    const curatedContent = await curateNews(sources);

    if (curatedContent) {
      const post = await prisma.post.create({
        data: {
          title: curatedContent.headline,
          summary: curatedContent.summary,
          urls: curatedContent.urls,
          categoryId: categoryId,
          sources: {
            connect: sources.map(source => ({ id: source.id })),
          },
        },
      });
      console.log(`Successfully created synthesized post with ID: ${post.id}`);

      return NextResponse.json({
        message: `Curation complete. Created 1 new synthesized post.`,
        post: post,
      });
    } else {
      console.log(`Failed to curate a synthesized story for category: ${categoryId}`);
      return NextResponse.json(
        {
          message: 'Curation process completed, but no new post was created.',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('An error occurred during the curation process:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}