let connections = [];

function addConnection(fromUserId, toUserId) {
  const exists = connections.find(
    c => c.from === fromUserId && c.to === toUserId
  );

  if (!exists) {
    connections.push({
      from: fromUserId,
      to: toUserId,
      createdAt: new Date()
    });
  }
}

function getConnections(userId) {
  return connections.filter(c => c.from === userId);
}

module.exports = {
  addConnection,
  getConnections
};
