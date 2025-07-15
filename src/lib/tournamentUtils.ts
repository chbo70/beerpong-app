export function generateRoundRobinGames(players: { id: string; name: string }[]) {
  const games = [];
  const playerIds = players.map((p) => p.id);

  const hasBye = playerIds.length % 2 !== 0;
  if (hasBye) playerIds.push("bye");

  const numPlayers = playerIds.length;
  const numRounds = numPlayers - 1;

  for (let round = 1; round <= numRounds; round++) {
    for (let i = 0; i < numPlayers / 2; i++) {
      const p1 = playerIds[i];
      const p2 = playerIds[numPlayers - 1 - i];

      if (p1 !== "bye" && p2 !== "bye") {
        games.push({
          game_number: games.length + 1,
          round: round,
          player1_id: p1,
          player2_id: p2,
          score1: 0,
          score2: 0,
          stats_player1: { bombs: 0, bouncers: 0, airballs: 0, islands: 0 },
          stats_player2: { bombs: 0, bouncers: 0, airballs: 0, islands: 0 },
          winner_id: null, // This will be mapped to 'winner' in the modal
        });
      }
    }

    // Rotate players except the first one
    const fixed = playerIds[0];
    const rest = playerIds.slice(1);
    const rotated = [fixed, rest[rest.length - 1], ...rest.slice(0, rest.length - 1)];
    playerIds.splice(0, playerIds.length, ...rotated);
  }

  return games;
}