import Anthropic from '@anthropic-ai/sdk';

export interface BusinessData {
  name: string;
  description: string;
  cuisine: string;
  address: string;
  phone: string;
  email: string;
  openingHours: string;
  logoUrl: string;
}

export interface GeneratedFile {
  path: string;
  content: string;
}

export class AnthropicIntegration {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generateSiteCode(
    businessData: BusinessData
  ): Promise<GeneratedFile[]> {
    try {
      const prompt = `You are an expert Next.js developer. Generate a complete, modern restaurant/business landing page as a Next.js App Router project.

Business Information:
- Name: ${businessData.name}
- Description: ${businessData.description}
- Cuisine: ${businessData.cuisine}
- Address: ${businessData.address}
- Phone: ${businessData.phone}
- Email: ${businessData.email}
- Opening Hours: ${businessData.openingHours}
- Logo URL: ${businessData.logoUrl}

Generate a modern, responsive landing page with the following sections:
1. **Hero Section** - Full-width hero with business name, tagline, and CTA button
2. **About Section** - Business description and story
3. **Menu Highlights** - Featured dishes/items with descriptions and prices (generate realistic sample items based on the cuisine type)
4. **Contact Section** - Address, phone, email, opening hours, and an embedded map placeholder
5. **Footer** - Links, social media placeholders, copyright

Requirements:
- Use Next.js App Router (app/ directory)
- Use Tailwind CSS for styling
- Make it fully responsive (mobile-first)
- Use modern design patterns (gradients, shadows, rounded corners)
- Include smooth scroll navigation
- Use semantic HTML
- Include proper meta tags and SEO

Return your response as a JSON array of file objects, where each object has "path" (relative to project root) and "content" (the file contents). Include at minimum:
- app/layout.tsx
- app/page.tsx
- app/globals.css
- tailwind.config.ts
- package.json
- next.config.js
- tsconfig.json

IMPORTANT: Return ONLY the JSON array, no markdown code fences or other text.`;

      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Extract text content from the response
      const textBlock = message.content.find(
        (block: { type: string }) => block.type === 'text'
      );
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('No text content in Anthropic response');
      }

      const responseText = textBlock.text.trim();

      // Try to parse as JSON, handling potential markdown code fences
      let jsonText = responseText;
      const jsonMatch = responseText.match(
        /```(?:json)?\s*([\s\S]*?)```/
      );
      if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
      }

      const files: GeneratedFile[] = JSON.parse(jsonText);

      // Validate the structure
      if (!Array.isArray(files)) {
        throw new Error('Expected an array of files from Anthropic');
      }

      for (const file of files) {
        if (
          typeof file.path !== 'string' ||
          typeof file.content !== 'string'
        ) {
          throw new Error(
            'Each file must have a "path" and "content" string property'
          );
        }
      }

      return files;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate site code: ${message}`);
    }
  }
}

export function createAnthropicClient(
  apiKey: string
): AnthropicIntegration {
  return new AnthropicIntegration(apiKey);
}
