import { createPlayerForTesting } from '../../TestUtils';
import {
  GAME_FULL_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  INVALID_MOVE_MESSAGE,
  MOVE_NOT_YOUR_TURN_MESSAGE,
  PLAYER_ALREADY_IN_GAME_MESSAGE,
  PLAYER_NOT_IN_GAME_MESSAGE,
} from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';
import { GameMove } from '../../types/CoveyTownSocket';
import QuantumTicTacToeGame from './QuantumTicTacToeGame';

describe('QuantumTicTacToeGame', () => {
  let game: QuantumTicTacToeGame;
  let player1: Player;
  let player2: Player;

  beforeEach(() => {
    game = new QuantumTicTacToeGame();
    player1 = createPlayerForTesting();
    player2 = createPlayerForTesting();
  });

  describe('_join', () => {
    it('should throw an error if the player is already in the game', () => {
      game.join(player1);
      expect(() => game.join(player1)).toThrowError(PLAYER_ALREADY_IN_GAME_MESSAGE);
      game.join(player2);
      expect(() => game.join(player2)).toThrowError(PLAYER_ALREADY_IN_GAME_MESSAGE);
    });
    it('should throw an error if the game is full', () => {
      const player3 = createPlayerForTesting();
      game.join(player1);
      game.join(player2);

      expect(() => game.join(player3)).toThrowError(GAME_FULL_MESSAGE);
    });
    describe('When the player can be added', () => {
      it('makes the first player X and initializes the state with status WAITING_TO_START', () => {
        game.join(player1);
        expect(game.state.x).toEqual(player1.id);
        expect(game.state.o).toBeUndefined();
        expect(game.state.moves).toHaveLength(0);
        expect(game.state.status).toEqual('WAITING_TO_START');
        expect(game.state.winner).toBeUndefined();
      });
      describe('When the second player joins', () => {
        beforeEach(() => {
          game.join(player1);
          game.join(player2);
        });
        it('makes the second player O', () => {
          expect(game.state.x).toEqual(player1.id);
          expect(game.state.o).toEqual(player2.id);
        });
        it('sets the game status to IN_PROGRESS', () => {
          expect(game.state.status).toEqual('IN_PROGRESS');
          expect(game.state.winner).toBeUndefined();
          expect(game.state.moves).toHaveLength(0);
        });
      });
    });
  });

  describe('_leave', () => {
    it('should throw an error if the player is not in the game', () => {
      expect(() => game.leave(player1)).toThrowError(PLAYER_NOT_IN_GAME_MESSAGE);
      game.join(player1);
      expect(() => game.leave(player2)).toThrowError(PLAYER_NOT_IN_GAME_MESSAGE);
    });
    describe('when the player is in the game', () => {
      describe('when the game is in progress, it should set the game status to OVER and declare the other player the winner', () => {
        test('when x leaves', () => {
          game.join(player1);
          game.join(player2);
          expect(game.state.x).toEqual(player1.id);
          expect(game.state.o).toEqual(player2.id);

          game.leave(player1);

          expect(game.state.status).toEqual('OVER');
          expect(game.state.winner).toEqual(player2.id);
          expect(game.state.moves).toHaveLength(0);

          expect(game.state.x).toEqual(player1.id);
          expect(game.state.o).toEqual(player2.id);
        });
        test('when o leaves', () => {
          game.join(player1);
          game.join(player2);
          expect(game.state.x).toEqual(player1.id);
          expect(game.state.o).toEqual(player2.id);

          game.leave(player2);

          expect(game.state.status).toEqual('OVER');
          expect(game.state.winner).toEqual(player1.id);
          expect(game.state.moves).toHaveLength(0);

          expect(game.state.x).toEqual(player1.id);
          expect(game.state.o).toEqual(player2.id);
        });
      });
      it('when the game is not in progress, it should set the game status to WAITING_TO_START and remove the player', () => {
        game.join(player1);
        expect(game.state.x).toEqual(player1.id);
        expect(game.state.o).toBeUndefined();
        expect(game.state.status).toEqual('WAITING_TO_START');
        expect(game.state.winner).toBeUndefined();
        game.leave(player1);
        expect(game.state.x).toBeUndefined();
        expect(game.state.o).toBeUndefined();
        expect(game.state.status).toEqual('WAITING_TO_START');
        expect(game.state.winner).toBeUndefined();
      });
    });
  });

  describe('applyMove', () => {
    beforeEach(() => {
      game.join(player1);
      game.join(player2);
    });

    const makeMove = (player: Player, board: 'A' | 'B' | 'C', row: 0 | 1 | 2, col: 0 | 1 | 2) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const move: GameMove<any> = {
        playerID: player.id,
        gameID: game.id,
        move: {
          board,
          row,
          col,
          gamePiece: player === player1 ? 'X' : 'O',
        },
      };
      game.applyMove(move);
    };

    it('should place a piece on an empty square', () => {
      makeMove(player1, 'A', 0, 0);
      // @ts-expect-error - private property
      expect(game._games.A._board[0][0]).toBe('X');
      expect(game.state.moves.length).toBe(1);
    });

    describe('scoring and game end', () => {
      it('should award a point to X when X gets three in a row', () => {
        // X gets a win on board A
        makeMove(player1, 'A', 0, 0); // X
        makeMove(player2, 'B', 0, 0); // O
        makeMove(player1, 'A', 0, 1); // X
        makeMove(player2, 'B', 0, 1); // O
        makeMove(player1, 'A', 0, 2); // X -> scores 1 point

        expect(game.state.xScore).toBe(1);
        expect(game.state.oScore).toBe(0);
      });

      it('should award a point to O when O gets three in a row', () => {
        // X gets a win on board A
        makeMove(player1, 'A', 0, 0); // X
        makeMove(player2, 'B', 0, 0); // O
        makeMove(player1, 'A', 0, 1); // X
        makeMove(player2, 'B', 0, 1); // O
        makeMove(player1, 'A', 1, 1); // X
        makeMove(player2, 'B', 0, 2); // O -> scores 1 point

        expect(game.state.xScore).toBe(0);
        expect(game.state.oScore).toBe(1);
      });

      it('should error if it is not the turn of player 1', () => {
        makeMove(player1, 'A', 0, 0);
        makeMove(player2, 'A', 0, 0);
        makeMove(player1, 'A', 0, 1);
        expect(() => makeMove(player1, 'A', 0, 2)).toThrowError(MOVE_NOT_YOUR_TURN_MESSAGE);
      });
      it('should error if it is not the turn of player 2', () => {
        makeMove(player1, 'A', 0, 0);
        makeMove(player2, 'A', 0, 0);
        expect(() => makeMove(player2, 'A', 0, 1)).toThrowError(MOVE_NOT_YOUR_TURN_MESSAGE);
      });

      it('should throw an error if a player tries to play on their own piece', () => {
        makeMove(player1, 'A', 0, 0);
        makeMove(player2, 'A', 0, 1);
        expect(() => makeMove(player1, 'A', 0, 0)).toThrowError(INVALID_MOVE_MESSAGE);
      });

      it('should handle a collision by losing the turn of the second player', () => {
        makeMove(player1, 'A', 0, 0);
        makeMove(player2, 'A', 0, 0);
        // @ts-expect-error - private property
        expect(game._games.A._board[0][0]).toBe('X');
        expect(game.state.moves.length).toBe(2);
      });

      it('should make a square publicly visible on collision', () => {
        makeMove(player1, 'A', 0, 0);
        makeMove(player2, 'A', 0, 0);
        expect(game.state.publiclyVisible.A[0][0]).toBe(true);
      });

      it('should not allow moves on a board that has been won', () => {
        makeMove(player1, 'A', 0, 0); // X
        makeMove(player2, 'B', 0, 0); // O
        makeMove(player1, 'A', 0, 1); // X
        makeMove(player2, 'B', 0, 1); // O
        makeMove(player1, 'A', 0, 2); // X -> scores 1 point

        expect(() => makeMove(player2, 'A', 2, 2)).toThrowError(INVALID_MOVE_MESSAGE);
      });

      it('should not repeatedly increment scores', () => {
        // X gets a win on board A
        makeMove(player1, 'A', 0, 0); // X
        makeMove(player2, 'B', 0, 0); // O
        makeMove(player1, 'A', 0, 1); // X
        makeMove(player2, 'B', 0, 1); // O
        makeMove(player1, 'A', 0, 2); // X -> scores 1 point

        expect(game.state.xScore).toBe(1);
        expect(game.state.oScore).toBe(0);

        makeMove(player2, 'B', 0, 2); // O -> scores 1 point

        expect(game.state.xScore).toBe(1);
        expect(game.state.oScore).toBe(1);

        makeMove(player1, 'C', 0, 0);

        expect(game.state.xScore).toBe(1);
        expect(game.state.oScore).toBe(1);
      });

      it('should end the game when all boards are full or won (tie)', () => {
        // fill board A
        makeMove(player1, 'A', 0, 1);
        makeMove(player2, 'A', 0, 0);
        makeMove(player1, 'A', 0, 2);
        makeMove(player2, 'A', 1, 1);
        makeMove(player1, 'A', 1, 0);
        makeMove(player2, 'A', 1, 2);
        makeMove(player1, 'A', 2, 0);
        makeMove(player2, 'A', 2, 1);
        makeMove(player1, 'A', 2, 2);

        expect(game.state.status).toBe('IN_PROGRESS');

        // have player 2 beat board B, player 1 beat board C
        makeMove(player2, 'B', 0, 0);
        makeMove(player1, 'C', 0, 0);
        makeMove(player2, 'B', 0, 1);
        makeMove(player1, 'C', 0, 1);
        makeMove(player2, 'B', 0, 2); // player 2 wins board 2
        expect(game.state.status).toBe('IN_PROGRESS');
        makeMove(player1, 'C', 0, 2); // player 1 wins board 3

        expect(game.state.status).toBe('OVER');
        expect(game.state.winner === undefined);
      });

      it('should end the game when all boards are full or won (O wins)', () => {
        // fill board A
        makeMove(player1, 'A', 0, 1);
        makeMove(player2, 'A', 0, 0);
        makeMove(player1, 'A', 0, 2);
        makeMove(player2, 'A', 1, 1);
        makeMove(player1, 'A', 1, 0);
        makeMove(player2, 'A', 1, 2);
        makeMove(player1, 'A', 2, 0);
        makeMove(player2, 'A', 2, 1);
        makeMove(player1, 'A', 2, 2);

        expect(game.state.status).toBe('IN_PROGRESS');

        // have player 2 beat board B
        makeMove(player2, 'B', 0, 0);
        makeMove(player1, 'B', 1, 0);
        makeMove(player2, 'B', 0, 1);
        makeMove(player1, 'B', 1, 1);
        makeMove(player2, 'B', 0, 2); // player 2 wins board 2

        expect(game.state.status).toBe('IN_PROGRESS');

        // and board C
        makeMove(player1, 'C', 0, 0);
        makeMove(player2, 'C', 1, 0);
        makeMove(player1, 'C', 2, 1);
        makeMove(player2, 'C', 1, 1);
        makeMove(player1, 'C', 2, 2); // player 2 wins board 2
        makeMove(player2, 'C', 1, 2);

        expect(game.state.status).toBe('OVER');
        expect(game.state.winner === player2.id);
      });

      it('should end the game when all boards are full or won (X wins)', () => {
        // fill board A
        makeMove(player1, 'A', 0, 1);
        makeMove(player2, 'A', 0, 0);
        makeMove(player1, 'A', 0, 2);
        makeMove(player2, 'A', 1, 1);
        makeMove(player1, 'A', 1, 0);
        makeMove(player2, 'A', 1, 2);
        makeMove(player1, 'A', 2, 0);
        makeMove(player2, 'A', 2, 1);
        makeMove(player1, 'A', 2, 2);

        expect(game.state.status).toBe('IN_PROGRESS');

        // have player 1 beat board B
        makeMove(player2, 'B', 0, 0);
        makeMove(player1, 'B', 1, 0);
        makeMove(player2, 'B', 0, 1);
        makeMove(player1, 'B', 1, 1);
        makeMove(player2, 'B', 2, 2); // player 2 wins board 2
        makeMove(player1, 'B', 1, 2);

        expect(game.state.status).toBe('IN_PROGRESS');

        // and board C
        makeMove(player2, 'C', 0, 0);
        makeMove(player1, 'C', 1, 0);
        makeMove(player2, 'C', 0, 1);
        makeMove(player1, 'C', 1, 1);
        makeMove(player2, 'C', 2, 2); // player 2 wins board 2
        makeMove(player1, 'C', 1, 2);

        expect(game.state.status).toBe('OVER');
        expect(game.state.winner === player1.id);
      });

      it('does not publish board on victory ', () => {
        // X gets a win on board A
        makeMove(player1, 'A', 0, 0); // X
        makeMove(player2, 'A', 0, 0); // O
        makeMove(player1, 'A', 0, 1); // X
        makeMove(player2, 'A', 0, 1); // O
        makeMove(player1, 'A', 0, 2); // X -> scores 1 point

        expect(game.state.publiclyVisible.A[0][0]).toBe(true);
        expect(game.state.publiclyVisible.A[0][1]).toBe(true);
        expect(game.state.publiclyVisible.A[0][2]).toBe(false);

        for (let row = 1; row <= 2; row++) {
          for (let col = 0; col <= 2; col++) {
            expect(game.state.publiclyVisible.A[row][col]).toBe(false);
          }
        }

        for (let row = 0; row <= 2; row++) {
          for (let col = 0; col <= 2; col++) {
            expect(game.state.publiclyVisible.B[row][col]).toBe(false);
            expect(game.state.publiclyVisible.C[row][col]).toBe(false);
          }
        }
      });

      it('should detect a - win for X', () => {
        // X gets a win on board A
        makeMove(player1, 'A', 0, 0); // X
        makeMove(player2, 'A', 0, 0); // O
        makeMove(player1, 'A', 0, 1); // X
        makeMove(player2, 'A', 0, 1); // O
        makeMove(player1, 'A', 0, 2); // X -> scores 1 point

        expect(game.state.xScore).toBe(1);
        expect(game.state.oScore).toBe(0);
      });

      it('should detect a | win for X', () => {
        // X gets a win on board A
        makeMove(player1, 'A', 0, 0); // X
        makeMove(player2, 'A', 0, 0); // O
        makeMove(player1, 'A', 1, 0); // X
        makeMove(player2, 'A', 1, 0); // O
        makeMove(player1, 'A', 2, 0); // X -> scores 1 point

        expect(game.state.xScore).toBe(1);
        expect(game.state.oScore).toBe(0);
      });

      it('should detect a \\ win for X', () => {
        // X gets a win on board A
        makeMove(player1, 'A', 0, 0); // X
        makeMove(player2, 'A', 0, 0); // O
        makeMove(player1, 'A', 1, 1); // X
        makeMove(player2, 'A', 1, 1); // O
        makeMove(player1, 'A', 2, 2); // X -> scores 1 point

        expect(game.state.xScore).toBe(1);
        expect(game.state.oScore).toBe(0);
      });

      it('should detect a / win for X', () => {
        // X gets a win on board A
        makeMove(player1, 'A', 2, 0); // X
        makeMove(player2, 'A', 2, 0); // O
        makeMove(player1, 'A', 1, 1); // X
        makeMove(player2, 'A', 1, 1); // O
        makeMove(player1, 'A', 0, 2); // X -> scores 1 point

        expect(game.state.xScore).toBe(1);
        expect(game.state.oScore).toBe(0);
      });

      it('should detect a - win for O', () => {
        // O gets a win on board A
        makeMove(player1, 'B', 0, 0); // X
        makeMove(player2, 'A', 0, 0); // O
        makeMove(player1, 'A', 0, 0); // X
        makeMove(player2, 'A', 0, 1); // O
        makeMove(player1, 'A', 0, 1); // X
        makeMove(player2, 'A', 0, 2); // O -> scores 1 point

        expect(game.state.xScore).toBe(0);
        expect(game.state.oScore).toBe(1);
      });

      it('should detect a | win for O', () => {
        // X gets a win on board A
        makeMove(player1, 'B', 0, 0); // X
        makeMove(player2, 'A', 0, 0); // O
        makeMove(player1, 'A', 0, 0); // X
        makeMove(player2, 'A', 1, 0); // O
        makeMove(player1, 'A', 1, 0); // X
        makeMove(player2, 'A', 2, 0); // O -> scores 1 point

        expect(game.state.xScore).toBe(0);
        expect(game.state.oScore).toBe(1);
      });

      it('should detect a \\ win for O', () => {
        // X gets a win on board A
        makeMove(player1, 'B', 0, 0); // X
        makeMove(player2, 'A', 0, 0); // O
        makeMove(player1, 'A', 0, 0); // X
        makeMove(player2, 'A', 1, 1); // O
        makeMove(player1, 'A', 1, 1); // X
        makeMove(player2, 'A', 2, 2); // O -> scores 1 point

        expect(game.state.xScore).toBe(0);
        expect(game.state.oScore).toBe(1);
      });

      it('should detect a / win for O', () => {
        // X gets a win on board A
        makeMove(player1, 'B', 0, 0); // X
        makeMove(player2, 'A', 2, 0); // O
        makeMove(player1, 'A', 2, 0); // X
        makeMove(player2, 'A', 1, 1); // O
        makeMove(player1, 'A', 1, 1); // X
        makeMove(player2, 'A', 0, 2); // O -> scores 1 point

        expect(game.state.xScore).toBe(0);
        expect(game.state.oScore).toBe(1);
      });
    });

    it('should throw an error if the game is not in progress', () => {
      game.leave(player2);
      expect(() => makeMove(player1, 'A', 0, 0)).toThrowError(GAME_NOT_IN_PROGRESS_MESSAGE);
    });

    it('should rely on the player ID to determine whose turn it is', () => {
      expect(() =>
        game.applyMove({
          gameID: game.id,
          playerID: player2.id,
          move: {
            board: 'A',
            row: 0,
            col: 0,
            gamePiece: 'X',
          },
        }),
      ).toThrowError(MOVE_NOT_YOUR_TURN_MESSAGE);

      expect(() =>
        game.applyMove({
          gameID: game.id,
          playerID: player1.id,
          move: {
            board: 'A',
            row: 0,
            col: 0,
            gamePiece: 'O',
          },
        }),
      ).not.toThrowError(MOVE_NOT_YOUR_TURN_MESSAGE);

      // @ts-expect-error - private property
      expect(game._games.A._board[0][0]).toBe('X');
    });

    it('should throw an error if the move is out of turn for the player ID', () => {
      expect(() =>
        game.applyMove({
          gameID: game.id,
          playerID: player2.id,
          move: {
            board: 'A',
            row: 0,
            col: 0,
            gamePiece: 'X',
          },
        }),
      ).toThrowError(MOVE_NOT_YOUR_TURN_MESSAGE);

      makeMove(player1, 'A', 0, 0);

      expect(() =>
        game.applyMove({
          gameID: game.id,
          playerID: player1.id,
          move: {
            board: 'A',
            row: 0,
            col: 1,
            gamePiece: 'O',
          },
        }),
      ).toThrowError(MOVE_NOT_YOUR_TURN_MESSAGE);

      makeMove(player2, 'A', 0, 2);

      expect(() =>
        game.applyMove({
          gameID: game.id,
          playerID: player2.id,
          move: {
            board: 'B',
            row: 0,
            col: 1,
            gamePiece: 'X',
          },
        }),
      ).toThrowError(MOVE_NOT_YOUR_TURN_MESSAGE);

      // @ts-expect-error - private property
      expect(game._games.A._board[0][0]).toBe('X');
    });

    it('should not change whose turn it is when an invalid move is made', () => {
      makeMove(player1, 'A', 0, 0);
      expect(() => makeMove(player1, 'A', 0, 1)).toThrowError(MOVE_NOT_YOUR_TURN_MESSAGE);
      expect(game.state.moves).toHaveLength(1);
      makeMove(player2, 'B', 0, 0);
      expect(game.state.moves).toHaveLength(2);
    });
  });
});
