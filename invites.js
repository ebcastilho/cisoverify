const invites = [
    {
      code: "CISO-ROOT-001",
      used: false,
      expiresAt: new Date("2030-12-31")
    }
  ];
  
  function generateInvite(userId) {
    const code = "CISO-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    const invite = {
      code,
      used: false,
      expiresAt: new Date(Date.now() + 7 * 86400000),
      createdBy: userId
    };
    invites.push(invite);
    return invite;
  }
  
  function isValidInvite(code) {
    const invite = invites.find(i => i.code === code);
    return invite && !invite.used && invite.expiresAt > new Date();
  }
  
  function markInviteAsUsed(code) {
    const invite = invites.find(i => i.code === code);
    if (invite) invite.used = true;
  }
  
  module.exports = {
    generateInvite,
    isValidInvite,
    markInviteAsUsed
  };
  