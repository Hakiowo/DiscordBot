const { INTERACTION_DEFINITIONS, INTERACTION_TYPES } = require("../../config/interactionTypes");
const { getInteractionGif } = require("../../services/reactionGifService");
const { recordInteraction } = require("../../systems/profiles/profileSystem");
const { createInteractionCommand } = require("./createInteractionCommand");

module.exports = createInteractionCommand(
  INTERACTION_DEFINITIONS[INTERACTION_TYPES.HANDHOLD],
  { getInteractionGif, recordInteraction }
);
