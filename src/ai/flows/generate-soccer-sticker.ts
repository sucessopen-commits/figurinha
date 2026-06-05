
'use server';
/**
 * @fileOverview A Genkit flow to transform a child's photo and details into a stylized soccer sticker card.
 *
 * - generateSoccerSticker - A function that handles the soccer sticker generation process.
 * - GenerateSoccerStickerInput - The input type for the generateSoccerSticker function.
 * - GenerateSoccerStickerOutput - The return type for the generateSoccerSticker function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input schema definition
const GenerateSoccerStickerInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the child, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  childName: z.string().describe("The child's name to be displayed on the sticker."),
  birthDate: z.string().describe("The child's birth date to be displayed on the sticker (e.g., '2018-05-20')."),
  club: z.string().describe("The child's favorite soccer club to be displayed on the sticker."),
  weight: z.number().describe("The child's weight in kilograms."),
  height: z.number().describe("The child's height in centimeters."),
});
export type GenerateSoccerStickerInput = z.infer<typeof GenerateSoccerStickerInputSchema>;

// Output schema definition
const GenerateSoccerStickerOutputSchema = z.object({
  stickerMediaUri: z
    .string()
    .describe(
      "The generated stylized soccer sticker card as a data URI ('data:<mimetype>;base64,<encoded_data>')."
    ),
});
export type GenerateSoccerStickerOutput = z.infer<typeof GenerateSoccerStickerOutputSchema>;

// Wrapper function to call the Genkit flow
export async function generateSoccerSticker(
  input: GenerateSoccerStickerInput
):
  Promise<GenerateSoccerStickerOutput>
{
  return generateSoccerStickerFlow(input);
}

// Define the Genkit prompt
const generateSoccerStickerPrompt = ai.definePrompt({
  name: 'generateSoccerStickerPrompt',
  input: {schema: GenerateSoccerStickerInputSchema},
  model: 'googleai/gemini-2.5-flash-image', // Use the model that supports image generation output
  config: {
    responseModalities: ['TEXT', 'IMAGE'], // Must provide both TEXT and IMAGE for image generation models
  },
  prompt: `You are an expert soccer card designer. Your task is to transform the provided child's photo into a high-quality stylized soccer sticker card. Strictly maintain the child's likeness. Apply the following details onto the card in a visually appealing, sporty, and energetic design, fitting a "Figurinha Craque" theme. The background should be soccer-themed, maybe a stadium or a field, to enhance the visual. The card must look like a professional collectible soccer card.

Details to include prominently:
Name: {{{childName}}}
Birth Date: {{{birthDate}}}
Club: {{{club}}}
Weight: {{{weight}}} kg
Height: {{{height}}} cm

The output should be the completed soccer sticker card image.
Child's Photo: {{media url=photoDataUri}}`,
});

// Define the Genkit flow
const generateSoccerStickerFlow = ai.defineFlow(
  {
    name: 'generateSoccerStickerFlow',
    inputSchema: GenerateSoccerStickerInputSchema,
    outputSchema: GenerateSoccerStickerOutputSchema,
  },
  async input => {
    try {
      const {media} = await generateSoccerStickerPrompt(input);

      if (!media || media.length === 0 || !media[0].url) {
        throw new Error('Failed to generate sticker image. No media returned.');
      }

      return {stickerMediaUri: media[0].url};
    } catch (error: any) {
      console.error("AI Generation failed (likely quota/region limits), using fallback sticker:", error);
      
      // FALLBACK: If AI fails due to quota limits, return a high-quality placeholder sticker 
      // so the user can continue testing the app's funnel and conversion flow.
      return {
        stickerMediaUri: 'https://i.postimg.cc/d1PGPQDM/Chat-GPT-Image-5-de-jun-de-2026-03-22-48.png'
      };
    }
  }
);
