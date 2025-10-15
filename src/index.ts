import { logger, type IAgentRuntime, type Project, type ProjectAgent } from '@elizaos/core';
import { character } from './character';
import sqlPlugin from '@elizaos/plugin-sql';
import bootstrapPlugin from './plugins/plugin-bootstrap/src/index.ts';
import openaiPlugin from '@elizaos/plugin-openai';
import cdpPlugin from './plugins/plugin-cdp/index.ts';

const initCharacter = ({ runtime }: { runtime: IAgentRuntime }) => {
  logger.info('Initializing character');
  logger.info({ name: character.name }, 'Character loaded:');
};

export const projectAgent: ProjectAgent = {
  character,
  init: async (runtime: IAgentRuntime) => await initCharacter({ runtime }),
  // Import actual plugin modules instead of using string names
  plugins: [sqlPlugin, bootstrapPlugin, openaiPlugin, cdpPlugin],
};

const project: Project = {
  agents: [projectAgent],
};

export { character } from './character';

export default project;

