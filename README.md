# Interactive Room Decorator

Interactive Room Decorator is a Next.js application that allows users to upload room images, decorate them with art pieces, and generate new art using AI. Users can upload, place, resize, and frame art within their virtual room.

## Features

- Upload room images
- Upload and manage up to 4 art pieces
- Generate new art pieces using AI
- Drag and drop art pieces onto the room
- Resize and reposition art pieces
- Change frame colors for placed art
- Save decorated room as a JPG image
- Responsive design for various screen sizes

## Getting Started

### Prerequisites

- Node.js (version 14 or later)
- npm or yarn
- FAL AI API key

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/interactive-room-decorator.git
   cd interactive-room-decorator
   ```

2. Install dependencies:
   ```
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add your FAL AI API key:
   ```
   FAL_KEY=your_fal_ai_api_key_here
   ```

4. Run the development server:
   ```
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

1. Click "Upload room" to add a background image for your room.
2. Click "Upload art" to add up to 4 art pieces, or use the "Generate Image" feature to create new art.
3. Drag and drop art pieces from the sidebar onto the room.
4. Resize art pieces using the yellow handles that appear on hover.
5. Change frame colors using the dropdown menu.
6. Remove placed art by clicking the "X" button that appears on hover.
7. Click "Save room image" to download a JPG version of your decorated room.

## Technologies Used

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [html2canvas](https://html2canvas.hertzen.com/)
- [FAL AI](https://fal.ai/) for image generation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.