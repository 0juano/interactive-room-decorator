import { NextResponse } from 'next/server';
import * as fal from "@fal-ai/serverless-client";

fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    console.log("Received prompt:", prompt); // Log the received prompt

    if (!process.env.FAL_KEY) {
      console.error("FAL_KEY is not set");
      return NextResponse.json({ error: 'FAL_KEY is not set' }, { status: 500 });
    }

    console.log("Calling fal.subscribe"); // Log before calling fal.subscribe
    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: prompt,
        image_size: "landscape_4_3",
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
      },
    });
    console.log("fal.subscribe result:", result); // Log the result

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating image:", error);
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
  }
}