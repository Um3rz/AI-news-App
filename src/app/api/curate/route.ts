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
      console.log(`No sources found for category ID: ${categoryId}`);
      return NextResponse.json(
        { message: `No sources found for category ID: ${categoryId}.` },
        { status: 404 }
      );
    }

    console.log(`Found ${sources.length} sources for category: ${sources[0].category.name}`);

    const curatedContent = await curateNews(sources);

    if (curatedContent) {
      console.log(`Curation successful for ${sources[0].category.name}, creating post...`);
      
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
        include: {
          category: true,
          sources: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      
      console.log(`Successfully created synthesized post with ID: ${post.id}`);

        return NextResponse.json({
        message: `Curation complete. Created 1 new synthesized post for ${sources[0].category.name}.`,
        post: post,
        success: true,
      });
    } else {
      console.log(`Curation failed for category: ${categoryId} (${sources[0].category.name})`);
      return NextResponse.json(
        {
          message: `Curation failed for ${sources[0].category.name}. The AI agent could not generate valid content from the sources.`,
          success: false,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('An error occurred during the curation process:', error);
    
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ 
      message: `Curation failed: ${errorMessage}`,
      success: false,
    }, { status: 500 });
  }
}