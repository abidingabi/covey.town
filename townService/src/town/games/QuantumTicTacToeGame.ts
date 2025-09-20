import {
  GameMove,
  QuantumTicTacToeGameState,
  QuantumTicTacToeMove,
} from '../../types/CoveyTownSocket';
import Game from './Game';
import TicTacToeGame from './TicTacToeGame';
import Player from '../../lib/Player';

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

  private _xScore: number;

  private _oScore: number;

  private _moveCount: number;

  /**
   * A QuantumTicTacToeGame is a Game that implements the rules of Kriegspiel Tic Tac Toe.
   * @see https://www.smbc-comics.com/comic/tic
   */
  public constructor() {
    let noMovesVisible = [
      [false, false, false],
      [false, false, false],
      [false, false, false],
    ];
    super({
      status: 'WAITING_TO_START',
      moves: [],
      xScore: 0,
      oScore: 0,
      publiclyVisible: {
        A: noMovesVisible,
        B: noMovesVisible,
        C: noMovesVisible,
      },
    });

    this._games = { A: new TicTacToeGame(), B: new TicTacToeGame(), C: new TicTacToeGame() };
    this._xScore = this.state.xScore;
    this._oScore = this.state.oScore;
    this._moveCount = this.state.moves.length;
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
    this._games.A.join(player);
    this._games.B.join(player);
    this._games.C.join(player);

    this.state = {
      ...this.state,
      x: this._games.A.state.x,
      o: this._games.A.state.o,
      status: this._games.A.state.status,
    };
  }

  protected _leave(player: Player): void {
    this._games.A.leave(player);
    this._games.B.leave(player);
    this._games.C.leave(player);

    this.state = {
      ...this.state,
      x: this._games.A.state.x,
      o: this._games.A.state.o,
      status: this._games.A.state.status,
    };
  }

  /**
   * Checks that the given move is "valid": that the it's the right
   * player's turn, that the game is actually in-progress, etc.
   * @see TicTacToeGame#_validateMove
   */
  private _validateMove(move: GameMove<QuantumTicTacToeMove>): void {
    // TODO: implement me
  }

  public applyMove(move: GameMove<QuantumTicTacToeMove>): void {
    this._validateMove(move);

    // TODO: implement the guts of this method

    this._checkForWins();
    this._checkForGameEnding();
  }

  /**
   * Checks all three sub-games for any new three-in-a-row conditions.
   * Awards points and marks boards as "won" so they can't be played on.
   */
  private _checkForWins(): void {
    // TODO: implement me
  }

  /**
   * A Quantum Tic-Tac-Toe game ends when no more moves are possible.
   * This happens when all squares on all boards are either occupied or part of a won board.
   */
  private _checkForGameEnding(): void {
    // TODO: implement me
  }
}
