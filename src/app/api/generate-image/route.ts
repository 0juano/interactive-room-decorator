import { NextResponse } from 'next/server';
import * as fal from "@fal-ai/serverless-client";

fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    // Remove or comment out this line
    // console.log("Received prompt:", prompt);

    if (!process.env.FAL_KEY) {
      console.error("FAL_KEY is not set");
      return NextResponse.json({ error: 'FAL_KEY is not set' }, { status: 500 });
    }

    // Remove or comment out this line
    // console.log("Calling fal.subscribe");
    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: prompt,
        image_size: "landscape_4_3",
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
      },
    });
    // Remove or comment out this line
    // console.log("fal.subscribe result:", result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in image generation");
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
  }
}