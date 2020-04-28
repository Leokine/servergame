import WebSocket from 'ws';
import {onError} from './on-error.js';

import {
	AnyClientMessage,
	AnyServerMessage,
	GameAbortedMessage,
	GameStartedMessage,
	GameSituationFront,
	Color,
	Cell
} from '../../common/messages.js';

interface AssocLetters {
	[index: string]: number;
}

const ASSOC_LETTERS : AssocLetters = {'a' : 1, 'b': 2, 'c' : 3, 'd' : 4, 'e': 5, 'f' : 6, 'g' : 7, 'h' : 8};

/**
 * Класс игры
 * 
 * Запускает игровую сессию.
 */
class Game
{
	/**
	 * Количество игроков в сессии
	 */
	static readonly PLAYERS_IN_SESSION = 2;
	
	/**
	 * Игровая сессия
	 */
	private _session: WebSocket[];

	private _playersSet!:  WeakMap<WebSocket, Color>;

	private _currentMove!: WebSocket;

	private _field!: Array<Array<string>>;
	/**
	 * @param session Сессия игры, содержащая перечень соединений с игроками
	 */
	constructor( session: WebSocket[] )
	{
		this._session = session;
		this._sendStartMessage()
			.then(
				() =>
				{
					this._listenMessages();
				}
			)
			.catch( onError );
	}
	
	/**
	 * Уничтожает данные игровой сессии
	 */
	destroy(): void
	{
		// Можно вызвать только один раз
		this.destroy = () => {};
		
		for ( const player of this._session )
		{
			if (
				( player.readyState !== WebSocket.CLOSED )
				&& ( player.readyState !== WebSocket.CLOSING )
			)
			{
				const message: GameAbortedMessage = {
					type: 'gameAborted',
				};
				
				this._sendMessage( player, message )
					.catch( onError );
				player.close();
			}
		}
		
		// Обнуляем ссылки
		this._session = null as unknown as Game['_session'];
		this._playersSet = null as unknown as Game['_playersSet'];
	}
	
	/**
	 * Отправляет сообщение о начале игры
	 */
	private _sendStartMessage(): Promise<void[]>
	{
		this._field = [];
		this._field = Game._createGame(this._field);
		this._currentMove = this._session[0];
		this._playersSet = new WeakMap<WebSocket, Color>();
		const data: GameStartedMessage = {
			type: 'gameStarted',
			myTurn: true,
			gameField: this._field,
			color: 'w'
		};
		const promises: Promise<void>[] = [];

		for ( const player of this._session )
		{
			promises.push( this._sendMessage( player, data ) );
			this._playersSet.set(player, data.color);
			data.myTurn = false;
			data.color = 'b';
		}
		
		return Promise.all( promises );
	}
	
	/**
	 * Отправляет сообщение игроку
	 * 
	 * @param player Игрок
	 * @param message Сообщение
	 */
	private _sendMessage( player: WebSocket, message: AnyServerMessage ): Promise<void>
	{
		return new Promise(
			( resolve, reject ) =>
			{
				player.send(
					JSON.stringify( message ),
					( error ) =>
					{
						if ( error )
						{
							reject();
							
							return;
						}
						
						resolve();
					}
				)
			},
		);
	}
	
	/**
	 * Добавляет слушателя сообщений от игроков
	 */
	private _listenMessages(): void
	{
		for ( const player of this._session )
		{
			player.on(
				'message',
				( data ) =>
				{
					const message = this._parseMessage( data );
					
					this._processMessage( player, message );
				},
			);
			
			player.on( 'close', () => this.destroy() );
		}
	}
	
	/**
	 * Разбирает полученное сообщение
	 * 
	 * @param data Полученное сообщение
	 */
	private _parseMessage( data: unknown ): AnyClientMessage
	{
		if ( typeof data !== 'string' )
		{
			return {
				type: 'incorrectRequest',
				message: 'Wrong data type',
			};
		}
		
		try
		{
			return JSON.parse( data );
		}
		catch ( error )
		{
			return {
				type: 'incorrectRequest',
				message: 'Can\'t parse JSON data: ' + error,
			};
		}
	}
	
	/**
	 * Выполняет действие, соответствующее полученному сообщению
	 * 
	 * @param player Игрок, от которого поступило сообщение
	 * @param message Сообщение
	 */
	private _processMessage( player: WebSocket, message: AnyClientMessage ): void
	{
		switch ( message.type )
		{
			case 'playerMove':
				this._onPlayerRoll( player, message.move );
				break;
			
			case 'repeatGame':
				this._sendStartMessage()
					.catch( onError );
				break;
			
			case 'incorrectRequest':
				this._sendMessage( player, message )
					.catch( onError );
				break;
			
			case 'incorrectResponse':
				console.error( 'Incorrect response: ', message.message );
				break;
			
			default:
				this._sendMessage(
					player,
					{
						type: 'incorrectRequest',
						message: `Unknown message type: "${(message as AnyClientMessage).type}"`,
					},
				)
					.catch( onError );
				break;
		}
	}

	private static checkDiag(from : Cell, to : Cell) : boolean {
		return Math.abs(from.num - to.num) === Math.abs(ASSOC_LETTERS[to.let] - ASSOC_LETTERS[from.let]);
	}

