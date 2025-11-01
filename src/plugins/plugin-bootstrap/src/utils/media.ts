import {
  ContentType,
  getLocalServerUrl,
  imageDescriptionTemplate,
  ModelType,
  parseKeyValueXml,
  type IAgentRuntime,
  type Media,
} from '@elizaos/core';

export type MediaData = {
  data: Buffer;
  mediaType: string;
};

export async function fetchMediaData(attachments: Media[]): Promise<MediaData[]> {
  return Promise.all(
    attachments.map(async (attachment: Media) => {
      if (/^(http|https):\/\//.test(attachment.url)) {
        const response = await fetch(attachment.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${attachment.url}`);
        }
        const mediaBuffer = Buffer.from(await response.arrayBuffer());
        const mediaType = attachment.contentType || 'image/png';
        return { data: mediaBuffer, mediaType };
      }

      throw new Error(`File not found: ${attachment.url}. Make sure the path is correct.`);
    })
  );
}

export async function processAttachments(
  attachments: Media[],
  runtime: IAgentRuntime
): Promise<Media[]> {
  if (!attachments || attachments.length === 0) {
    return [];
  }
  runtime.logger.debug(`[Bootstrap] Processing ${attachments.length} attachment(s)`);

  const processedAttachments: Media[] = [];

  for (const attachment of attachments) {
    try {
      const processedAttachment: Media = { ...attachment };

      const isRemote = /^(http|https):\/\//.test(attachment.url);
      const url = isRemote ? attachment.url : getLocalServerUrl(attachment.url);

      if (attachment.contentType === ContentType.IMAGE && !attachment.description) {
        runtime.logger.debug(`[Bootstrap] Generating description for image: ${attachment.url}`);

        let imageUrl = url;

        if (!isRemote) {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);

          const arrayBuffer = await res.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const contentType = res.headers.get('content-type') || 'application/octet-stream';
          imageUrl = `data:${contentType};base64,${buffer.toString('base64')}`;
        }

        try {
          const response = await runtime.useModel(ModelType.IMAGE_DESCRIPTION, {
            prompt: imageDescriptionTemplate,
            imageUrl,
          });

          if (typeof response === 'string') {
            const parsedXml = parseKeyValueXml(response);

            if (parsedXml && (parsedXml.description || parsedXml.text)) {
              processedAttachment.description = parsedXml.description || '';
              processedAttachment.title = parsedXml.title || 'Image';
              processedAttachment.text = parsedXml.text || parsedXml.description || '';

              runtime.logger.debug(
                `[Bootstrap] Generated description: ${processedAttachment.description?.substring(0, 100)}...`
              );
            } else {
              const responseStr = response as string;
              const titleMatch = responseStr.match(/<title>([^<]+)<\/title>/);
              const descMatch = responseStr.match(/<description>([^<]+)<\/description>/);
              const textMatch = responseStr.match(/<text>([^<]+)<\/text>/);

              if (titleMatch || descMatch || textMatch) {
                processedAttachment.title = titleMatch?.[1] || 'Image';
                processedAttachment.description = descMatch?.[1] || '';
                processedAttachment.text = textMatch?.[1] || descMatch?.[1] || '';

                runtime.logger.debug(
                  `[Bootstrap] Used fallback XML parsing - description: ${processedAttachment.description?.substring(0, 100)}...`
                );
              } else {
                runtime.logger.warn(`[Bootstrap] Failed to parse XML response for image description`);
              }
            }
          } else if (response && typeof response === 'object' && 'description' in response) {
            processedAttachment.description = response.description as string;
            processedAttachment.title = (response as { title?: string }).title || 'Image';
            processedAttachment.text = response.description as string;

            runtime.logger.debug(
              `[Bootstrap] Generated description: ${processedAttachment.description?.substring(0, 100)}...`
            );
          } else {
            runtime.logger.warn(`[Bootstrap] Unexpected response format for image description`);
          }
        } catch (error) {
          runtime.logger.error({ error }, `[Bootstrap] Error generating image description:`);
        }
      } else if (attachment.contentType === ContentType.DOCUMENT && !attachment.text) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch document: ${res.statusText}`);

        const contentType = res.headers.get('content-type') || '';
        const isPlainText = contentType.startsWith('text/plain');

        if (isPlainText) {
          runtime.logger.debug(`[Bootstrap] Processing plain text document: ${attachment.url}`);

          const textContent = await res.text();
          processedAttachment.text = textContent;
          processedAttachment.title = processedAttachment.title || 'Text File';

          runtime.logger.debug(
            `[Bootstrap] Extracted text content (first 100 chars): ${processedAttachment.text?.substring(0, 100)}...`
          );
        } else {
          runtime.logger.warn(`[Bootstrap] Skipping non-plain-text document: ${contentType}`);
        }
      }

      processedAttachments.push(processedAttachment);
    } catch (error) {
      runtime.logger.error(
        { error, attachmentUrl: attachment.url },
        `[Bootstrap] Failed to process attachment ${attachment.url}:`
      );
      processedAttachments.push(attachment);
    }
  }

  return processedAttachments;
}

