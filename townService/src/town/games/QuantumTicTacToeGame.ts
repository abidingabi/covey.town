import {
  GameMove,
  QuantumTicTacToeGameState,
  QuantumTicTacToeMove,
} from '../../types/CoveyTownSocket';
import Game from './Game';
import TicTacToeGame from './TicTacToeGame';
import Player from '../../lib/Player';
import InvalidParametersError, {
  GAME_NOT_IN_PROGRESS_MESSAGE,
  INVALID_MOVE_MESSAGE,
  MOVE_NOT_YOUR_TURN_MESSAGE,
} from '../../lib/InvalidParametersError';

/**
 * A QuantumTicTacToeGame is a Game that implements the rules of the Tic-Tac-Toe variant described at https://www.smbc-comics.com/comic/tic.
 * This class acts as a controller for three underlying TicTacToeGame instances, orchestrating the "quantum" rules by taking
 * the role of the monitor.
 */
export default class QuantumTicTacToeGame extends Game<
  QuantumTicTacToeGameState,
  QuantumTicTacToeMove
> {
  private _games: { A: TicTacToeGame; B: TicTacToeGame; C: TicTacToeGame };

  private _won: { A: boolean; B: boolean; C: boolean };

  /**
   * A QuantumTicTacToeGame is a Game that implements the rules of Kriegspiel Tic Tac Toe.
   * @see https://www.smbc-comics.com/comic/tic
   */
  public constructor() {
    super({
      status: 'WAITING_TO_START',
      moves: [],
      xScore: 0,
      oScore: 0,
      publiclyVisible: {
        A: [
          [false, false, false],
          [false, false, false],
          [false, false, false],
        ],
        B: [
          [false, false, false],
          [false, false, false],
          [false, false, false],
        ],
        C: [
          [false, false, false],
          [false, false, false],
          [false, false, false],
        ],
      },
    });

    this._games = {
      A: new TicTacToeGame(),
      B: new TicTacToeGame(),
      C: new TicTacToeGame(),
    };
    this._won = {
      A: false,
      B: false,
      C: false,
    };
  }

  /**
   * Adds a player to the game.
   * Updates the game's state to reflect the new player.
   * If the game is now full (has two players), updates the game's state to set the status to IN_PROGRESS.
   *
   * @param player The player to join the game
   * @throws InvalidParametersError if the player is already in the game (PLAYER_ALREADY_IN_GAME_MESSAGE)
   *  or the game is full (GAME_FULL_MESSAGE)
   */
  protected _join(player: Player): void {
    for (const [, game] of Object.entries(this._games)) {
      game.join(player);
    }

    this.state = {
      ...this.state,
      x: this._games.A.state.x,
      o: this._games.A.state.o,
      status: this._games.A.state.status,
    };
  }

  protected _leave(player: Player): void {
    for (const [, game] of Object.entries(this._games)) {
      game.leave(player);
    }

    this.state = {
      ...this.state,
      x: this._games.A.state.x,
      o: this._games.A.state.o,
      status: this._games.A.state.status,
      winner: this._games.A.state.winner,
    };
  }

  /**
   * Checks that the given move is "valid": that it's the right
   * player's turn, that the game is actually in-progress, etc.
   * @see TicTacToeGame#_validateMove
   */
  private _validateMove(move: GameMove<QuantumTicTacToeMove>): void {
    // A move is valid if either the space is empty, or the opponent moved
    // there and the space is not public
    for (const m of this.state.moves) {
      if (
        m.board === move.move.board &&
        m.col === move.move.col &&
        m.row === move.move.row &&
        (m.gamePiece === move.move.gamePiece || this.state.publiclyVisible[m.board][m.row][m.col])
      ) {
        throw new InvalidParametersError(INVALID_MOVE_MESSAGE);
      }
    }

    // A move is only valid if the game is not won.
    if (this._won[move.move.board]) {
      throw new InvalidParametersError(INVALID_MOVE_MESSAGE);
    }

    // A move is only valid if it is the player's turn
    if (move.move.gamePiece === 'X' && this.state.moves.length % 2 === 1) {
      throw new InvalidParametersError(MOVE_NOT_YOUR_TURN_MESSAGE);
    } else if (move.move.gamePiece === 'O' && this.state.moves.length % 2 === 0) {
      throw new InvalidParametersError(MOVE_NOT_YOUR_TURN_MESSAGE);
    }

    // A move is valid only if game is in progress
    if (this.state.status !== 'IN_PROGRESS') {
      throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    }
  }

  public applyMove(move: GameMove<QuantumTicTacToeMove>): void {
    this._validateMove(move);

    let isCollision = false;
    for (const m of this.state.moves) {
      if (m.board === move.move.board && m.col === move.move.col && m.row === move.move.row) {
        this.state.publiclyVisible[m.board][m.row][m.col] = true;
        isCollision = true;
      }
    }

    this.state = {
      ...this.state,
      moves: [...this.state.moves, move.move],
    };

    if (!isCollision) {
      this._games[move.move.board].applyMoveWithoutValidation(move.move);
    }

    this._checkForWins();
    this._checkForGameEnding();
  }

  /**
   * Checks all three sub-games for any new three-in-a-row conditions.
   * Awards points and marks boards as "won" so they can't be played on.
   * Also marks won boards as visible.
   */
  private _checkForWins(): void {
    for (const [boardString, game] of Object.entries(this._games)) {
      const board: 'A' | 'B' | 'C' = boardString as 'A' | 'B' | 'C';
      if (game.state.winner !== undefined && !this._won[board]) {
        this._won[board] = true;

        if (game.state.winner === this.state.x) {
          this.state = {
            ...this.state,
            xScore: this.state.xScore + 1,
          };
        } else {
          this.state = {
            ...this.state,
            oScore: this.state.oScore + 1,
          };
        }
      }
    }
  }

  /**
   * A Quantum Tic-Tac-Toe game ends when no more moves are possible.
   * This happens when all squares on all boards are either occupied or part of a won board.
   */
  private _checkForGameEnding(): void {
    for (const [, game] of Object.entries(this._games)) {
      if (game.state.status !== 'OVER') {
        // at least one of the games still has possible moves
        return;
      }
    }

    this.state = {
      ...this.state,
      status: 'OVER',
    };
    if (this.state.xScore > this.state.oScore) {
      this.state = {
        ...this.state,
        winner: this.state.x,
      };
    } else if (this.state.oScore > this.state.xScore) {
      this.state = {
        ...this.state,
        winner: this.state.o,
      };
    }
  }
}
