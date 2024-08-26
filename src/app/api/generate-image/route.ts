import { NextResponse } from 'next/server';
import * as fal from "@fal-ai/serverless-client";

fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: prompt,
        image_size: "landscape_4_3",
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating image:", error);
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
  }
}