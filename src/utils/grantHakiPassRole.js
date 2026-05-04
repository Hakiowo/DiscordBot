const HAKI_PASS_ROLE_NAME = "HakiPass";

async function getOrCreateHakiPassRole(guild) {
  const existingRole = guild.roles.cache.find((role) => role.name === HAKI_PASS_ROLE_NAME);

  if (existingRole) {
    return existingRole;
  }

  return guild.roles.create({
    name: HAKI_PASS_ROLE_NAME,
    reason: "Rol automatico para usuarios que obtienen el HakiPass."
  });
}

async function grantHakiPassRole(interaction) {
  if (!interaction.guild || !interaction.member) {
    return {
      granted: false,
      reason: "no_guild"
    };
  }

  try {
    const role = await getOrCreateHakiPassRole(interaction.guild);
    const member = await interaction.guild.members.fetch(interaction.user.id);

    if (member.roles.cache.has(role.id)) {
      return {
        granted: true,
        alreadyHadRole: true,
        role
      };
    }

    await member.roles.add(role);

    return {
      granted: true,
      alreadyHadRole: false,
      role
    };
  } catch (error) {
    console.warn("No se pudo otorgar el rol HakiPass:", error.message);

    return {
      granted: false,
      reason: "role_error",
      error
    };
  }
}

module.exports = { HAKI_PASS_ROLE_NAME, grantHakiPassRole };