	private static _removeDiag(field : Array<Array<string>>, from : Cell, to : Cell) : Array<Array<string>> {
		let t_field : Array<Array<string>> = field;
		let temp_to : Cell = (to.num > from.num ? to : from);
		let temp_from : Cell = (to.num < from.num ? to : from);
		let oper : number = (temp_to.let > temp_from.let ? 1 : -1);
		let letvar : string = temp_from.let;
		let temp = 0;
		for (let i : number = temp_from.num + 1; i < temp_to.num; i++) {
			temp = letvar.charCodeAt(0);
			temp += oper;
			letvar = String.fromCharCode(temp);
			t_field[i - 1][ASSOC_LETTERS[letvar] - 1] = '';
		}
		return t_field;
	}

	private _onPlayerRoll( currentPlayer: WebSocket, moveInfo: GameSituationFront ): void
	{
		if ( this._currentMove !== currentPlayer )
		{
			this._sendMessage(
				currentPlayer,
				{
					type: 'incorrectRequest',
					message: 'Not your turn',
				},
			)
				.catch( onError );
			return;
		}

		if (ASSOC_LETTERS[moveInfo.from.let] > 8 || ASSOC_LETTERS[moveInfo.to.let] > 8 || moveInfo.from.num < 1 || moveInfo.to.num < 1)
		{
			this._sendMessage(
				currentPlayer,
				{
					type: 'incorrectRequest',
					message: 'Out of field',
				},
			)
				.catch( onError );
			return;
		}

		if (ASSOC_LETTERS[moveInfo.from.let] === ASSOC_LETTERS[moveInfo.to.let] && moveInfo.from.num === moveInfo.to.num)
		{
			this._sendMessage(
				currentPlayer,
				{
					type: 'incorrectRequest',
					message: 'You have to move',
				},
			)
				.catch( onError );
			return;
		}

		const currentColor: Color = this._playersSet.get(currentPlayer)!;

		let from: string = this._field[moveInfo.from.num - 1][ASSOC_LETTERS[moveInfo.from.let] - 1];
		let to: string = this._field[moveInfo.to.num - 1][ASSOC_LETTERS[moveInfo.to.let] - 1];

		if (from === '' || from[0] !== currentColor || to !== '')
		{
			this._sendMessage(
				currentPlayer,
				{
					type: 'incorrectRequest',
					message: 'Incorrect request',
				},
			)
				.catch( onError );
			return;
		}

		if(!Game.checkDiag(moveInfo.from, moveInfo.to))
		{
			this._sendMessage(
				currentPlayer,
				{
					type: 'incorrectRequest',
					message: 'Incorrect request',
				},
			)
				.catch( onError );
			return;
		}

		let player2: WebSocket = currentPlayer;

		this._field = Game._removeDiag(this._field, moveInfo.from, moveInfo.to);

		this._field[moveInfo.to.num - 1][ASSOC_LETTERS[moveInfo.to.let] - 1] = this._field[moveInfo.from.num - 1][ASSOC_LETTERS[moveInfo.from.let] - 1];
		this._field[moveInfo.from.num - 1][ASSOC_LETTERS[moveInfo.from.let] - 1] = '';

		if( ( ( currentColor === 'w' && moveInfo.to.num === 8 ) || ( currentColor === 'b' && moveInfo.to.num === 1 ) ) && (this._field[moveInfo.to.num - 1][ASSOC_LETTERS[moveInfo.to.let] - 1].length === 1) )
			this._field[moveInfo.to.num - 1][ASSOC_LETTERS[moveInfo.to.let] - 1] += 'K';

		let endgame: number = 0;
		for ( const player of this._session )
		{
			if(player !== currentPlayer)
				player2 = player;
			endgame |= Number(Game._checkWin( this._field, this._playersSet.get(player)! ));
		}

		this._currentMove = player2;

		if ( !endgame )
		{
			this._sendMessage(
				player2,
				{
					type: 'changePlayer',
					myTurn: true,
					gameField: this._field,
					color: (currentColor === 'w' ? 'b' : 'w')
				},
			)
				.catch( onError );
			this._sendMessage(
				currentPlayer,
				{
					type: 'changePlayer',
					myTurn: false,
					gameField: this._field,
					color: currentColor
				},
			)
				.catch( onError );

			return;
		}

		for ( const player of this._session )
		{
			this._sendMessage(
				player,
				{
					type: 'gameResult',
					win: Game._checkWin(this._field, this._playersSet.get(player)!),
				},
			)
				.catch( onError );
		}
	}

	private static _checkWin(field: Array<Array<string>>, color: string): boolean
	{
		let counter : number = 0;
		for(let i: number = 0; i < 8; i++)
		{
			for (let j: number = 0; j < 8; j++)
			{
				if(field[i][j] === '')
					continue;
				if(field[i][j][0] !== color)
					counter++;
			}
		}
		return ( counter === 0 );
	}

	private static _createGame(field: Array<Array<string>>): Array<Array<string>>
	{
		let gameField: Array<Array<string>> = field;
		for (let i : number = 1; i <= 8; i++)
		{
			gameField.push([]);
			for(let j : number = 1; j <= 8; j++) {
				if(i === 4 || i === 5)
				{
					gameField[i - 1].push('');
					continue;
				}
				if( i % 2 === 0 && j % 2 === 0 )
				{
					gameField[i - 1].push(( (i <= 3) ? 'w' : 'b'));
				} else if(i % 2 !== 0 && j % 2 !== 0) {
					gameField[i - 1].push(( (i <= 3) ? 'w' : 'b'));
				} else {
					gameField[i - 1].push('');
				}
			}
		}
		return gameField;
	}
}

export {
	Game,
};
