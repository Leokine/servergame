import { openScreen } from './screens.js';
import * as GameScreen from './screens/game.js';
import * as ResultScreen from './screens/result.js';
import {GameSituationFront, Color} from "../common/messages";

GameScreen.setTurnHandler( turnHandler );
ResultScreen.setRestartHandler( restartHandler );

/**
 * Отправляет сообщение на сервер
 */
let sendMessage: typeof import( './connection.js' ).sendMessage;

/**
 * Устанавливает функцию отправки сообщений на сервер
 * 
 * @param sendMessageFunction Функция отправки сообщений
 */
function setSendMessage( sendMessageFunction: typeof sendMessage ): void
{
	sendMessage = sendMessageFunction;
}

/**
 * Обрабатывает ход игрока
 * 
 * @param move Загаданное пользователем число
 */
function turnHandler( move: GameSituationFront ): void
{
	sendMessage( {
		type: 'playerMove',
		move: move,
	} );
}

/**
 * Обрабатывает перезапуск игры
 */
function restartHandler(): void
{
	sendMessage( {
		type: 'repeatGame',
	} );
}

/**
 * Начинает игру
 */
function startGame(): void
{
	openScreen( 'game' );
}

/**
 * Меняет активного игрока
 *
 * @param myTurn Ход текущего игрока?
 * @param gameField игровое поле
 * @param color
 */
function changePlayer( myTurn: boolean, gameField: Array<Array<string>>, color: Color ): void
{
	GameScreen.update( myTurn, gameField, color );
}

/**
 * Завершает игру
 * 
 * @param result Результат игры
 */
function endGame( result: 'win' | 'loose' | 'abort' ): void
{
	ResultScreen.update( result );
	openScreen( 'result' );
}

export {
	startGame,
	changePlayer,
	endGame,
	setSendMessage,
};
