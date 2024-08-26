import * as fal from "@fal-ai/serverless-client";

// Add this line near the top of the file
console.log("FAL_KEY:", process.env.FAL_KEY);

// Configure the fal client with the API key
fal.config({
  credentials: process.env.FAL_KEY,
});

export async function query(data: { inputs: string }): Promise<Blob> {
  // Remove or comment out this line
  // console.log("Sending request with data:", data);

  try {
    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: data.inputs,
        image_size: "landscape_4_3",
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
      },
      logs: false, // Change this to false to disable logging
      onQueueUpdate: (update) => {
        // Remove or comment out this block
        /*
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
        */
      },
    });

    // Assuming the first image in the result is the one we want
    const imageUrl = result.images[0].url;
    
    // Fetch the image as a Blob
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.blob();

  } catch (error) {
    // Change this to a more generic error message
    console.error("Error in image generation");
    throw error;
  }
}